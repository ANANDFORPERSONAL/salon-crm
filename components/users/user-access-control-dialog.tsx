"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Users, UserCheck, UserX, X, Save, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { UsersAPI } from "@/lib/api"

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  mobile?: string
  role: 'admin' | 'manager' | 'staff'
  hasLoginAccess: boolean
  allowAppointmentScheduling: boolean
  isActive: boolean
}

interface UserAccessControlDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  onUserUpdated?: () => void // Callback to refresh user list
}

export function UserAccessControlDialog({ user, open, onOpenChange, onClose, onUserUpdated }: UserAccessControlDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [accessLevels, setAccessLevels] = useState({
    adminAccess: user.role === 'admin',
    managerAccess: user.role === 'admin' || user.role === 'manager',
    staffAccess: true, // All users have basic staff access
  })

  // Check if this is an admin user
  const isAdminUser = user.role === 'admin'

  const handleAccessChange = (accessType: "adminAccess" | "managerAccess" | "staffAccess", value: boolean) => {
    // Prevent disabling admin access for admin users
    if (isAdminUser && accessType === 'adminAccess' && !value) {
      toast({
        title: "Access Restricted",
        description: "Admin users cannot have their access disabled. Admin access is mandatory for admin users.",
        variant: "destructive",
      })
      return
    }

    setAccessLevels(prev => {
      const updated = { ...prev, [accessType]: value }
      
      // Ensure logical consistency
      if (accessType === 'adminAccess' && value) {
        // If admin access is enabled, enable manager and staff access
        updated.managerAccess = true
        updated.staffAccess = true
      } else if (accessType === 'managerAccess' && value) {
        // If manager access is enabled, ensure staff access is enabled
        updated.staffAccess = true
      } else if (accessType === 'staffAccess' && !value) {
        // If staff access is disabled, disable manager and admin access
        updated.managerAccess = false
        updated.adminAccess = false
      }
      
      return updated
    })
  }

  const getCurrentRole = () => {
    if (accessLevels.adminAccess) return "admin"
    if (accessLevels.managerAccess) return "manager"
    if (accessLevels.staffAccess) return "staff"
    return "none"
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: <Badge className="bg-red-100 text-red-800">Admin</Badge>,
      manager: <Badge className="bg-blue-100 text-blue-800">Manager</Badge>,
      staff: <Badge className="bg-green-100 text-green-800">Staff</Badge>,
      none: <Badge className="bg-gray-100 text-gray-800">No Access</Badge>,
    }
    return badges[role as keyof typeof badges] || badges.none
  }

  const getAccessDescription = () => {
    const role = getCurrentRole()
    if (role === 'admin') {
      return "Full access to all features and settings"
    } else if (role === 'manager') {
      return "Access to most features except Staff Directory, Payment Settings, and POS Settings"
    } else if (role === 'staff') {
      return "Limited access: Dashboard, Quick Sale, Products (View), Services (View), General Settings"
    } else {
      return "No access to any features"
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newRole = getCurrentRole()
      
      // Only update if role has changed
      if (newRole !== user.role) {
        console.log(`Updating user role from ${user.role} to ${newRole}`)
        
        // Make API call to update user role
        const response = await UsersAPI.update(user._id, {
          role: newRole,
          // Keep existing user data
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile || '',
          hasLoginAccess: user.hasLoginAccess,
          allowAppointmentScheduling: user.allowAppointmentScheduling,
        })

        if (response.success) {
          toast({
            title: "Access Control Updated",
            description: `${user.firstName} ${user.lastName} role has been updated to ${newRole.toUpperCase()}.`,
          })
          
          // Call callback to refresh user list
          if (onUserUpdated) {
            onUserUpdated()
          }
          
          onClose()
        } else {
          throw new Error(response.error || 'Failed to update user role')
        }
      } else {
        toast({
          title: "No Changes",
          description: "No changes were made to user permissions.",
        })
        onClose()
      }
    } catch (error: any) {
      console.error('Error updating user role:', error)
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || error.message || "Failed to update user permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Staff Permissions
          </DialogTitle>
          <DialogDescription>
            Configure access permissions for {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin User Warning */}
          {isAdminUser && (
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Admin User Notice</span>
              </div>
              <p className="text-sm text-yellow-700">
                This is an admin user. Admin access is mandatory and cannot be disabled. 
                Only one admin user is allowed in the system.
              </p>
            </div>
          )}

          {/* User Information */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getRoleBadge(getCurrentRole())}
                  <Badge variant={user.hasLoginAccess ? "default" : "secondary"} className="text-xs">
                    {user.hasLoginAccess ? "Login Enabled" : "Login Disabled"}
                  </Badge>
                  {isAdminUser && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      System Admin
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Role</p>
                <p className="font-medium">{getCurrentRole().toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Access Level Description */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Access Description</h4>
            <p className="text-sm text-muted-foreground">{getAccessDescription()}</p>
          </div>

          {/* Access Level Controls */}
          <div className="space-y-4">
            <h4 className="font-semibold">Access Level Controls</h4>
            
            {/* Admin Access */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-red-100 text-red-800">Admin</Badge>
                  {isAdminUser && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      Mandatory
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Full access to all features and settings
                  {isAdminUser && " (Cannot be disabled for admin users)"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`admin-${user._id}`}
                  checked={accessLevels.adminAccess}
                  onCheckedChange={(checked) => handleAccessChange("adminAccess", checked)}
                  disabled={isAdminUser} // Disable for admin users
                />
                <Label htmlFor={`admin-${user._id}`} className="text-sm font-medium">
                  Admin Access
                </Label>
              </div>
            </div>

            {/* Manager Access */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Access to most features except Staff Directory, Payment Settings, and POS Settings
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`manager-${user._id}`}
                  checked={accessLevels.managerAccess}
                  onCheckedChange={(checked) => handleAccessChange("managerAccess", checked)}
                  disabled={accessLevels.adminAccess} // Disable if admin access is enabled
                />
                <Label htmlFor={`manager-${user._id}`} className="text-sm font-medium">
                  Manager Access
                </Label>
              </div>
            </div>

            {/* Staff Access */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-100 text-green-800">Staff</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Limited access: Dashboard, Quick Sale, Products (View), Services (View), General Settings
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`staff-${user._id}`}
                  checked={accessLevels.staffAccess}
                  onCheckedChange={(checked) => handleAccessChange("staffAccess", checked)}
                  disabled={accessLevels.adminAccess || accessLevels.managerAccess} // Disable if higher access is enabled
                />
                <Label htmlFor={`staff-${user._id}`} className="text-sm font-medium">
                  Staff Access
                </Label>
              </div>
            </div>
          </div>

          {/* Access Level Definitions */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-3">Access Level Definitions</h4>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Badge className="bg-red-100 text-red-800 text-xs">Admin</Badge>
                <span className="text-muted-foreground">All pages and features, all settings and configurations, user management, system administration (Mandatory for admin users)</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-100 text-blue-800 text-xs">Manager</Badge>
                <span className="text-muted-foreground">Most features and pages, cannot access Staff Directory, Payment Settings, or POS Settings</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-100 text-green-800 text-xs">Staff</Badge>
                <span className="text-muted-foreground">Dashboard, Quick Sale, Products (View Only), Services (View Only), General Settings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 