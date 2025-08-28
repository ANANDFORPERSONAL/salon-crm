"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { UsersAPI } from "@/lib/api"
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Megaphone, 
  BarChart3, 
  Settings, 
  MessageSquare, 
  Bell, 
  User, 
  Globe, 
  Phone, 
  TrendingUp, 
  ShoppingCart, 
  FileText,
  Save,
  X
} from "lucide-react"

interface Permission {
  module: string
  feature: string
  enabled: boolean
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  hasLoginAccess: boolean
  permissions: Permission[]
}

interface UserPermissionsDialogProps {
  user: User
  onClose: () => void
}

const moduleConfig = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    features: [
      { id: 'view', name: 'Enable Dashboard' },
      { id: 'custom_range', name: 'Enable Show Custom Range' },
      { id: 'yesterday_report', name: 'Enable Yesterday Report' },
      { id: 'current_month_report', name: 'Enable Current Month Report' },
      { id: 'last_7_days_report', name: 'Enable Last 7 Days Report' },
      { id: 'last_14_days', name: 'Enable Last 14 Days' },
      { id: 'last_30_days_report', name: 'Enable Last 30 Days Report' },
      { id: 'last_1_month_report', name: 'Enable Last 1 Month Report' },
      { id: 'last_2_month_report', name: 'Enable Last 2 Month Report' },
      { id: 'last_3_month_report', name: 'Enable Last 3 Month Report' },
      { id: 'last_6_month_report', name: 'Enable Last 6 Month Report' },
      { id: 'sales_insight', name: 'Enable Sales Insight' },
      { id: 'staff_insight', name: 'Enable Staff Insight' },
      { id: 'customer_insight', name: 'Enable Customer Insight' },
    ]
  },
  {
    id: 'appointments',
    name: 'Appointment',
    icon: Calendar,
    features: [
      { id: 'view', name: 'View Appointments' },
      { id: 'create', name: 'Create Appointments' },
      { id: 'edit', name: 'Edit Appointments' },
      { id: 'delete', name: 'Delete Appointments' },
      { id: 'schedule', name: 'Schedule Appointments' },
    ]
  },
  {
    id: 'customers',
    name: 'Customers',
    icon: Users,
    features: [
      { id: 'view', name: 'View Customers' },
      { id: 'create', name: 'Create Customers' },
      { id: 'edit', name: 'Edit Customers' },
      { id: 'delete', name: 'Delete Customers' },
    ]
  },
  {
    id: 'campaigns',
    name: 'Campaigns',
    icon: Megaphone,
    features: [
      { id: 'view', name: 'View Campaigns' },
      { id: 'create', name: 'Create Campaigns' },
      { id: 'edit', name: 'Edit Campaigns' },
      { id: 'delete', name: 'Delete Campaigns' },
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: BarChart3,
    features: [
      { id: 'view', name: 'View Reports' },
      { id: 'sales_reports', name: 'Sales Reports' },
      { id: 'expense_reports', name: 'Expense Reports' },
      { id: 'cash_registry', name: 'Cash Registry' },
    ]
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    features: [
      { id: 'view', name: 'View Settings' },
      { id: 'edit', name: 'Edit Settings' },
      { id: 'user_management', name: 'User Management' },
    ]
  },
  {
    id: 'feedback_survey',
    name: 'Feedback Survey',
    icon: MessageSquare,
    features: [
      { id: 'view', name: 'View Surveys' },
      { id: 'create', name: 'Create Surveys' },
      { id: 'edit', name: 'Edit Surveys' },
      { id: 'delete', name: 'Delete Surveys' },
    ]
  },
  {
    id: 'notification',
    name: 'Notification',
    icon: Bell,
    features: [
      { id: 'view', name: 'View Notifications' },
      { id: 'send', name: 'Send Notifications' },
      { id: 'manage', name: 'Manage Notifications' },
    ]
  },
  {
    id: 'my_account',
    name: 'My Account',
    icon: User,
    features: [
      { id: 'view', name: 'View Profile' },
      { id: 'edit', name: 'Edit Profile' },
      { id: 'change_password', name: 'Change Password' },
    ]
  },
  {
    id: 'online_booking',
    name: 'Online Booking',
    icon: Globe,
    features: [
      { id: 'view', name: 'View Bookings' },
      { id: 'manage', name: 'Manage Bookings' },
      { id: 'settings', name: 'Booking Settings' },
    ]
  },
  {
    id: 'lead_management',
    name: 'Lead Management',
    icon: Phone,
    features: [
      { id: 'view', name: 'View Leads' },
      { id: 'create', name: 'Create Leads' },
      { id: 'edit', name: 'Edit Leads' },
      { id: 'delete', name: 'Delete Leads' },
    ]
  },
  {
    id: 'branches',
    name: 'Branches',
    icon: TrendingUp,
    features: [
      { id: 'view', name: 'View Branches' },
      { id: 'create', name: 'Create Branches' },
      { id: 'edit', name: 'Edit Branches' },
      { id: 'delete', name: 'Delete Branches' },
    ]
  },
  {
    id: 'whatsapp_integration',
    name: 'WhatsApp Integration',
    icon: MessageSquare,
    features: [
      { id: 'view', name: 'View Integration' },
      { id: 'configure', name: 'Configure Integration' },
      { id: 'send_messages', name: 'Send Messages' },
    ]
  },
  {
    id: 'trend_metrics',
    name: 'Trend Metrics',
    icon: TrendingUp,
    features: [
      { id: 'view', name: 'View Metrics' },
      { id: 'analytics', name: 'Analytics' },
      { id: 'reports', name: 'Metrics Reports' },
    ]
  },
  {
    id: 'quick_sale',
    name: 'Quick Sale',
    icon: ShoppingCart,
    features: [
      { id: 'view', name: 'View Sales' },
      { id: 'create', name: 'Create Sales' },
      { id: 'edit', name: 'Edit Sales' },
      { id: 'delete', name: 'Delete Sales' },
    ]
  },
]

export function UserPermissionsDialog({ user, onClose }: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>(user.permissions || [])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const hasPermission = (module: string, feature: string) => {
    return permissions.some(p => p.module === module && p.feature === feature && p.enabled)
  }

  const togglePermission = (module: string, feature: string) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.module === module && p.feature === feature)
      if (existing) {
        return prev.map(p => 
          p.module === module && p.feature === feature 
            ? { ...p, enabled: !p.enabled }
            : p
        )
      } else {
        return [...prev, { module, feature, enabled: true }]
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await UsersAPI.updatePermissions(user._id, permissions)
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      })
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update permissions",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getModuleIcon = (moduleId: string) => {
    const module = moduleConfig.find(m => m.id === moduleId)
    return module?.icon || Settings
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          <Badge variant="outline" className="mt-1">{user.role}</Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Login Access</p>
          <Badge variant={user.hasLoginAccess ? "default" : "secondary"}>
            {user.hasLoginAccess ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </div>

      {/* Permissions Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {moduleConfig.map((module) => {
            const IconComponent = module.icon
            return (
              <TabsTrigger key={module.id} value={module.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden lg:inline">{module.name}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {moduleConfig.map((module) => (
          <TabsContent key={module.id} value={module.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(module.icon, { className: "h-5 w-5" })}
                  {module.name} Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {module.features.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${module.id}-${feature.id}`} className="text-sm">
                        {feature.name}
                      </Label>
                    </div>
                    <Switch
                      id={`${module.id}-${feature.id}`}
                      checked={hasPermission(module.id, feature.id)}
                      onCheckedChange={() => togglePermission(module.id, feature.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  )
} 