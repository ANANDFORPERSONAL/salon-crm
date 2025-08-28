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
    const token = localStorage.getItem('salon-auth-token')
    console.log('🔐 API Request Interceptor: Token found:', !!token)
    console.log('🔐 API Request Interceptor: Token value:', token ? `${token.substring(0, 20)}...` : 'none')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔐 API Request Interceptor: Authorization header set')
    } else {
      console.log('⚠️ API Request Interceptor: No token found, request will be unauthenticated')
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
    const response = await apiClient.put(`/products/${id}`, data)
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

// Export the main API client for direct use if needed
export { apiClient }
export default apiClient 