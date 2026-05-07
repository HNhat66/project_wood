import {
  Address,
  APIResponse,
  AuthResponse,
  Category,
  CategoryFormData,
  CreateCustomRequestData,
  CreateProductWithVariantsRequest,
  Customer,
  CustomerFormData,
  CustomRequest,
  ExtendedDashboardStats,
  InventoryTransaction,
  Material,
  MaterialFormData,
  Order,
  PaginatedResponse,
  PaymentQR,
  Product,
  ProductVariant,
  ProvideQuotationData,
  Size,
  SizeFormData,
  UpdateCustomRequestData,
  User,
} from '@/lib/types';

/**
 * API Client for managing HTTP requests to the backend
 * Handles authentication, token refresh, and provides typed endpoints
 */
class APIClient {
	private baseURL: string
	private tokens: { accessToken: string | undefined, refreshToken: string | undefined }
	constructor(tokens?: { accessToken: string | undefined, refreshToken: string | undefined }) {
		this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
		this.tokens = tokens || { accessToken: '', refreshToken: '' }
	}

	/**
	 * Updates the authentication tokens
	 */
	public setTokens(tokens: { accessToken: string | undefined, refreshToken: string | undefined }): void {
		this.tokens = tokens
	}

	/**
	 * Gets the current authentication tokens
	 */
	public getTokens(): { accessToken: string | undefined, refreshToken: string | undefined } {
		return { ...this.tokens }
	}

	/**
	 * Checks if the user is authenticated (has an access token)
	 */
	public isAuthenticated(): boolean {
		return Boolean(this.tokens.accessToken)
	}

	/**
	 * Clears all authentication tokens
	 */
	public clearTokens(): void {
		this.tokens = { accessToken: '', refreshToken: '' }
	}

	/**
	 * Retries a request with a new authentication token
	 */
	private async retryRequestWithToken<T>(
		url: string,
		config: RequestInit,
		newToken: string
	): Promise<APIResponse<T>> {
		const retryConfig: RequestInit = {
			...config,
			headers: {
				...config.headers,
				Authorization: `Bearer ${newToken}`,
			},
		}
		const retryResponse = await fetch	(url, retryConfig)
		if (!retryResponse.ok) {
			throw new Error(`HTTP error! status: ${retryResponse.status}`)
		}

		const result = await retryResponse.json()
		return {
			status: retryResponse.status,
			data: result
		}
	}

	/**
	 * Handles token refresh and retries the original request
	 */
	private async handleTokenRefreshAndRetry<T>(
		url: string,
		config: RequestInit
	): Promise<APIResponse<T> | null> {
		if (!this.tokens.refreshToken) {
			return null
		}

		const refreshResult = await this.refreshToken()
		if (!refreshResult) {
			if (typeof window !== 'undefined') {
				window.location.href = '/login'
			}
			throw new Error('Authentication failed - session expired')
		}

		// Update tokens and retry the original request
		return this.retryRequestWithToken(url, config, refreshResult.access_token)
	}

	/**
	 * Main request method that handles authentication and token refresh
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<APIResponse<T>> {
		const url = `${this.baseURL}${endpoint}`
		const token = this.tokens.accessToken

		const config: RequestInit = {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...(token && { Authorization: `Bearer ${token}` }),
				...options.headers,
			},
			...options,
		}

		try {
			// Handle case where we have refresh token but no access token
			if (this.tokens.refreshToken && !this.tokens.accessToken) {
				const retryResult = await this.handleTokenRefreshAndRetry<T>(url, config)
				if (retryResult) {
					return retryResult
				}
			}

			const response = await fetch(url, config)

			// Handle 401 Unauthorized - token expired
			if (response.status === 401) {
				const retryResult = await this.handleTokenRefreshAndRetry<T>(url, config)
				if (retryResult) {
					return retryResult
				}
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
			}

			const result = await response.json()
			return {
				status: response.status,
				data: result
			}
		} catch (error) {
			console.error('API request failed:', error)
			throw error
		}
	}

	/**
	 * Refreshes the authentication token using the refresh token
	 */
	private async refreshToken(): Promise<{ access_token: string, refresh_token: string } | false> {
		const refreshToken = this.tokens.refreshToken
		if (!refreshToken) {
			return false
		}

		try {
			const response = await fetch(`${this.baseURL}/auth/refresh`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ refreshToken }),
			})

			if (response.ok) {
				const data = await response.json()
				this.tokens = {
					accessToken: data.access_token,
					refreshToken: data.refresh_token
				}
				return {
					access_token: data.access_token,
					refresh_token: data.refresh_token
				}
			}
		} catch (error) {
			console.error('Token refresh failed:', error)
		}

		return false
	}

	// Auth endpoints
	auth() {
		return {
			login: async (email: string, password: string): Promise<APIResponse<AuthResponse>> => {
				try {
					const response = await this.request<AuthResponse>('/auth/login', {
						method: 'POST',
						body: JSON.stringify({ email, password }),
					})

					// Update tokens after successful login
					if (response.data?.access_token && response.data?.refresh_token) {
						this.tokens = {
							accessToken: response.data.access_token,
							refreshToken: response.data.refresh_token
						}
					}

					return response
				} catch (error) {
					console.error('Login failed:', error)
					throw error
				}
			},

			register: async (register:{
				email: string,
				password: string,
				fullName: string,
				phone: string,
				address: string,
				confirmPassword: string,
				agreedToTerms: boolean
			}): Promise<APIResponse<{ user: User }>> => {
				try {
					return await this.request<{ user: User }>('/auth/register', {
						method: 'POST',
						body: JSON.stringify(register),
					})
				} catch (error) {
					console.error('Registration failed:', error)
					throw error
				}
			},

			logout: async (): Promise<void> => {
				try {
					await this.request('/auth/logout', { method: 'POST' })
				} catch (error) {
					console.error('Logout API call failed:', error)
					// Continue with local cleanup even if API call fails
				} finally {
					// Always clear tokens locally
					this.clearTokens()
				}
			},

			getProfile: async (): Promise<APIResponse<User>> => {
				try {
					return await this.request<User>('/auth/profile')
				} catch (error) {
					console.error('Get profile failed:', error)
					throw error
				}
			},

			updateProfile: async (profileData: {
				fullName?: string
				phone?: string
				address?: string
				dateOfBirth?: string
				gender?: 'male' | 'female' | 'other'
			}): Promise<APIResponse<User>> => {
				try {
					return await this.request<User>('/auth/profile', {
						method: 'PUT',
						body: JSON.stringify(profileData),
					})
				} catch (error) {
					console.error('Update profile failed:', error)
					throw error
				}
			},

			changePassword: async (passwordData: {
				currentPassword: string
				newPassword: string
			}): Promise<APIResponse<{ message: string }>> => {
				try {
					return await this.request<{ message: string }>('/auth/change-password', {
						method: 'PUT',
						body: JSON.stringify(passwordData),
					})
				} catch (error) {
					console.error('Change password failed:', error)
					throw error
				}
			}
		}
	}

	// Products endpoints
	product() {
		return {
			getProducts: async (params?: {
				page?: number
				limit?: number
				search?: string
				statusFilter?: string
				categoryFilter?: string
				stockFilter?: string
				withVariants?: boolean
				sort?: 'name-asc' | 'name-desc' | 'basePrice-asc' | 'basePrice-desc' | 'createdAt-asc' | 'createdAt-desc'
			}): Promise<APIResponse<PaginatedResponse<Product>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.statusFilter && params.statusFilter !== 'all') {
					if (params.statusFilter === 'active') {
						searchParams.append('active', 'true')
					} else if (params.statusFilter === 'inactive') {
						searchParams.append('active', 'false')
					}
				}
				if (params?.categoryFilter && params.categoryFilter !== 'all') searchParams.append('category', params.categoryFilter)
				if (params?.stockFilter && params.stockFilter !== 'all') searchParams.append('stock', params.stockFilter)
				if (params?.withVariants) searchParams.append('withVariants', params.withVariants.toString())
				if (params?.sort) {
					const [sortBy, sortOrder] = params.sort.split('-')
					searchParams.append('sortBy', sortBy)
					searchParams.append('sortOrder', sortOrder)
				}
				return this.request(`/products?${searchParams.toString()}`)
			},

			getProduct: async (id: number): Promise<APIResponse<Product>> => {
				return this.request(`/products/${id}`)
			},

			createProduct: async (productData: {
				name: string
				description: string
				categoryId: number
				basePrice: number
				thumbnailUrl: string
				variants: {
					materialId: number
					sizeId: number
					stockQuantity: number
					price: number
					minStockLevel: number
					sku: string
				}[]
			}): Promise<APIResponse<Product>> => {
				return this.request('/products', {
					method: 'POST',
					body: JSON.stringify(productData),
				})
			},

			updateProduct: async (id: number, productData: {
				name: string
				description: string
				categoryId: number
				basePrice: number
				thumbnailUrl: string
				variants: {
					materialId: number
					sizeId: number
					stockQuantity: number
					price: number
					minStockLevel: number
					sku: string,
				}[]
			}): Promise<APIResponse<Product>> => {
				return this.request(`/products/${id}`, {
					method: 'PATCH',
					body: JSON.stringify(productData),
				})
			},

			deleteProduct: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/products/${id}`, { method: 'DELETE' })
			},

			toggleProductStatus: async (id: number): Promise<APIResponse<Product>> => {
				return this.request(`/products/${id}/toggle-status`, { method: 'PATCH' })
			},

			createProductWithVariants: async (data: CreateProductWithVariantsRequest): Promise<APIResponse<Product>> => {
				return this.request('/products/with-variants', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			bulkInventoryAdjustment: async (adjustmentData: {
				productId: number
				adjustments: {
					productVariantId: number
					quantity: number
					reason?: string
				}[]
				globalReason: string
				notes?: string
			}): Promise<APIResponse<{
				success: boolean
				updated: ProductVariant[]
				errors: string[]
			}>> => {
				return this.request('/products/bulk-inventory-adjustment', {
					method: 'POST',
					body: JSON.stringify(adjustmentData),
				})
			}
		}
	}

	// Product Variants endpoints
	productVariant() {
		return {
			getProductVariants: async (params?: {
				productId?: number
				materialId?: number
				sizeId?: number
				search?: string
				lowStock?: boolean
			}): Promise<APIResponse<ProductVariant[]>> => {
				const searchParams = new URLSearchParams()
				if (params?.productId) searchParams.append('productId', params.productId.toString())
				if (params?.materialId) searchParams.append('materialId', params.materialId.toString())
				if (params?.sizeId) searchParams.append('sizeId', params.sizeId.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.lowStock !== undefined) searchParams.append('lowStock', params.lowStock.toString())

				return this.request(`/product-variants?${searchParams.toString()}`)
			},
			getProductVariantById: async (id: number): Promise<APIResponse<ProductVariant>> => {
				return this.request(`/product-variants/${id}`)
			},

			// Find specific variant by combination
			findVariantByCombo: async (productId: number, materialId: number, sizeId: number): Promise<APIResponse<ProductVariant | null>> => {
				const response = await this.productVariant().getProductVariants({
					productId,
					materialId,
					sizeId
				})

				// Should return exactly one variant or null
				const variant = response.data?.[0] || null
				return {
					status: response.status,
					data: variant
				}
			},

			createProductVariant: async (variantData: {
				productId: number
				materialId: number
				sizeId: number
				stockQuantity: number
			}): Promise<APIResponse<ProductVariant>> => {
				return this.request('/product-variants', {
					method: 'POST',
					body: JSON.stringify(variantData),
				})
			},

			updateProductVariant: async (id: number, variantData: Partial<ProductVariant>): Promise<APIResponse<ProductVariant>> => {
				return this.request(`/product-variants/${id}`, {
					method: 'PATCH',
					body: JSON.stringify(variantData),
				})
			},

			adjustStock: async (id: number, adjustment: number, reason: string): Promise<APIResponse<ProductVariant>> => {
				return this.request(`/product-variants/${id}/adjust-stock`, {
					method: 'PATCH',
					body: JSON.stringify({ adjustment, reason }),
				})
			}
		}
	}

	// Customers endpoints
	customer() {
		return {
			getCustomers: async (params?: {
				page?: number
				limit?: number
				search?: string
				typeFilter?: string
				statusFilter?: string
				sortBy?: string
				sortOrder?: 'ASC' | 'DESC'
			}): Promise<APIResponse<PaginatedResponse<Customer>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.typeFilter && params.typeFilter !== 'all') searchParams.append('type', params.typeFilter)
				if (params?.statusFilter && params.statusFilter !== 'all') searchParams.append('status', params.statusFilter)
				if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
				if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)

				return this.request(`/customers?${searchParams.toString()}`)
			},

			getCustomer: async (id: number): Promise<APIResponse<Customer>> => {
				return this.request(`/customers/${id}`)
			},

			createCustomer: async (data: CustomerFormData): Promise<APIResponse<Customer>> => {
				return this.request('/customers', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			updateCustomer: async (id: number, data: Partial<CustomerFormData>): Promise<APIResponse<Customer>> => {
				return this.request(`/customers/${id}`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			checkByPhone: async (phone: string): Promise<APIResponse<{ exists: boolean; customer?: Customer }>> => {
				return this.request(`/customers/check-by-phone/${phone}`)
			},
		}
	}

	// Orders endpoints
	order() {
		return {
			getOrders: async (params?: {
				page?: number
				limit?: number
				status?: string
				customerId?: number
				fromDate?: string
				toDate?: string
			}): Promise<APIResponse<PaginatedResponse<Order>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.status) searchParams.append('status', params.status)
				if (params?.customerId) searchParams.append('customerId', params.customerId.toString())
				if (params?.fromDate) searchParams.append('from_date', params.fromDate)
				if (params?.toDate) searchParams.append('to_date', params.toDate)

				return this.request(`/orders?${searchParams.toString()}`)
			},

			getOrder: async (orderNumber: string): Promise<APIResponse<Order>> => {
				return this.request(`/orders/${orderNumber}`)
			},

			trackOrder: async (orderNumber: string): Promise<APIResponse<Order>> => {
				return this.request(`/guest/orders/${orderNumber}`)
			},
			createPaymentUrl: async (orderNumber: string, amount: number): Promise<APIResponse<{
				paymentUrl: string
			}>> => {
				return this.request(`/vnpay/create-payment-url?orderNumber=${orderNumber}&amount=${amount}`)
			},
			
			createOrder: async (orderData: {
				customerId: number
				items: { productVariantId: number; quantity: number }[]
				shippingAddress: string
				paymentMethod: 'cash' | 'bank_transfer' | 'card'
				notes?: string
			}): Promise<APIResponse<Order>> => {
				return this.request('/orders', {
					method: 'POST',
					body: JSON.stringify(orderData),
				})
			},

			createOnlineOrder: async (orderData: {
				notes?: string,
				deliveryAddressId: number,
				deliveryType: string,
				customItems: {
					productId: number,
					customRequestId: number,
					customWidth: number,
					customHeight: number,
					customDepth: number,
					materialId: number,
					quantity: number,
					specialRequirements?: string,
					unitPrice: number,
					estimatedDays?: number
				}[]
			}): Promise<APIResponse<Order>> => {

				return this.request('/orders', {
					method: 'POST',
					body: JSON.stringify({
						notes: orderData.notes,
						deliveryAddressId: orderData.deliveryAddressId,
						deliveryType: orderData.deliveryType,
						customItems: orderData.customItems,
					}),
				})
			},

			updateOrderStatus: async (id: number, status: Order['orderStatus']): Promise<APIResponse<Order>> => {
				return this.request(`/orders/${id}/status`, {
					method: 'PATCH',
					body: JSON.stringify({ status }),
				})
			},

			cancelOrder: async (id: number): Promise<APIResponse<Order>> => {
				return this.request(`/orders/${id}/cancel`, {
					method: 'PATCH',
				})
			},

			uploadPaymentProof: async (orderNumber: string, data: {
				paymentProof: string
				depositAmount: number
				notes?: string
			}): Promise<APIResponse<Order>> => {
				return this.request(`/orders/${orderNumber}/upload-payment-proof`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			// Admin endpoints
			getAllOrders: async (params?: {
				page?: number
				limit?: number
				channel?: 'online' | 'offline'
				status?: string
				userId?: number
				customerId?: number
				search?: string
			}): Promise<APIResponse<PaginatedResponse<Order>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.channel) searchParams.append('channel', params.channel)
				if (params?.status) searchParams.append('status', params.status)
				if (params?.userId) searchParams.append('userId', params.userId.toString())
				if (params?.customerId) searchParams.append('customerId', params.customerId.toString())
				if (params?.search) searchParams.append('search', params.search)

				return this.request(`/admin/orders?${searchParams.toString()}`)
			},

			updateOrderStatusAdmin: async (id: number, status: string, notes?: string): Promise<APIResponse<Order>> => {
				return this.request(`/admin/orders/${id}/status`, {
					method: 'PATCH',
					body: JSON.stringify({ status, notes }),
				})
			},

			updatePaymentAdmin: async (id: number, paymentData: {
				paymentAmount: number
				paymentProof?: string
				notes?: string
			}): Promise<APIResponse<Order>> => {
				return this.request(`/admin/orders/${id}/payment`, {
					method: 'PATCH',
					body: JSON.stringify(paymentData),
				})
			},

			createOfflineOrder: async (orderData: {
				customerName: string
				customerPhone: string
				customerEmail?: string
				deliveryAddress: string
				deliveryType: 'standard' | 'express'
				estimatedDeliveryDays?: string
				standardItems?: Array<{
					productVariantId: number
					quantity: number
				}>
				customItems?: Array<{
					productId: number
					customWidth: number
					customHeight: number
					customDepth: number
					materialId: number
					quantity: number
					unitPrice: number
					specialRequirements?: string
					estimatedDays?: number
				}>
				depositAmount?: number
				notes?: string
			}): Promise<APIResponse<Order>> => {
				return this.request('/admin/orders/offline', {
					method: 'POST',
					body: JSON.stringify(orderData),
				})
			}
		}
	}

	// Order Tracking Logs endpoints
	orderTrackingLog() {
		return {
			// Create tracking log (Admin only)
			createTrackingLog: async (data: {
				orderId: number
				message: string
			}): Promise<APIResponse<{
				id: number
				orderId: number
				message: string
				createdById: number
				createdAt: Date
				updatedAt: Date
				createdBy: {
					id: number
					fullName: string
					role: string
				}
			}>> => {
				return this.request('/order-tracking-logs', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			// Update order status with optional tracking log (Admin only)
			updateOrderStatusWithLog: async (orderId: number, data: {
				newStatus: string
				message?: string
			}): Promise<APIResponse<{
				order: Order
				trackingLog?: {
					id: number
					orderId: number
					message: string
					createdById: number
					createdAt: Date
					updatedAt: Date
					createdBy: {
						id: number
						fullName: string
						role: string
					}
				}
			}>> => {
				return this.request(`/order-tracking-logs/order/${orderId}/status`, {
					method: 'PUT',
					body: JSON.stringify(data),
				})
			},

			// Get tracking logs by order number
			getTrackingLogsByOrderNumber: async (orderNumber: string): Promise<APIResponse<Array<{
				id: number
				orderId: number
				message: string
				createdById: number
				createdAt: Date
				updatedAt: Date
				createdBy: {
					id: number
					fullName: string
					role: string
				}
			}>>> => {
				return this.request(`/order-tracking-logs/order-number/${orderNumber}`)
			}
		}
	}

	// Dashboard endpoints
	async getDashboardStats(): Promise<APIResponse<{
		totalProducts: number
		totalCustomers: number
		totalOrders: number
		totalRevenue: number
		recentOrders: Order[]
		lowStockVariants: ProductVariant[]
		topProducts: Product[]
		topCustomers: Customer[]
	}>> {
		return this.request('/dashboard/stats')
	}

	// Sizes endpoints
	size() {
		return {
			getSizes: async (params?: {
				page?: number
				limit?: number
				search?: string
				active?: string
			}): Promise<APIResponse<Size[]>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.active && params.active !== 'all') searchParams.append('active', params.active === 'active' ? 'true' : 'false')

				return this.request(`/sizes?${searchParams.toString()}`)
			},

			createSize: async (data: SizeFormData): Promise<APIResponse<Size>> => {
				return this.request('/sizes', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			updateSize: async (id: number, data: Partial<SizeFormData>): Promise<APIResponse<Size>> => {
				return this.request(`/sizes/${id}`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			deleteSize: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/sizes/${id}`, {
					method: 'DELETE',
				})
			}
		}
	}

	// Categories endpoints
	category() {
		return {
			getCategories: async (params?: {
				page?: number
				limit?: number
				search?: string
				statusFilter?: string
				parentFilter?: string
			}): Promise<APIResponse<Category[]>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.statusFilter && params.statusFilter !== 'all') searchParams.append('status', params.statusFilter)
				if (params?.parentFilter && params.parentFilter !== 'all') searchParams.append('parent', params.parentFilter)

				return this.request(`/categories?${searchParams.toString()}`)
			},

			createCategory: async (data: CategoryFormData): Promise<APIResponse<Category>> => {
				return this.request('/categories', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			updateCategory: async (id: number, data: Partial<CategoryFormData>): Promise<APIResponse<Category>> => {
				return this.request(`/categories/${id}`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			deleteCategory: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/categories/${id}`, {
					method: 'DELETE',
				})
			}
		}
	}

	// Materials endpoints
	material() {
		return {
			getMaterials: async (params?: {
				page?: number
				limit?: number
				search?: string
				active?: string
			}): Promise<APIResponse<Material[]>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.active && params.active !== 'all') searchParams.append('active', params.active === 'active' ? 'true' : 'false')

				return this.request(`/materials?${searchParams.toString()}`)
			},

			createMaterial: async (data: MaterialFormData): Promise<APIResponse<Material>> => {
				return this.request('/materials', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			updateMaterial: async (id: number, data: Partial<MaterialFormData>): Promise<APIResponse<Material>> => {
				return this.request(`/materials/${id}`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			deleteMaterial: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/materials/${id}`, {
					method: 'DELETE',
				})
			}
		}
	}

	// Users endpoints
	user() {
		return {
			// Get users list with pagination and filters
			getUsers: async (params?: {
				page?: number
				limit?: number
				search?: string
				roleFilter?: string
				statusFilter?: string
			}): Promise<APIResponse<PaginatedResponse<User>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.roleFilter && params.roleFilter !== 'all') searchParams.append('roleFilter', params.roleFilter)
				if (params?.statusFilter && params.statusFilter !== 'all') searchParams.append('statusFilter', params.statusFilter)

				return this.request(`/users?${searchParams.toString()}`)
			},

			// Get user by ID
			getUserById: async (id: number): Promise<APIResponse<User>> => {
				return this.request(`/users/${id}`)
			},

			// Get user statistics for dashboard
			getUserStats: async (): Promise<APIResponse<{
				totalUsers: number
				activeUsers: number
				adminUsers: number
				employeeUsers: number
				customerUsers: number
				inactiveUsers: number
			}>> => {
				return this.request('/users/stats')
			},

			// Create new employee (Admin only)
			createEmployee: async (data: {
				email: string
				fullName: string
				phone: string
				role: string
				employeeCode?: string
				password: string
			}): Promise<APIResponse<User>> => {
				return this.request('/users/employees', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			// Update employee information (Admin only)
			updateEmployee: async (id: number, data: {
				fullName?: string
				phone?: string
				role?: string
				employeeCode?: string
			}): Promise<APIResponse<User>> => {
				return this.request(`/users/${id}`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			// Update user status - ban/unban user (Admin only)
			updateUserStatus: async (id: number, data: {
				status: 'active' | 'inactive'
				reason?: string
			}): Promise<APIResponse<User>> => {
				return this.request(`/users/${id}/status`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			// Reset user password (Admin only)
			resetPassword: async (id: number, data: {
				newPassword: string
			}): Promise<APIResponse<{ message: string }>> => {
				return this.request(`/users/${id}/reset-password`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

		}
	}

	// Cart endpoints
	cart() {
		return {
			// Get my cart (for authenticated users) - Updated to return grouped format
			getMyCart: async (): Promise<APIResponse<{
				userId: number
				cartItems: {
					product: {
						id: number
						name: string
						category: string
						thumbnailUrl?: string
					}
					variants: {
						materialId: number
						materialName: string
						sizeId: number
						sizeName: string
						price: string
						quantity: number
						productVariantId: number
						sku: string
						stockQuantity: number
					}[]
				}[]
				totalItems: number
				totalAmount: number
				createdAt: Date
				updatedAt: Date
			}>> => {
				return this.request('/cart')
			},

			// Add item to cart
			addToCart: async (data: {
				productVariantId: number
				quantity: number
			}): Promise<APIResponse<{
				userId: number
				cartItems: any[]
				totalItems: number
				totalAmount: number
				createdAt: Date
				updatedAt: Date
			}>> => {
				return this.request('/cart/add', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			// Update cart item quantity by productVariantId
			updateCartItem: async (data: {
				productVariantId: number
				quantity: number
			}): Promise<APIResponse<{
				userId: number
				cartItems: any[]
				totalItems: number
				totalAmount: number
				createdAt: Date
				updatedAt: Date
			}>> => {
				return this.request('/cart/update', {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			},

			// Remove item from cart by productVariantId
			removeFromCart: async (data: {
				productVariantId: number
			}): Promise<APIResponse<{
				userId: number
				cartItems: any[]
				totalItems: number
				totalAmount: number
				createdAt: Date
				updatedAt: Date
			}>> => {
				return this.request('/cart/remove', {
					method: 'DELETE',
					body: JSON.stringify(data),
				})
			},

			// Legacy: Remove item from cart by cart item ID
			removeCartItem: async (itemId: number): Promise<APIResponse<{
				userId: number
				cartItems: any[]
				totalItems: number
				totalAmount: number
				createdAt: Date
				updatedAt: Date
			}>> => {
				return this.request(`/cart/items/${itemId}`, {
					method: 'DELETE'
				})
			},

			// Clear all items from cart
			clearCart: async (): Promise<APIResponse<{ message: string }>> => {
				return this.request('/cart/clear', {
					method: 'DELETE'
				})
			},

			checkout: async (data: {
				deliveryAddressId: number
				deliveryType: string
				notes?: string
			}): Promise<APIResponse<Order>> => {
				return this.request('/cart/checkout', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			}
		}
	}
	paymentQRManagement() {
		return {
			// Public endpoint - get active QR for checkout
			getActivePaymentQR: async (): Promise<APIResponse<PaymentQR>> => {
				return this.request('/payment-qr/active')
			},

			// Admin endpoints
			getAllPaymentQRs: async (): Promise<APIResponse<{
				data: PaymentQR[]
				total: number
			}>> => {
				return this.request('/payment-qr')
			},

			getPaymentQR: async (id: number): Promise<APIResponse<PaymentQR>> => {
				return this.request(`/payment-qr/${id}`)
			},

			createPaymentQR: async (data: {
				qrCodeUrl: string
				bankName: string
				accountNumber: string
				accountName: string
				description?: string
			}): Promise<APIResponse<PaymentQR>> => {
				return this.request('/payment-qr', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			updatePaymentQR: async (id: number, data: {
				qrCodeUrl?: string
				bankName?: string
				accountNumber?: string
				accountName?: string
				description?: string
				status?: 'active' | 'inactive'
			}): Promise<APIResponse<PaymentQR>> => {
				return this.request(`/payment-qr/${id}`, {
					method: 'PUT',
					body: JSON.stringify(data),
				})
			},

			setActivePaymentQR: async (id: number): Promise<APIResponse<PaymentQR>> => {
				return this.request(`/payment-qr/${id}/set-active`, {
					method: 'PATCH',
				})
			},

			deletePaymentQR: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/payment-qr/${id}`, {
					method: 'DELETE',
				})
			}
		}
	}
	address() {
		return {
			getAddresses: async (): Promise<APIResponse<Address[]>> => {
				return this.request('/addresses')
			},
			createAddress: async (data: Omit<Address, 'fullAddress' | 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<Address>> => {
				return this.request('/addresses', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},
			updateAddress: async (id: number, data: Omit<Address, 'fullAddress' | 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<Address>> => {
				return this.request(`/addresses/${id}`, {
					method: 'PUT',
					body: JSON.stringify(data),
				})
			},
			deleteAddress: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/addresses/${id}`, {
					method: 'DELETE',
				})
			},
			setDefaultAddress: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/addresses/${id}/set-default`, {
					method: 'PATCH',
					body: JSON.stringify({ isDefault: true }),
				})
			},
			getDefaultAddress: async (): Promise<APIResponse<Address>> => {
				return this.request('/addresses/default')
			},
			getAddressById: async (id: number): Promise<APIResponse<Address>> => {
				return this.request(`/addresses/${id}`)
			}
		}
	}

	// Custom Requests endpoints
	customRequest() {
		return {
			// User endpoints
			getMyCustomRequests: async (params?: {
				page?: number
				limit?: number
				status?: string
			}): Promise<APIResponse<PaginatedResponse<CustomRequest>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.status) searchParams.append('status', params.status)

				return this.request(`/custom-requests?${searchParams.toString()}`)
			},

			getCustomRequest: async (id: number): Promise<APIResponse<CustomRequest>> => {
				return this.request(`/custom-requests/${id}`)
			},

			createCustomRequest: async (data: CreateCustomRequestData): Promise<APIResponse<CustomRequest>> => {
				return this.request('/custom-requests', {
					method: 'POST',
					body: JSON.stringify(data),
				})
			},

			updateCustomRequest: async (id: number, data: UpdateCustomRequestData): Promise<APIResponse<CustomRequest>> => {
				return this.request(`/custom-requests/${id}`, {
					method: 'PUT',
					body: JSON.stringify(data),
				})
			},

			cancelCustomRequest: async (id: number): Promise<APIResponse<void>> => {
				return this.request(`/custom-requests/${id}`, {
					method: 'DELETE',
				})
			},

			// Admin endpoints
			getAllCustomRequests: async (params?: {
				page?: number
				limit?: number
				status?: string
				userId?: number
			}): Promise<APIResponse<PaginatedResponse<CustomRequest>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.status) searchParams.append('status', params.status)
				if (params?.userId) searchParams.append('userId', params.userId.toString())

				return this.request(`/admin/custom-requests?${searchParams.toString()}`)
			},

			getPendingRequests: async (params?: {
				page?: number
				limit?: number
			}): Promise<APIResponse<PaginatedResponse<CustomRequest>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())

				return this.request(`/admin/custom-requests/pending?${searchParams.toString()}`)
			},

			getQuotedRequests: async (params?: {
				page?: number
				limit?: number
			}): Promise<APIResponse<PaginatedResponse<CustomRequest>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())

				return this.request(`/admin/custom-requests/quoted?${searchParams.toString()}`)
			},

			getRequestStats: async (): Promise<APIResponse<{
				totalRequests: number
				pendingRequests: number
				quotedRequests: number
				recentRequests: CustomRequest[]
			}>> => {
				return this.request('/admin/custom-requests/stats')
			},

			getRequestsByUser: async (userId: number, params?: {
				page?: number
				limit?: number
			}): Promise<APIResponse<PaginatedResponse<CustomRequest>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())

				return this.request(`/admin/custom-requests/user/${userId}?${searchParams.toString()}`)
			},

			getAdminCustomRequest: async (id: number): Promise<APIResponse<CustomRequest>> => {
				return this.request(`/admin/custom-requests/${id}`)
			},

			provideQuotation: async (id: number, data: ProvideQuotationData): Promise<APIResponse<CustomRequest>> => {
				return this.request(`/admin/custom-requests/${id}/quote`, {
					method: 'PATCH',
					body: JSON.stringify(data),
				})
			}
		}
	}

	// Inventory Transaction endpoints
	inventoryTransaction() {
		return {
			// Get all inventory transactions with filters
			getInventoryTransactions: async (params?: {
				page?: number
				limit?: number
				search?: string
				transactionType?: 'in' | 'out' | 'adjustment'
				productVariantId?: number
				referenceType?: 'order' | 'adjustment' | 'return'
				performedById?: number
			}): Promise<APIResponse<PaginatedResponse<InventoryTransaction>>> => {
				const searchParams = new URLSearchParams()
				if (params?.page) searchParams.append('page', params.page.toString())
				if (params?.limit) searchParams.append('limit', params.limit.toString())
				if (params?.search) searchParams.append('search', params.search)
				if (params?.transactionType) searchParams.append('transactionType', params.transactionType)
				if (params?.productVariantId) searchParams.append('productVariantId', params.productVariantId.toString())
				if (params?.referenceType) searchParams.append('referenceType', params.referenceType)
				if (params?.performedById) searchParams.append('performedById', params.performedById.toString())

				return this.request(`/inventory-transactions?${searchParams.toString()}`)
			},

		}
	}

	// Update dashboard stats
	async getExtendedDashboardStats(): Promise<APIResponse<ExtendedDashboardStats>> {
		return this.request('/dashboard/extended-stats')
	}

	// Dashboard comparison data
	async getDashboardComparison(): Promise<APIResponse<{
		products: { current: number; previous: number; change: number; changePercent: string };
		customers: { current: number; previous: number; change: number; changePercent: string };
		orders: { current: number; previous: number; change: number; changePercent: string };
		revenue: { current: number; previous: number; change: number; changePercent: string };
	}>> {
		return this.request('/dashboard/comparison')
	}

	// Monthly revenue data for charts
	async getMonthlyRevenueData(): Promise<APIResponse<{
		monthlyData: Array<{
			month: string;
			revenue: number;
			orders: number;
			growth: number;
		}>;
		trends: {
			totalRevenue: number;
			averageMonthlyRevenue: number;
			highestMonth: string;
			highestRevenue: number;
			lowestMonth: string;
			lowestRevenue: number;
			overallGrowth: number;
		};
	}>> {
		return this.request('/dashboard/monthly-revenue')
	}

	// Chart data with flexible period and date range
	async getChartData(params: {
		periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
		startDate?: string;
		endDate?: string;
	}): Promise<APIResponse<{
		data: Array<{
			period: string;
			revenue: number;
			orders: number;
			customers: number;
			products: number;
			date: string;
		}>;
		periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
		dateRange: {
			from: string;
			to: string;
		};
		summary: {
			totalRevenue: number;
			totalOrders: number;
			totalCustomers: number;
			averageOrderValue: number;
			growthRate: number;
		};
	}>> {
		const searchParams = new URLSearchParams();
		searchParams.append('periodType', params.periodType);
		if (params.startDate) searchParams.append('startDate', params.startDate);
		if (params.endDate) searchParams.append('endDate', params.endDate);

		return this.request(`/dashboard/chart-data?${searchParams.toString()}`);
	}
}

export default APIClient;

