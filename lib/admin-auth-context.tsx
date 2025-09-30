"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export interface Admin {
  id: string
  name: string
  email: string
  role: string
  permissions: any[]
}

interface AdminAuthContextType {
  admin: Admin | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }
        
        const storedToken = localStorage.getItem("admin-auth-token")
        const storedAdmin = localStorage.getItem("admin-auth-user")
        
        if (!storedToken || !storedAdmin) {
          setIsLoading(false)
          return
        }
        
        // Validate token with API
        try {
          const response = await fetch('/api/admin/profile', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setAdmin(data.data)
            } else {
              // Clear invalid session
              localStorage.removeItem("admin-auth-token")
              localStorage.removeItem("admin-auth-user")
            }
          } else {
            // Clear invalid session
            localStorage.removeItem("admin-auth-token")
            localStorage.removeItem("admin-auth-user")
          }
        } catch (error) {
          console.error('Token validation error:', error)
          // Clear invalid session
          localStorage.removeItem("admin-auth-token")
          localStorage.removeItem("admin-auth-user")
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const { admin: adminData, token } = data.data
        setAdmin(adminData)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem("admin-auth-token", token)
          localStorage.setItem("admin-auth-user", JSON.stringify(adminData))
        }
        
        setIsLoading(false)
        return true
      } else {
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("Admin login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setAdmin(null)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem("admin-auth-token")
      localStorage.removeItem("admin-auth-user")
    }
    
    router.push('/admin/login')
  }

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
