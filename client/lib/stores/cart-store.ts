import { toast } from 'sonner';
import {
  create,
  StateCreator,
} from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import { CartStore } from '@/lib/types';

// Create base store for guest cart only
const createCartStore = (): StateCreator<CartStore> => (set, get) => ({
  // Initial state
  items: [],
  isOpen: false,
  isLoading: false,
  error: null,

  // Local cart actions (for guest users only)
  addItem: (newItem, stockQuantity) => {
    const items = get().items
    const existingItemIndex = items.findIndex(
      item => item.product.id === newItem.product.id
    )
    if (existingItemIndex > -1) {
      const existingItem = items[existingItemIndex]
      const variantIndex = existingItem.variants.findIndex(
        variant => variant.materialId === newItem.variants[0].materialId && variant.sizeId === newItem.variants[0].sizeId
      )
      if (variantIndex > -1) {
        if (stockQuantity < items[existingItemIndex].variants[variantIndex].quantity + newItem.variants[0].quantity) {
          toast.error('Đã đạt số lượng tối đa của sản phẩm')
          return;
        }
        // Update existing vsariant quantity
        const updatedItems = [...items]
        updatedItems[existingItemIndex].variants[variantIndex].quantity += newItem.variants[0].quantity
        set({ items: updatedItems })
        toast.success('Đã thêm sản phẩm vào giỏ hàng')
      } else {
        if (stockQuantity < newItem.variants[0].quantity) {
          toast.error('Đã đạt số lượng tối đa của sản phẩm')
          return;
        }
        // Add new variant
        const updatedItems = [...items]
        updatedItems[existingItemIndex].variants.push(newItem.variants[0])
        set({ items: updatedItems })  
        toast.success('Đã thêm sản phẩm vào giỏ hàng')
      }
    } else {
      // Add new item
      if (stockQuantity < newItem.variants[0].quantity) {
        toast.error('Đã đạt số lượng tối đa của sản phẩm')
        return;
      }
      const newItemWithVariant = { ...newItem, variants: [newItem.variants[0]] }
      set({ items: [...items, newItemWithVariant] })
      toast.success('Đã thêm sản phẩm vào giỏ hàng')
    }
  },

  removeItem: (id, materialId, sizeId) => {
    set(state => {
      const updatedItems = state.items.map(item => {
        if (item.product.id === id) {
          const updatedVariants = item.variants.filter(
            variant => !(variant.materialId === materialId && variant.sizeId === sizeId)
          )
          return { ...item, variants: updatedVariants }
        }
        return item
      }).filter(item => item.variants.length > 0) // Remove items with no variants
      
      return { items: updatedItems }
    })
  },

  updateQuantity: (id, materialId, sizeId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id, materialId, sizeId)
      return
    }
    
    set(state => ({
      items: state.items.map(item =>
        item.product.id === id 
          ? { 
              ...item, 
              variants: item.variants.map(variant => 
                variant.materialId === materialId && variant.sizeId === sizeId 
                  ? { ...variant, quantity } 
                  : variant
              ) 
            } 
          : item
      )
    }))
  },

  clearLocalCart: () => {
    set({ items: [] })
  },

  // Loading state actions
  setLoading: (loading) => set({ isLoading: loading }),

  // Error handling actions
  setError: (error) => set({ error }),

  // Computed values
  getTotalItems: () => {
    return get().items.reduce((total, item) => 
      total + item.variants.reduce((variantTotal, variant) => 
        variantTotal + variant.quantity, 0
      ), 0
    )
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) =>
      total + item.variants.reduce((variantTotal, variant) => 
        variantTotal + (parseFloat(variant.price) * variant.quantity), 0
      ), 0
    )
  },

  // UI Actions
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

  // Utils
  findLocalItem: (productId, materialId, sizeId) => {
    const items = get().items
    const itemIndex = items.findIndex(item => item.product.id === productId)
    
    if (itemIndex === -1) return null
    
    const variantIndex = items[itemIndex].variants.findIndex(
      variant => variant.materialId === materialId && variant.sizeId === sizeId
    )
    
    if (variantIndex === -1) return null
    
    return { itemIndex, variantIndex }
  }
})

// Create store with localStorage persistence (only for guest users)
export const useCartStore = create<CartStore>()(
  persist(
    createCartStore(),
    {
      name: 'guest-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist all state for guest users
      partialize: (state: CartStore) => ({
        items: state.items,
        isOpen: state.isOpen
      }),
      skipHydration: false,
    }
  )
) 