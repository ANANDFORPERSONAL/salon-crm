"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Building2, Calendar, CreditCard, Bell, Users, ChevronRight, Receipt } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { GeneralSettings } from "./general-settings"
import { BusinessSettings } from "./business-settings"
import { AppointmentSettings } from "./appointment-settings"
import { PaymentSettings } from "./payment-settings"
import { NotificationSettings } from "./notification-settings"
import { StaffDirectory } from "./staff-directory"
import { POSSettings } from "./pos-settings"

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
    id: "payments",
    title: "Payment Settings",
    description: "Payment methods, tax rates, and billing configuration",
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
]

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const { user } = useAuth()

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
      case "payments":
        return <PaymentSettings />
      case "pos":
        return <POSSettings />
      case "notifications":
        return <NotificationSettings />
      case "staff":
        return <StaffDirectory />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your salon CRM configuration and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Settings Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {settingsCategories.map((category) => {
                const Icon = category.icon
                const hasAccess = canAccessSetting(category.requiredRole)
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveSection(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      activeSection === category.id
                        ? "bg-primary text-primary-foreground"
                        : hasAccess
                        ? "hover:bg-muted"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    disabled={!hasAccess}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{category.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasAccess && (
                        <Badge variant="secondary" className="text-xs">
                          {category.requiredRole}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection ? (
            renderSettingComponent()
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Settings</CardTitle>
                <CardDescription>
                  Select a category from the sidebar to configure your salon CRM settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Quick Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Start with General Settings to configure basic preferences.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Staff Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Access Staff Directory to manage user permissions and access levels.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
