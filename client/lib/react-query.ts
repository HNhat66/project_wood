import {
  DefaultOptions,
  QueryClient,
} from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 2
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
  },
}

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

// Query Keys Factory
export const queryKeys = {
  // Auth
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    detail: (id: number) => ['categories', id] as const,
  },
  
  // Materials
  materials: {
    all: ['materials'] as const,
    active: ['materials', 'active'] as const,
    detail: (id: number) => ['materials', id] as const,
  },
  
  // Sizes
  sizes: {
    all: ['sizes'] as const,
    standard: ['sizes', 'standard'] as const,
    active: ['sizes', 'active'] as const,
    detail: (id: number) => ['sizes', id] as const,
  },
  
  // Products
  products: {
    all: ['products'] as const,
    list: (params: any) => ['products', 'list', params] as const,
    detail: (id: number) => ['products', id] as const,
    byCategory: (categoryId: number) => ['products', 'category', categoryId] as const,
  },
  
  // Product Variants
  productVariants: {
    all: ['product-variants'] as const,
    list: (params: any) => ['product-variants', 'list', params] as const,
    detail: (id: number) => ['product-variants', id] as const,
    lowStock: ['product-variants', 'low-stock'] as const,
    inventoryHistory: (id: number) => ['product-variants', id, 'inventory-history'] as const,
    byProduct: (productId: number) => ['product-variants', 'product', productId] as const,
  },
  
  // Customers
  customers: {
    all: ['customers'] as const,
    list: (params: any) => ['customers', 'list', params] as const,
    detail: (id: number) => ['customers', id] as const,
  },
  
  // Cart
  cart: {
    byCustomer: (customerId: number) => ['cart', 'customer', customerId] as const,
  },
  
  // Custom Requests
  customRequests: {
    all: ['custom-requests'] as const,
    list: (params: any) => ['custom-requests', 'list', params] as const,
    detail: (id: number) => ['custom-requests', id] as const,
    pending: ['custom-requests', 'pending'] as const,
    quoted: ['custom-requests', 'quoted'] as const,
    byCustomer: (customerId: number) => ['custom-requests', 'customer', customerId] as const,
  },
  
  // Orders
  orders: {
    all: ['orders'] as const,
    list: (params: any) => ['orders', 'list', params] as const,
    detail: (id: number) => ['orders', id] as const,
    byCustomer: (customerId: number) => ['orders', 'customer', customerId] as const,
  },
  
  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    recentActivity: ['dashboard', 'recent-activity'] as const,
    salesAnalytics: ['dashboard', 'sales-analytics'] as const,
  },
  
  // Addresses
  addresses: {
    all: ['addresses'] as const,
    detail: (id: number) => ['addresses', id] as const,
  },
} as const

// Utility function to invalidate related queries
export const invalidateQueries = {
  products: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.productVariants.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
  },
  
  productVariants: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.productVariants.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
  },
  
  categories: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
  },
  
  materials: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.productVariants.all })
  },
  
  sizes: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sizes.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.productVariants.all })
  },
  
  customers: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
  },
  
  orders: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentActivity })
  },
  
  customRequests: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customRequests.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentActivity })
  },
  
  cart: (customerId?: number) => {
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.byCustomer(customerId) })
    } else {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  },
  
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentActivity })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.salesAnalytics })
  },
  
  addresses: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all })
  },
} 