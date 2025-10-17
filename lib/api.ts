// API Configuration and HTTP Client
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('salon-auth-token')
      console.log('🔐 API Request Interceptor: Token found:', !!token)
      console.log('🔐 API Request Interceptor: Token value:', token ? `${token.substring(0, 20)}...` : 'none')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('🔐 API Request Interceptor: Authorization header set')
      } else {
        console.log('⚠️ API Request Interceptor: No token found, request will be unauthenticated')
      }
    }
    return config
  },
  (error) => {
    console.error('❌ API Request Interceptor Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response Interceptor: Success response:', {
      url: response.config.url,
      status: response.status,
      method: response.config.method,
      data: response.data
    })
    return response
  },
  (error: AxiosError) => {
    console.error('❌ API Response Interceptor: Error response:', {
      url: error.config?.url,
      status: error.response?.status,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      // Handle unauthorized access - but only if we're not already on login page
      console.log('🔐 API Response Interceptor: Unauthorized, clearing auth data')
      
      // Check if we're already on the login page to prevent infinite redirects
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('salon-auth-token')
        localStorage.removeItem('salon-auth-user')
        
        // Use router.push if available, otherwise fallback to window.location
        try {
          // Check if we're in a Next.js context
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        } catch (redirectError) {
          console.warn('Redirect failed, using fallback:', redirectError)
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// API Service Classes
export class AuthAPI {
  static async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  }

  static async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout')
    return response.data
  }

  static async getProfile(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/auth/profile')
    return response.data
  }

  static async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  }

  static async forgotPassword(email: string): Promise<ApiResponse<{ message: string; resetUrl?: string }>> {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  }

  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword })
    return response.data
  }

  static async verifyResetToken(token: string): Promise<ApiResponse<{ email: string; name: string; role: string }>> {
    const response = await apiClient.get(`/auth/verify-reset-token/${token}`)
    return response.data
  }

  static async staffLogin(email: string, password: string, businessCode: string): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await apiClient.post('/auth/staff-login', { email, password, businessCode })
    return response.data
  }
}

export class ClientsAPI {
  static async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/clients', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/clients/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/clients', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/clients/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/clients/${id}`)
    return response.data
  }

  static async search(query: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/clients/search', { params: { q: query } })
    return response.data
  }
}

export class ServicesAPI {
  static async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/services', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/services/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/services', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/services/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/services/${id}`)
    return response.data
  }
}

export class ProductsAPI {
  static async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/products', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/products/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/products', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    console.log('🔍 ProductsAPI.update - Making PUT request to:', `/products/${id}`)
    console.log('🔍 ProductsAPI.update - Full URL will be:', `${API_BASE_URL}/products/${id}`)
    console.log('🔍 ProductsAPI.update - Data being sent:', data)
    const response = await apiClient.put(`/products/${id}`, data)
    console.log('🔍 ProductsAPI.update - Response received:', response.status, response.data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/products/${id}`)
    return response.data
  }

  static async updateStock(id: string, quantity: number, operation: 'decrease' | 'increase' = 'decrease'): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(`/products/${id}/stock`, { quantity, operation })
    return response.data
  }
}

export class SuppliersAPI {
  static async getAll(params?: { search?: string; activeOnly?: boolean }): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/suppliers', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/suppliers/${id}`)
    return response.data
  }

  static async create(data: { name: string; contactPerson?: string; phone?: string; email?: string; address?: string; notes?: string }): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/suppliers', data)
    return response.data
  }

  static async update(id: string, data: { name?: string; contactPerson?: string; phone?: string; email?: string; address?: string; notes?: string; isActive?: boolean }): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/suppliers/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/suppliers/${id}`)
    return response.data
  }
}

export class CategoriesAPI {
  static async getAll(params?: { search?: string; type?: 'product' | 'service' | 'both'; activeOnly?: boolean }): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/categories', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/categories/${id}`)
    return response.data
  }

  static async create(data: { name: string; type?: 'product' | 'service' | 'both'; description?: string }): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/categories', data)
    return response.data
  }

  static async update(id: string, data: { name?: string; type?: 'product' | 'service' | 'both'; description?: string; isActive?: boolean }): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/categories/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/categories/${id}`)
    return response.data
  }
}

export class InventoryAPI {
  static async deductProduct(data: { productId: string; quantity: number; transactionType: string; reason?: string; notes?: string }): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/inventory/out', data)
    return response.data
  }

  static async getTransactions(params?: { page?: number; limit?: number; productId?: string; transactionType?: string; dateFrom?: string; dateTo?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/inventory/transactions', { params })
    return response.data
  }
}

export class AppointmentsAPI {
  static async getAll(params?: { page?: number; limit?: number; date?: string; status?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/appointments', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/appointments/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/appointments', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/appointments/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/appointments/${id}`)
    return response.data
  }

  static async updateStatus(id: string, status: string): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(`/appointments/${id}/status`, { status })
    return response.data
  }
}

export class StaffAPI {
  static async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/staff', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/staff/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/staff', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/staff/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/staff/${id}`)
    return response.data
  }
}

export class StaffDirectoryAPI {
  static async getAll(params?: { search?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/staff-directory', { params })
    return response.data
  }
}

export class ReceiptsAPI {
  static async getAll(params?: { page?: number; limit?: number; clientId?: string; date?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/receipts', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/receipts/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/receipts', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/receipts/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/receipts/${id}`)
    return response.data
  }

  static async getByClient(clientId: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/receipts/client/${clientId}`)
    return response.data
  }
}

export class SalesAPI {
  static async getAll(params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/sales', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/sales/${id}`)
    return response.data
  }

  static async getByClient(clientName: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/sales/client/${clientName}`)
    return response.data
  }

  static async getByBillNo(billNo: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/sales/bill/${billNo}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/sales', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/sales/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/sales/${id}`)
    return response.data
  }

  // Add payment to a sale
  static async addPayment(saleId: string, paymentData: {
    amount: number
    method: string
    notes?: string
    collectedBy?: string
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/sales/${saleId}/payment`, paymentData)
    return response.data
  }

  // Get payment summary for a sale
  static async getPaymentSummary(saleId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/sales/${saleId}/payment-summary`)
    return response.data
  }

  // Get unpaid/overdue bills
  static async getUnpaidBills(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/sales/unpaid/overdue', { params })
    return response.data
  }
}

export class ExpensesAPI {
  static async getAll(params?: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string; category?: string; paymentMethod?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/expenses', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/expenses/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/expenses', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/expenses/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/expenses/${id}`)
    return response.data
  }
}

export class UsersAPI {
  static async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/users', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/users', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/users/${id}`, data)
    return response.data
  }

  static async delete(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  }

  static async getPermissions(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/users/${id}/permissions`)
    return response.data
  }

  static async updatePermissions(id: string, permissions: any[]): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/users/${id}/permissions`, { permissions })
    return response.data
  }

  static async changePassword(id: string, oldPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/users/${id}/change-password`, { oldPassword, newPassword })
    return response.data
  }

  static async verifyAdminPassword(id: string, password: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/users/${id}/verify-admin-password`, { password })
    return response.data
  }
}

export class ReportsAPI {
  static async getRevenueReport(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/reports/revenue', { params })
    return response.data
  }

  static async getServicePopularity(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/reports/services', { params })
    return response.data
  }

  static async getClientRetention(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/reports/clients', { params })
    return response.data
  }

  static async getDashboardStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/reports/dashboard')
    return response.data
  }
}

export class SettingsAPI {
  static async getBusinessSettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/settings/business')
    return response.data
  }

  static async updateBusinessSettings(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/settings/business', data)
    return response.data
  }

  static async incrementReceiptNumber(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/settings/business/increment-receipt')
    return response.data
  }

  static async getPOSSettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/settings/pos')
    return response.data
  }

  static async updatePOSSettings(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/settings/pos', data)
    return response.data
  }

  static async resetReceiptSequence(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/settings/pos/reset-sequence')
    return response.data
  }

  static async getAppointmentSettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/settings/appointments')
    return response.data
  }

  static async updateAppointmentSettings(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/settings/appointments', data)
    return response.data
  }

  static async getPaymentSettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/settings/payment')
    return response.data
  }

  static async updatePaymentSettings(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/settings/payment', data)
    return response.data
  }
}

export class CashRegistryAPI {
  static async getAll(params?: { 
    page?: number; 
    limit?: number; 
    dateFrom?: string; 
    dateTo?: string; 
    shiftType?: string; 
    search?: string 
  }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/cash-registry', { params })
    return response.data
  }

  static async getById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/cash-registry/${id}`)
    return response.data
  }

  static async create(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/cash-registry', data)
    return response.data
  }

  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/cash-registry/${id}`, data)
    return response.data
  }

  static async delete(id: string, shiftType?: string): Promise<ApiResponse> {
    // For now, just delete by ID without shiftType parameter
    // TODO: Implement proper shiftType handling when backend supports it
    const response = await apiClient.delete(`/cash-registry/${id}`)
    return response.data
  }

  static async verify(id: string, data: { 
    verificationNotes?: string; 
    balanceDifferenceReason?: string; 
    onlineCashDifferenceReason?: string 
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/cash-registry/${id}/verify`, data)
    return response.data
  }

  static async getDashboardSummary(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/cash-registry/summary/dashboard')
    return response.data
  }
}

export class StaffPerformanceAPI {
  // Get staff performance data with filtering options
  static async getPerformanceData(params?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
    period?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'currentMonth' | 'all';
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/staff/performance', { params })
    return response.data
  }

  // Get detailed performance metrics for a specific staff member
  static async getStaffDetails(staffId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/staff/performance/${staffId}`, { params })
    return response.data
  }

  // Get commission data for staff members
  static async getCommissionData(params?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/staff/commission', { params })
    return response.data
  }

  // Update commission rates for a staff member
  static async updateCommissionRates(staffId: string, data: {
    serviceCommissionRate?: number;
    productCommissionRate?: number;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/staff/commission/${staffId}`, data)
    return response.data
  }

  // Get staff performance summary (dashboard cards data)
  static async getPerformanceSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/staff/performance/summary', { params })
    return response.data
  }

  // Get staff sales analytics
  static async getSalesAnalytics(params?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/staff/sales-analytics', { params })
    return response.data
  }

  // Get customer retention data for staff
  static async getCustomerRetention(params?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/staff/customer-retention', { params })
    return response.data
  }

  // Calculate commission for a specific sale
  static async calculateCommission(data: {
    staffId: string;
    saleId: string;
    serviceCommissionRate?: number;
    productCommissionRate?: number;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/staff/commission/calculate', data)
    return response.data
  }

  // Get staff performance comparison
  static async getPerformanceComparison(params?: {
    staffIds?: string[];
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/staff/performance/comparison', { params })
    return response.data
  }

  // Export staff performance data
  static async exportPerformanceData(params?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
    format?: 'pdf' | 'excel';
  }): Promise<Blob> {
    const response = await apiClient.get('/staff/performance/export', { 
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

export class CommissionProfileAPI {
  static async getProfiles() {
    try {
      const response = await apiClient.get('/commission-profiles')
      return response.data
    } catch (error) {
      console.error('Error fetching commission profiles:', error)
      throw error
    }
  }

  static async createProfile(data: any) {
    try {
      const response = await apiClient.post('/commission-profiles', data)
      return response.data
    } catch (error) {
      console.error('Error creating commission profile:', error)
      throw error
    }
  }

  static async updateProfile(id: string, data: any) {
    try {
      const response = await apiClient.put(`/commission-profiles/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating commission profile:', error)
      throw error
    }
  }

  static async deleteProfile(id: string) {
    try {
      const response = await apiClient.delete(`/commission-profiles/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting commission profile:', error)
      throw error
    }
  }
}

// Export the main API client for direct use if needed
export { apiClient }
export default apiClient 