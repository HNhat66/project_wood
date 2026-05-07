// User & Authentication Types
export enum OrderStatus {
  AWAITING_PAYMENT_PROOF = 'awaiting_payment_proof',
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  DELIVERY = 'delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.AWAITING_PAYMENT_PROOF]: 'Đang chờ thanh toán',
  [OrderStatus.PENDING]: 'Đang chờ',
  [OrderStatus.APPROVED]: 'Đã duyệt',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.DELIVERY]: 'Đang giao',
  [OrderStatus.COMPLETED]: 'Hoàn thành',
  [OrderStatus.CANCELLED]: 'Đã hủy',
}
export const OrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.AWAITING_PAYMENT_PROOF]: [OrderStatus.CANCELLED],
  [OrderStatus.PENDING]: [OrderStatus.APPROVED, OrderStatus.CANCELLED],
  [OrderStatus.APPROVED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
}
export const OrderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.AWAITING_PAYMENT_PROOF]: 'bg-orange-100 text-orange-800',
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.APPROVED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800',
  [OrderStatus.DELIVERY]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
}
export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  USER = 'user',
  GUEST = 'guest'
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}

// Auth Context Types
export interface AuthContextType {
  user: User | null
  isLoading: boolean
  logoutLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (profile: {
    fullName?: string
    phone?: string
    address?: string
    dateOfBirth?: string
    gender?: 'male' | 'female' | 'other'
  }) => Promise<{ success: boolean; error?: string }>
  tokens: { accessToken: string | undefined, refreshToken: string | undefined }
}

// Cart Types
export interface CartVariant {
  materialId: number;
  productVariantId: number;
  materialName: string;
  sizeId: number;
  sizeName: string;
  price: string;
  quantity: number;
}

export interface CartProduct {
  product: {
    id: number;
    name: string;
    category: string;
    thumbnailUrl?: string;
  };
  variants: CartVariant[];
}

export interface GroupedCartResponse {
  userId: number;
  cartItems: CartProduct[];
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartState {
  // Local cart state (for guest users only)
  items: CartProduct[]
  isOpen: boolean

  // Loading states (for UI feedback)
  isLoading: boolean

  // Error handling
  error: string | null
}

export interface CartStore extends CartState {
  // Local cart actions (for guest users only)
  addItem: (item: CartProduct, stockQuantity: number) => void
  removeItem: (id: number, materialId: number, sizeId: number) => void
  updateQuantity: (id: number, materialId: number, sizeId: number, quantity: number) => void
  clearLocalCart: () => void

  // Loading state actions
  setLoading: (loading: boolean) => void

  // Error handling actions
  setError: (error: string | null) => void

  // Computed values
  getTotalItems: () => number
  getTotalPrice: () => number

  // UI Actions
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Utils
  findLocalItem: (productId: number, materialId: number, sizeId: number) => { itemIndex: number; variantIndex: number } | null
}

// UI Store Types
export interface UIStore {
  // Loading states
  isLoading: boolean
  loadingText?: string

  // Sidebar state
  sidebarOpen: boolean

  // Modal states
  modals: {
    authModal: boolean
    productModal: boolean
    customOrderModal: boolean
    confirmDialog: boolean
  }

  // Confirmation dialog
  confirmDialog: {
    isOpen: boolean
    title: string
    message: string
    onConfirm?: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
  }

  // Toast notifications

  // Mobile menu
  isMobileMenuOpen: boolean

  // Error handling
  error: string | null

  // Actions
  setLoading: (loading: boolean, text?: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openModal: (modal: keyof UIStore['modals']) => void
  closeModal: (modal: keyof UIStore['modals']) => void
  closeAllModals: () => void

  showConfirmDialog: (config: {
    title: string
    message: string
    onConfirm?: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
  }) => void
  hideConfirmDialog: () => void

  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Form Types
export interface UpdateProfileForm {
  fullName: string
  phone: string
  address: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
}

export interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Component Props Types
export interface QueryProviderProps {
  children: React.ReactNode
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface ErrorMessageProps {
  message: string
  title?: string
  onRetry?: () => void
}

export interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: number, variantId: number) => void
  onViewDetails?: (productId: number) => void
  className?: string
}

export interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  mode: 'create' | 'edit' | 'view'
  onSuccess?: () => void
}

export interface ProductModalFormData {
  name: string
  description: string
  basePrice: number
  categoryId: number
  isActive: boolean
}

export interface OrdersTableProps {
  // Filter states passed from parent
  currentPage: number
  rowsPerPage: number
  statusFilter: string
  channelFilter?: string
  customerIdFilter?: string
  userIdFilter?: string
  searchFilter?: string

  // Pagination handlers
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void

  // Filter handlers  
  onStatusFilterChange: (status: string) => void
  onChannelFilterChange?: (channel: string) => void
  onCustomerIdFilterChange?: (customerId: string) => void
  onUserIdFilterChange?: (userId: string) => void
  onSearchFilterChange?: (search: string) => void

  userRole: 'user' | 'admin'
}

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export interface MainLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

export interface UserOnlyFeatureProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

// Custom Request Dialog Props
export interface CustomRequestCancelDialogProps {
  isOpen: boolean
  onClose: () => void
  customRequest: CustomRequest | null
  onCancelSuccess: () => void
  isLoading?: boolean
}

export interface CustomRequestUpdateDialogProps {
  isOpen: boolean
  onClose: () => void
  customRequest: CustomRequest | null
  onUpdateSuccess: (updateData: UpdateCustomRequestData) => void
  isLoading?: boolean
}

export interface CustomRequestOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedRequests: CustomRequest[]
  onSubmitOrder: (orderData: any) => Promise<APIResponse<Order>>
  isLoading?: boolean
}

export interface RequestQuantity {
  requestId: number
  quantity: number
}

// Checkout Form Props
export interface PaymentSectionProps {
  paymentProof: string
  onPaymentProofChange: (proof: string) => void
  depositAmount: number
  onDepositAmountChange: (amount: number) => void
  totalAmount: number
  isLoading?: boolean
}

export interface ShippingMethodSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export interface OrderSummaryProps {
  items: CartProduct[]
  totalAmount: number
  depositAmount: number
  shippingMethod: string
  className?: string
}

export interface AddressSelectorProps {
  value: number | null
  onValueChange: (addressId: number) => void
  className?: string
}

// Table Component Props
export interface Column {
  id: string
  header: string
  accessor?: string
  cell?: (row: any) => React.ReactNode
}

export interface DataTableProps {
  data: any[]
  columns: Column[]
  isLoading?: boolean
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  parentId?: number
  isActive?: boolean
}

// Material Types
export interface Material {
  id: number
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialRequest {
  name: string
  description?: string
  isActive?: boolean
}


export interface Size {
  id: number
  name: string
  lengthCm: number
  widthCm: number
  heightCm: number
  isStandard: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSizeRequest {
  name: string
  length: number
  width: number
  height: number
  isStandard?: boolean
  isActive?: boolean
}


export interface CreateProductRequest {
  name: string
  description?: string
  basePrice: number
  categoryId: number
  isActive?: boolean
}

export interface ProductVariant {
  id: number
  sku: string
  productId: number
  materialId: number
  sizeId: number
  stockQuantity: number
  price: string
  minStockLevel: number
  isAvailable: boolean
  product?: Product
  material?: Material
  size?: Size
  createdAt: string
  updatedAt: string
}

export interface CreateProductVariantRequest {
  productId: number
  materialId: number
  sizeId: number
  stockQuantity: number
  isAvailable?: boolean
}

export interface AdjustStockRequest {
  quantity: number
  reason: string
  type: 'IN' | 'OUT'
}

export interface CreateCustomerRequest {
  fullName: string
  phoneNumber: string
  email?: string
  address?: string
  customerType: 'RETAIL' | 'WHOLESALE'
}

// Cart Types
export interface CartItem {
  id: number
  customerId: number
  productVariantId: number
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  productVariant?: ProductVariant
  createdAt: string
  updatedAt: string
}

export interface AddToCartRequest {
  customerId: number
  productVariantId: number
  quantity: number
  notes?: string
}

export interface UpdateCartItemRequest {
  quantity: number
  notes?: string
}

export interface CheckoutRequest {
  customerId: number
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'
  paidAmount?: number
  notes?: string
}

// Custom Request Types
export enum CustomRequestStatus {
  PENDING = 'pending',
  QUOTED = 'quoted',
}

export interface CustomRequest {
  id: number;
  userId: number;
  productId: number;
  customWidth: number;
  customHeight: number;
  customDepth: number;
  materialId: number;
  specialRequirements?: string;
  status: CustomRequestStatus;
  quotedPrice?: number;
  materialCost?: number;
  laborCost?: number;
  otherCosts?: number;
  estimatedDays?: number;
  adminNotes?: string;
  quotedById?: number;
  quotedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  product?: Product;
  material?: Material;
  quotedBy?: User;
}

export interface CreateCustomRequestData {
  productId: number;
  customWidth: number;
  customHeight: number;
  customDepth: number;
  materialId: number;
  specialRequirements?: string;
}

export interface UpdateCustomRequestData {
  customWidth?: number;
  customHeight?: number;
  customDepth?: number;
  materialId?: number;
  specialRequirements?: string;
}

export interface ProvideQuotationData {
  quotedPrice: number;
  materialCost?: number;
  laborCost?: number;
  otherCosts?: number;
  estimatedDays?: number;
  adminNotes?: string;
}

export interface CreateCustomRequestRequest {
  customerId: number
  materialId: number
  requestDetails: string
  customDimensions: string
  estimatedPrice?: number
  deliveryDate?: string
}

export interface UpdateCustomRequestStatusRequest {
  status: 'PENDING' | 'QUOTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  adminNotes?: string
}

export interface ProvideQuoteRequest {
  quotedPrice: number
  adminNotes?: string
  deliveryDate?: string
}



export interface CreateOrderRequest {
  customerId: number
  orderItems: {
    productVariantId: number
    quantity: number
    unitPrice: number
  }[]
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'
  paidAmount?: number
  notes?: string
}

export interface UpdateOrderStatusRequest {
  orderStatus: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SHIPPED'
}

export interface UpdatePaymentRequest {
  paidAmount: number
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'
}

// Dashboard Types
export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  monthlyRevenue: number
  pendingOrders: number
  lowStockProducts: number
}

export interface RecentActivity {
  id: number
  type: 'ORDER' | 'PRODUCT' | 'CUSTOMER' | 'CUSTOM_REQUEST'
  description: string
  timestamp: string
  entityId: number
}

export interface SalesAnalytics {
  dailySales: {
    date: string
    amount: number
    orders: number
  }[]
  topProducts: {
    productName: string
    totalSold: number
    revenue: number
  }[]
  topCustomers: {
    customerName: string
    totalOrders: number
    totalSpent: number
  }[]
}

// Inventory Types
export interface InventoryTransaction {
  id: number
  productVariantId: number
  transactionType: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  referenceType?: 'order' | 'adjustment' | 'return'
  referenceId?: number
  performedById: number
  transactionDate: Date | string
  notes?: string
  productVariant?: ProductVariant & {
    product?: Product
    material?: Material
    size?: Size
  }
  performedBy?: User
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface APIResponse<T> {
  status: number
  data: T
  message?: string
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

// Form Types
export interface SearchParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: string
  type?: string
  active?: boolean
  standard?: boolean
  customerId?: number
  from_date?: string
  to_date?: string
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface TableState {
  page: number
  limit: number
  search: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  filters: Record<string, any>
}

export interface ModalState {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  data?: any
}

// Navigation Types
export interface NavItem {
  title: string
  href: string
  icon?: string
  children?: NavItem[]
  role?: UserRole[]
}

export interface User {
  id: number
  email: string
  fullName: string
  phone?: string
  role: UserRole
  status: 'active' | 'inactive'
  address?: string
  dateOfBirth?: Date | string
  gender?: 'male' | 'female' | 'other'
  employeeCode?: string
  hireDate?: Date | string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Customer {
  id: number
  fullName: string
  email: string
  phone: string
  address: string
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  createdAt: string
  createdBy: {
    id: number
    fullName: string
    email: string
  }
  customerCode: string
  notes: string
  orders: Order[]
}

export interface Product {
  id: number
  name: string
  description: string
  thumbnailUrl: string
  categoryId: number
  category: {
    id: number
    name: string
    description: string
    parentId: number
    isActive: boolean
    sortOrder: number
  }
  basePrice: number
  isActive: boolean
  variantCount: number
  minQuantity: number
  createdAt: string
  updatedAt: string
  variants?: ProductVariant[]
}


export interface Order {
  id: number
  orderNumber: string
  userId?: number
  customerId?: number
  channel: 'online' | 'offline'
  orderStatus: OrderStatus
  totalAmount: number
  discountAmount: number
  finalAmount: number
  depositAmount: number
  remainingAmount: number
  deliveryName: string
  deliveryPhone: string
  deliveryAddress: string
  deliveryType: 'standard' | 'express'
  estimatedDeliveryDays?: string
  paymentProof?: string
  notes?: string
  reasonCancel?: string
  cancelAt?: Date | string
  cancelById?: number
  cancelByUser?: User
  createdById?: number
  createdAt: Date | string
  updatedAt: Date | string
  // Relations
  user?: User
  customer?: Customer
  createdByUser?: User
  items: OrderItem[]
  totalItems: number
  trackingLogs?: Array<{
    id: number
    message: string
    createdAt: Date | string
    createdBy: {
      id: number
      fullName: string
      role: string
    }
  }>
}


export interface OrderItem {
  id: number
  type: 'standard' | 'custom'
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  // Standard item specific
  productVariantId?: number
  productVariant?: ProductVariant
  // Custom item specific
  productId?: number
  customRequestId?: number
  customWidth?: number
  customHeight?: number
  customDepth?: number
  materialId?: number
  specialRequirements?: string
  estimatedDays?: number
  product?: Product
  material?: Material
  customRequest?: any
}


export interface Category {
  id: number
  name: string
  description: string
  parentId: number
  isActive: boolean
  sortOrder: number
  parent: Category | null
  children: Category[]
}

export interface Material {
  id: number
  name: string
  isActive: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaymentQR {
  id: number
  qrCodeUrl: string
  bankName: string
  accountNumber: string
  accountName: string
  description: string
  status: 'active' | 'inactive'
  updatedBy: User
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: number
  name: string
  fullName: string
  phone: string
  address: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomOrder {
  id: number
  customerId: number
  productId: number
  customLength: number
  customWidth: number
  customHeight: number
  customMaterialId: number
  estimatedPrice: number
  depositAmount: number
  notes: string
  status: string
  deliveryDate: string
  createdById: number
  customer: Customer
  product: Product
  customMaterial: Material
  createdBy: User
  createdAt: string
  updatedAt: string
}

// Admin Management Types
export interface AdminUsersTableState {
  page: number
  limit: number
  search: string
  roleFilter: string
  statusFilter: string
}

export interface AdminProductsTableState {
  page: number
  limit: number
  search: string
  statusFilter: string
  categoryFilter: string
  stockFilter: string
}

export interface AdminCategoriesTableState {
  page: number
  limit: number
  search: string
}

export interface AdminMaterialsTableState {
  page: number
  limit: number
  search: string
  active: string
}

export interface AdminSizesTableState {
  page: number
  limit: number
  search: string
  active: string
}

export interface AdminCustomersTableState {
  page: number
  limit: number
  search: string
  typeFilter: string
  statusFilter: string
}

export interface InventoryTransactionTableState {
  page: number
  limit: number
  search: string
  transactionTypeFilter: string
  productVariantIdFilter: string
  referenceTypeFilter: string
}

// Product Form Types
export interface ProductFormData {
  name: string
  description: string
  basePrice: number
  categoryId: number
  isActive: boolean
}

export interface ProductVariantFormData {
  materialIds: number[]
  sizeIds: number[]
  stockQuantity: number
  isAvailable: boolean
}

export interface CreateProductWithVariantsRequest {
  product: ProductFormData
  variants: ProductVariantFormData
}

// Category Form Types
export interface CategoryFormData {
  name: string
  description: string
  parentId?: number
  sortOrder?: number
}

// Material Form Types  
export interface MaterialFormData {
  name: string
  description: string
  isActive: boolean
}

// Size Form Types
export interface SizeFormData {
  name: string
  lengthCm: number
  widthCm: number
  heightCm: number
  isActive: boolean
}

// User Form Types
export interface UserFormData {
  email: string
  fullName: string
  phone: string
  role: UserRole
  address?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  employeeCode?: string
  password?: string
}

// Customer Form Types
export interface CustomerFormData {
  fullName: string
  email: string
  phone: string
  address: string
}

// Dashboard Stats Extended
export interface ExtendedDashboardStats {
  totalProducts: number
  totalCategories: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  monthlyRevenue: number
  pendingOrders: number
  lowStockProducts: number
  activeUsers: number
  totalMaterials: number
  totalSizes: number
  completedOrders: number
  cancelledOrders: number
  topSellingProducts: {
    id: number
    name: string
    sold: number
    revenue: number
  }[]
  recentActivity: RecentActivity[]
}

// Admin User Management Types
export interface CreateEmployeeRequest {
  email: string
  fullName: string
  phone: string
  role: UserRole
  employeeCode?: string
  password: string
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive'
  reason?: string
}

export interface ResetPasswordRequest {
  newPassword: string
  confirmPassword: string
}

export interface UpdateEmployeeRequest {
  fullName?: string
  phone?: string
  role?: UserRole
  employeeCode?: string
}

export interface UserStatsResponse {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  employeeUsers: number
  customerUsers: number
  inactiveUsers: number
}