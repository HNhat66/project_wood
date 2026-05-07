import {
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  useAuth,
  usePermissions,
} from '@/lib/auth-context';
import { queryKeys } from '@/lib/react-query';
import { useCartStore } from '@/lib/stores/cart-store';
import {
  CartProduct,
  GroupedCartResponse,
} from '@/lib/types';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import APIClient from '../api';

// Query keys
export const cartKeys = {
  all: ['cart'] as const,
  myCart: () => [...cartKeys.all, 'my-cart'] as const,
}

// Enhanced cart hook with clear separation between guest and authenticated flows
// Only accessible by users (not admin/employee)
export const useCart = () => {
  const { user, tokens } = useAuth()
  const { onlyUserAndGuest } = usePermissions()
  const queryClient = useQueryClient()
  const cartStore = useCartStore()
  const migrationAttempted = useRef(false)
  const router = useRouter()

  // Check if user can access cart features
  const canUseCart = onlyUserAndGuest()

  // Clear localStorage when user becomes authenticated
  useEffect(() => {
    if (user && tokens.accessToken && canUseCart) {
      // Just clear guest cart immediately to prevent conflicts if it's empty
      // Migration will be handled by a separate effect below
      const localCartItems = cartStore.items
      if (localCartItems.length === 0) {
        localStorage.removeItem('guest-cart-storage')
        cartStore.clearLocalCart()
      }
    }
  }, [user, tokens.accessToken, canUseCart])

  // Reset migration flag when user changes
  useEffect(() => {
    migrationAttempted.current = false
  }, [user?.id])

  // Server cart query (only for authenticated users who can access cart)
  const {
    data: serverCartData,
    isLoading: isServerLoading,
    error: serverError,
    refetch: refetchServerCart
  } = useQuery({
    queryKey: cartKeys.myCart(),
    queryFn: async (): Promise<GroupedCartResponse | null> => {
      if (!user || !tokens.accessToken || !canUseCart) return null

      const api = new APIClient(tokens)
      const response = await api.cart().getMyCart()
      return response.data
    },
    enabled: !!user && !!tokens.accessToken && canUseCart,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message.includes('network')) {
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Helper function to recalculate totals from cart items
  const recalculateTotals = useCallback((cartItems: CartProduct[]) => {
    const totalItems = cartItems.reduce((acc, product) => {
      return acc + product.variants.reduce((variantAcc, variant) => variantAcc + variant.quantity, 0)
    }, 0)

    const totalAmount = cartItems.reduce((acc, product) => {
      return acc + product.variants.reduce((variantAcc, variant) =>
        variantAcc + (parseFloat(variant.price) * variant.quantity), 0)
    }, 0)

    return { totalItems, totalAmount }
  }, [])

  // Add to cart mutation for authenticated users
  const addToCartMutation = useMutation({
    mutationFn: async (data: {
      productVariantId: number
      quantity: number
    }) => {
      if (!user || !tokens.accessToken || !canUseCart) {
        throw new Error('User not authenticated or not authorized to use cart')
      }
      

      const api = new APIClient(tokens)
      const variant = await api.productVariant().getProductVariantById(data.productVariantId)
      if (variant.data.stockQuantity < data.quantity) {
        throw new Error('Sản phẩm đã hết hàng')
      }
      return await api.cart().addToCart(data)
    },
    onMutate: async () => {
      if (!canUseCart) return

      await queryClient.cancelQueries({ queryKey: cartKeys.myCart() })

      cartStore.setError(null)

      // Get previous data for rollback
      const previousCart = queryClient.getQueryData<GroupedCartResponse>(cartKeys.myCart())

      // Return context for potential rollback
      return { previousCart }
    },
    onSuccess: (response, _variables, _context) => {
      if (!canUseCart) return


      // Update cache with fresh data from server
      if (response.data) {
        queryClient.setQueryData(cartKeys.myCart(), response.data)
      }

      toast.success('Đã thêm sản phẩm vào giỏ hàng')
    },
    onError: (error, _variables, context) => {
      if (!canUseCart) return

      cartStore.setError(error.message)

      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.myCart(), context.previousCart)
      }

      toast.error(error.message || 'Không thể thêm sản phẩm. Vui lòng thử lại.')
    }
  })

  // Update cart item mutation for authenticated users
  const updateCartItemMutation = useMutation({
    mutationFn: async (data: {
      productVariantId: number
      quantity: number
    }) => {
      if (!user || !tokens.accessToken || !canUseCart) {
        throw new Error('User not authenticated or not authorized to use cart')
      }

      const api = new APIClient(tokens)
      return await api.cart().updateCartItem(data)
    },
    onMutate: async (variables) => {
      if (!canUseCart) return

      await queryClient.cancelQueries({ queryKey: cartKeys.myCart() })

      cartStore.setError(null)

      // Get previous data for rollback
      const previousCart = queryClient.getQueryData<GroupedCartResponse>(cartKeys.myCart())

      // Optimistically update the cache
      if (previousCart) {
        const updatedCart = {
          ...previousCart,
          cartItems: previousCart.cartItems.map(product => ({
            ...product,
            variants: product.variants.map(variant =>
              variant.productVariantId === variables.productVariantId
                ? { ...variant, quantity: variables.quantity }
                : variant
            )
          }))
        }

        queryClient.setQueryData(cartKeys.myCart(), updatedCart)
      }

      return { previousCart }
    },
    onSuccess: (response, _variables, _context) => {
      if (!canUseCart) return

      if (response.data) {
        queryClient.setQueryData(cartKeys.myCart(), response.data)
      }

      toast.success('Đã cập nhật giỏ hàng')
    },
    onError: (error, _variables, context) => {
      if (!canUseCart) return

      cartStore.setError(error.message)

      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.myCart(), context.previousCart)
      }

      toast.error(error.message || 'Không thể cập nhật giỏ hàng. Vui lòng thử lại.')
    }
  })

  // Remove cart item mutation for authenticated users
  const removeCartItemMutation = useMutation({
    mutationFn: async (data: {
      productVariantId: number
    }) => {
      if (!user || !tokens.accessToken || !canUseCart) {
        throw new Error('User not authenticated or not authorized to use cart')
      }

      const api = new APIClient(tokens)
      return await api.cart().removeFromCart(data)
    },
    onMutate: async (data) => {
      if (!canUseCart) return

      await queryClient.cancelQueries({ queryKey: cartKeys.myCart() })

      cartStore.setError(null)

      const previousCart = queryClient.getQueryData<GroupedCartResponse>(cartKeys.myCart())

      if (previousCart) {
        const updatedCart = {
          ...previousCart,
          cartItems: previousCart.cartItems.map(product => ({
            ...product,
            variants: product.variants.filter(variant =>
              variant.productVariantId !== data.productVariantId
            )
          })).filter(product => product.variants.length > 0)
        }

        const newTotals = recalculateTotals(updatedCart.cartItems)
        updatedCart.totalItems = newTotals.totalItems
        updatedCart.totalAmount = newTotals.totalAmount

        queryClient.setQueryData(cartKeys.myCart(), updatedCart)
      }

      return { previousCart }
    },
    onSuccess: (response, _data, _context) => {
      if (!canUseCart) return

      if (response.data) {
        queryClient.setQueryData(cartKeys.myCart(), response.data)
      }

      toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
    },
    onError: (error, _data, context) => {
      if (!canUseCart) return

      cartStore.setError(error.message)

      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.myCart(), context.previousCart)
      }

      toast.error(error.message || 'Không thể xóa sản phẩm. Vui lòng thử lại.')
    }
  })

  // Clear cart mutation for authenticated users
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!user || !tokens.accessToken || !canUseCart) {
        throw new Error('User not authenticated or not authorized to use cart')
      }

      const api = new APIClient(tokens)
      return await api.cart().clearCart()
    },
    onMutate: async () => {
      if (!canUseCart) return

      await queryClient.cancelQueries({ queryKey: cartKeys.myCart() })

      cartStore.setError(null)

      const previousCart = queryClient.getQueryData<GroupedCartResponse>(cartKeys.myCart())

      // Optimistically clear cart
      queryClient.setQueryData(cartKeys.myCart(), {
        ...previousCart,
        cartItems: [],
        totalItems: 0,
        totalAmount: 0
      })

      return { previousCart }
    },
    onSuccess: (response, _variables, _context) => {
      if (!canUseCart) return

      if (response.data) {
        queryClient.setQueryData(cartKeys.myCart(), response.data)
      }

      toast.success('Đã xóa tất cả sản phẩm khỏi giỏ hàng')
    },
    onError: (error, _variables, context) => {
      if (!canUseCart) return

      cartStore.setError(error.message)

      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.myCart(), context.previousCart)
      }

      toast.error(error.message || 'Không thể xóa giỏ hàng. Vui lòng thử lại.')
    }
  })

  // Checkout mutation for authenticated users
  const checkoutMutation = useMutation({
    mutationFn: async (data: {
      deliveryAddressId: number
      deliveryType: string
      notes?: string
    }) => {
      if (!user || !tokens.accessToken || !canUseCart) {
        throw new Error('User not authenticated or not authorized to checkout')
      }
      const api = new APIClient(tokens)
      return await api.cart().checkout(data)
    },
    onMutate: () => {
      if (!canUseCart) return
      cartStore.setError(null)
    },
    onSuccess: (response) => {
      if (!canUseCart) return

      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: cartKeys.myCart() })
      toast.success('Đặt hàng thành công! Hãy tải lên bằng chứng thanh toán.')
      // Redirect to payment upload page instead of orders
      router.push(`/orders/${response.data.orderNumber}/payment`)
    },
    onError: (error, _variables) => {
      if (!canUseCart) return

      cartStore.setError(error.message)
      toast.error(error.message || 'Không thể đặt hàng. Vui lòng thử lại.')
    }
  })

  // Helper function to add item to local cart (for guest users only)
  const addToLocalCart = useCallback(async (item: {
    productId: number
    variantId: number
    quantity: number
    price: string
    productName: string
    materialName: string
    sizeName: string
    thumbnailUrl: string
    sizeId: number
    materialId: number
    productCategory: string
  }) => {
    if (!canUseCart) {
      toast.error('Tính năng giỏ hàng chỉ dành cho khách hàng')
      return
    }

    const cartItem: CartProduct = {
      product: {
        id: item.productId,
        name: item.productName,
        category: item.productCategory,
        thumbnailUrl: item.thumbnailUrl
      },
      variants: [{
        materialId: item.materialId,
        materialName: item.materialName,
        sizeId: item.sizeId,
        sizeName: item.sizeName,
        price: item.price,
        quantity: item.quantity,
        productVariantId: item.variantId
      }]
    }
    // Check if the variant is out of stock
    const api = new APIClient(tokens)
    const variant = await api.productVariant().getProductVariantById(item.variantId)
    cartStore.addItem(cartItem, variant.data.stockQuantity)
  }, [cartStore, canUseCart])

  // Calculate totals from grouped cart data
  const getServerTotals = useCallback(() => {
    if (!serverCartData || !canUseCart) return { totalItems: 0, totalPrice: 0 }

    return {
      totalItems: serverCartData.totalItems,
      totalPrice: serverCartData.totalAmount
    }
  }, [serverCartData, canUseCart])

  const serverTotals = getServerTotals()

  // Determine which cart to use based on authentication and permissions
  const isAuthenticated = !!user
  const items = (isAuthenticated && canUseCart) ? [] : (canUseCart ? cartStore.items : [])
  const totalItems = (isAuthenticated && canUseCart) ? serverTotals.totalItems : (canUseCart ? cartStore.getTotalItems() : 0)
  const totalPrice = (isAuthenticated && canUseCart) ? serverTotals.totalPrice : (canUseCart ? cartStore.getTotalPrice() : 0)

  // Combine all loading states for better UX
  const isLoading = canUseCart ? (isAuthenticated ?
    (isServerLoading || addToCartMutation.isPending || updateCartItemMutation.isPending || removeCartItemMutation.isPending || clearCartMutation.isPending) :
    (cartStore.isLoading || addToCartMutation.isPending || updateCartItemMutation.isPending || removeCartItemMutation.isPending || clearCartMutation.isPending)) : false

  // Cart migration effect - runs after mutations are defined
  useEffect(() => {
    if (user && tokens.accessToken && !migrationAttempted.current && canUseCart) {
      const localCartItems = cartStore.items
      if (localCartItems.length > 0) {
        // Mark migration as attempted to prevent re-runs
        migrationAttempted.current = true

        // Migrate guest cart to server cart when user logs in
        const migrateGuestCartToServer = async () => {
          try {
            cartStore.setError(null)

            // Loop through all local cart items
            for (const item of localCartItems) {
              // Loop through all variants of each product
              for (const variant of item.variants) {
                try {
                  // Call server add to cart API for each variant
                  await addToCartMutation.mutateAsync({
                    productVariantId: variant.productVariantId, // Assuming this maps to productVariantId
                    quantity: variant.quantity
                  })
                } catch (error) {
                  console.error(`Failed to migrate variant ${variant.materialId} of product ${item.product.id}:`, error)
                  // Continue with other items even if one fails
                }
              }
            }

            // Clear guest cart from localStorage after successful migration
            localStorage.removeItem('guest-cart-storage')
            cartStore.clearLocalCart()

            toast.success('Đã đồng bộ giỏ hàng thành công!')
          } catch (error) {
            console.error('Failed to migrate cart:', error)
            toast.error('Có lỗi khi đồng bộ giỏ hàng. Vui lòng thử lại.')
            // Reset flag on error so user can retry
            migrationAttempted.current = false
          }
        }

        migrateGuestCartToServer()
      }
    }
  }, [user, tokens.accessToken, canUseCart, addToCartMutation])

  // Create disabled actions for when cart is not available
  const disabledAction = useCallback(() => {
    toast.error('Tính năng giỏ hàng chỉ dành cho khách hàng')
  }, [])

  const disabledServerAction = useCallback(() => {
    toast.error('Tính năng giỏ hàng chỉ dành cho khách hàng')
  }, [])

  // Return appropriate interface based on permissions
  if (!canUseCart) {
    return {
      // State - empty/disabled
      items: [],
      serverCartData: null,
      totalItems: 0,
      totalPrice: 0,
      isOpen: false,

      // Loading states - all false
      isLoading: false,
      isAdding: false,
      isUpdating: false,
      isRemoving: false,
      isCheckingOut: false,

      // Authentication state
      isAuthenticated: !!user,

      // Error state
      error: null,

      // Actions - all disabled
      addToCart: {
        server: disabledServerAction,
        local: disabledAction
      },

      updateCartItem: {
        server: disabledServerAction,
        local: disabledAction
      },

      removeCartItem: {
        server: disabledServerAction,
        local: disabledAction
      },

      clearCart: {
        server: disabledServerAction,
        local: disabledAction
      },

      checkout: {
        server: disabledServerAction,
        local: disabledServerAction
      },

      // UI actions - disabled
      openCart: disabledAction,
      closeCart: () => { }, // Allow closing
      toggleCart: disabledAction,

      // Utilities - disabled
      refetchServerCart: () => { },
      resetError: () => { },
    }
  }

  return {
    // State - switches between guest and authenticated data
    items,
    serverCartData: serverCartData, // Raw grouped cart data for authenticated users
    totalItems,
    totalPrice,
    isOpen: cartStore.isOpen,

    // Loading states
    isLoading,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateCartItemMutation.isPending,
    isRemoving: removeCartItemMutation.isPending,
    isCheckingOut: checkoutMutation.isPending,

    // Authentication state
    isAuthenticated,

    // Error state
    error: cartStore.error || serverError?.message,

    // Actions - switches between guest and authenticated operations
    addToCart: {
      server: (data: { productVariantId: number; quantity: number }) => {
        addToCartMutation.mutate(data)
      },
      local: addToLocalCart
    },

    updateCartItem: {
      server: (data: { productVariantId: number; quantity: number }) => {
        updateCartItemMutation.mutate(data)
      },
      local: (productId: number, materialId: number, sizeId: number, quantity: number) => {
        cartStore.updateQuantity(productId, materialId, sizeId, quantity)
      }
    },

    removeCartItem: {
      server: (productVariantId: number) => {
        removeCartItemMutation.mutate({ productVariantId })
      },
      local: (productId: number, materialId: number, sizeId: number) => {
        cartStore.removeItem(productId, materialId, sizeId)
      }
    },

    clearCart: {
      server: () => {
        clearCartMutation.mutate()
      },
      local: () => {
        cartStore.clearLocalCart()
      }
    },

    checkout: {
      server: (data: {
        deliveryAddressId: number
        deliveryType: string
        notes?: string
      }) => {
        checkoutMutation.mutate(data)
      },
      local: () => {
        throw new Error('Checkout requires authentication')
      }
    },

    // UI actions
    openCart: () => {
      cartStore.openCart()
    },
    closeCart: cartStore.closeCart,
    toggleCart: () => {
      cartStore.toggleCart()
    },

    // Utilities
    refetchServerCart: refetchServerCart,
    resetError: () => {
      cartStore.setError(null)
    },

  }
} 