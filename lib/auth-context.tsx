"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AuthAPI } from "@/lib/api"

export interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasRole: (roles: string[]) => boolean
  isAdmin: () => boolean
  isManager: () => boolean
  isStaff: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for fallback (when API is not available)
const mockUsers: (User & { password: string })[] = [
  {
    _id: "1",
    name: "John Doe",
    email: "admin@salon.com",
    password: "admin123",
    role: "admin",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    _id: "2",
    name: "Sarah Johnson",
    email: "manager@salon.com",
    password: "manager123",
    role: "manager",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    _id: "3",
    name: "David Lee",
    email: "staff@salon.com",
    password: "staff123",
    role: "staff",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Check if we have a stored token
        const storedToken = localStorage.getItem("salon-auth-token")
        const storedUser = localStorage.getItem("salon-auth-user")
        
        if (!storedToken || !storedUser) {
          console.log('🔐 No stored authentication data found')
          setIsLoading(false)
          return
        }
        
        // Validate token format (basic check)
        if (storedToken.startsWith('mock-token-')) {
          console.log('🔐 Using stored mock authentication')
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError)
            localStorage.removeItem("salon-auth-token")
            localStorage.removeItem("salon-auth-user")
          }
          setIsLoading(false)
          return
        }
        
        // Try to validate with API
        try {
          const response = await AuthAPI.getProfile()
          if (response.success && response.data) {
            console.log('✅ API authentication successful')
            setUser(response.data)
          } else {
            console.log('❌ API authentication failed, clearing stored data')
            localStorage.removeItem("salon-auth-token")
            localStorage.removeItem("salon-auth-user")
          }
        } catch (apiError) {
          console.warn('API not available, checking stored data validity')
          
          // If API is not available, try to use stored data if it's recent
          try {
            const userData = JSON.parse(storedUser)
            // Check if stored data has required fields
            if (userData && userData._id && userData.email && userData.role) {
              console.log('✅ Using stored authentication data (API unavailable)')
              setUser(userData)
            } else {
              console.log('❌ Stored data invalid, clearing')
              localStorage.removeItem("salon-auth-token")
              localStorage.removeItem("salon-auth-user")
            }
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError)
            localStorage.removeItem("salon-auth-token")
            localStorage.removeItem("salon-auth-user")
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error)
        // Clear any corrupted data
        localStorage.removeItem("salon-auth-token")
        localStorage.removeItem("salon-auth-user")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    console.log('🔍 DEBUG: Starting login process...')
    console.log('📧 Email:', email)

    try {
      // Try real API first
      console.log('🌐 Trying real API login...')
      const response = await AuthAPI.login(email, password)
      
      if (response.success) {
        const { user: userData, token } = response.data
        console.log('✅ Real API login successful')
        console.log('👤 User data:', userData)
        console.log('🔑 Token received:', token ? 'Yes' : 'No')
        setUser(userData)
        localStorage.setItem("salon-auth-token", token)
        localStorage.setItem("salon-auth-user", JSON.stringify(userData))
        setIsLoading(false)
        return true
      } else {
        console.log('❌ Real API login failed')
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("API login error:", error)
      
      // Check if it's a network error or API not available
      const isNetworkError = error instanceof Error && (
        error.message.includes('Network Error') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NETWORK') ||
        error.message.includes('fetch') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout') ||
        error.message.includes('ERR_CONNECTION_REFUSED')
      )
      
      // Also check for common fetch errors
      const isFetchError = error instanceof TypeError && (
        error.message.includes('fetch') ||
        error.message.includes('NetworkError')
      )
      
      if (isNetworkError || isFetchError) {
        console.warn("API not available, using mock authentication")
        
        // Fallback to mock authentication
        await new Promise((resolve) => setTimeout(resolve, 1000))

        try {
          // Find user with matching credentials
          const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)

          if (foundUser) {
            console.log('✅ Mock authentication successful')
            const { password: _, ...userWithoutPassword } = foundUser
            setUser(userWithoutPassword)
            // Store mock token for API calls
            const mockToken = `mock-token-${foundUser._id}-${Date.now()}`
            console.log('🔑 Mock token generated:', mockToken)
            localStorage.setItem("salon-auth-token", mockToken)
            localStorage.setItem("salon-auth-user", JSON.stringify(userWithoutPassword))
            setIsLoading(false)
            return true
          } else {
            console.log('❌ Mock authentication failed - invalid credentials')
            setIsLoading(false)
            return false
          }
        } catch (fallbackError) {
          console.error("Fallback login error:", fallbackError)
          setIsLoading(false)
          return false
        }
      } else {
        // If it's not a network error, don't fallback to mock
        console.log('❌ Not a network error, not falling back to mock')
        setIsLoading(false)
        return false
      }
    }
  }

  const logout = async () => {
    try {
      // Clear user state first to prevent race conditions
      setUser(null)
      setIsLoading(true)
      
      // Clear local storage
      localStorage.removeItem("salon-auth-token")
      localStorage.removeItem("salon-auth-user")
      
      // Clear any other stored data that might cause issues
      sessionStorage.clear()
      
      // Try real API logout (but don't wait for it)
      AuthAPI.logout().catch(error => {
        console.warn("API logout failed, but continuing with local logout:", error)
      })
      
      // Small delay to ensure state is cleared and components unmount
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Force a page refresh to ensure clean state
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Even if there's an error, ensure we're logged out
      setUser(null)
      localStorage.removeItem("salon-auth-token")
      localStorage.removeItem("salon-auth-user")
      sessionStorage.clear()
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      } else {
        router.push("/login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Role-based helper functions
  const hasRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  const isAdmin = (): boolean => {
    return hasRole(['admin'])
  }

  const isManager = (): boolean => {
    return hasRole(['admin', 'manager'])
  }

  const isStaff = (): boolean => {
    return hasRole(['admin', 'manager', 'staff'])
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      hasRole, 
      isAdmin, 
      isManager, 
      isStaff 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
