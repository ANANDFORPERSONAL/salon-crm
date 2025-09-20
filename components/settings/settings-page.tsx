"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Building2, Calendar, CreditCard, Bell, Users, ChevronRight, Receipt, Award, DollarSign, Calculator } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { GeneralSettings } from "./general-settings"
import { BusinessSettings } from "./business-settings"
import { AppointmentSettings } from "./appointment-settings"
import { PaymentSettings } from "./payment-settings"
import { CurrencySettings } from "./currency-settings"
import { TaxSettings } from "./tax-settings"
import { NotificationSettings } from "./notification-settings"
import { StaffDirectory } from "./staff-directory"
import { POSSettings } from "./pos-settings"
import { CommissionProfileList } from "./commission-profile-list"

const settingsCategories = [
  {
    id: "general",
    title: "General Settings",
    description: "Basic application preferences and configurations",
    icon: Settings,
    requiredRole: null, // Staff can access
  },
  {
    id: "business",
    title: "Business Settings",
    description: "Company information, branding, and business details",
    icon: Building2,
    requiredRole: "admin",
  },
  {
    id: "appointments",
    title: "Appointment Settings",
    description: "Booking rules, time slots, and appointment preferences",
    icon: Calendar,
    requiredRole: "manager",
  },
  {
    id: "currency",
    title: "Currency Settings",
    description: "Default currency, symbols, and formatting options",
    icon: DollarSign,
    requiredRole: "admin", // Only admin can access
  },
  {
    id: "tax",
    title: "Tax Settings",
    description: "Tax rates, GST configuration, and calculation methods",
    icon: Calculator,
    requiredRole: "admin", // Only admin can access
  },
  {
    id: "payments",
    title: "Payment Settings",
    description: "Payment methods and processing configuration",
    icon: CreditCard,
    requiredRole: "admin", // Only admin can access
  },
  {
    id: "pos",
    title: "POS Settings",
    description: "Invoice sequence management and custom prefix configuration",
    icon: Receipt,
    requiredRole: "admin", // Only admin can access
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Email alerts, SMS notifications, and reminder settings",
    icon: Bell,
    requiredRole: "manager",
  },
  {
    id: "staff",
    title: "Staff Directory",
    description: "Manage staff accounts, roles, and permissions",
    icon: Users,
    requiredRole: "admin", // Only admin can access
  },
  {
    id: "commission",
    title: "Commission Management",
    description: "Configure commission profiles and target-based incentives",
    icon: Award,
    requiredRole: "admin", // Only admin can access
  },
]

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Basic authentication check
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  const canAccessSetting = (requiredRole: string | null) => {
    if (!requiredRole) return true
    if (!user) return false

    const roleHierarchy = { admin: 3, manager: 2, staff: 1 }
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  }

  const renderSettingComponent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />
      case "business":
        return <BusinessSettings />
      case "appointments":
        return <AppointmentSettings />
      case "currency":
        return <CurrencySettings />
      case "tax":
        return <TaxSettings />
      case "payments":
        return <PaymentSettings />
      case "pos":
        return <POSSettings />
      case "notifications":
        return <NotificationSettings />
      case "staff":
        return <StaffDirectory />
      case "commission":
        return <CommissionProfileList />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Elegant Header Section */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header Background */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Settings className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-1">
                  Settings & Configuration
                </h1>
                <p className="text-slate-600 text-base">
                  Manage your salon CRM configuration, preferences, and system settings
                </p>
              </div>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="px-8 py-4 bg-white border-t border-slate-100">
            <div className="flex items-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>System preferences & localization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Business & payment configuration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Staff management & permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Commission profiles & incentives</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Settings Categories
              </h2>
              <div className="space-y-3">
                {settingsCategories.map((category) => {
                  const Icon = category.icon
                  const hasAccess = canAccessSetting(category.requiredRole)
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveSection(category.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200 ${
                        activeSection === category.id
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-[1.02]"
                          : hasAccess
                          ? "hover:bg-slate-50 hover:shadow-md border border-transparent hover:border-slate-200 hover:transform hover:scale-[1.01]"
                          : "opacity-50 cursor-not-allowed bg-slate-50"
                      }`}
                      disabled={!hasAccess}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg transition-all duration-200 ${
                          activeSection === category.id 
                            ? "bg-white/20" 
                            : "bg-blue-50"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            activeSection === category.id 
                              ? "text-white" 
                              : "text-blue-600"
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{category.title}</div>
                          <div className={`text-xs ${
                            activeSection === category.id 
                              ? "text-white/90" 
                              : "text-slate-500"
                          }`}>
                            {category.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasAccess && (
                          <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-600 px-2 py-1">
                            {category.requiredRole}
                          </Badge>
                        )}
                        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                          activeSection === category.id 
                            ? "text-white transform rotate-90" 
                            : "text-slate-400"
                        }`} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection ? (
            renderSettingComponent()
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-10">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Settings className="h-12 w-12 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Welcome to Settings</h2>
                  <p className="text-slate-600 mb-10 max-w-lg mx-auto text-lg">
                    Select a category from the sidebar to configure your salon CRM settings and preferences.
                  </p>
                  
                  <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
                    <div className="p-8 border border-slate-200 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02]">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Settings className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">Quick Access</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Start with General Settings to configure basic preferences and localization for your salon.
                      </p>
                    </div>
                    <div className="p-8 border border-slate-200 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02]">
                      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users className="h-8 w-8 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">Staff Management</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Access Staff Directory to manage user permissions and access levels for your team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
