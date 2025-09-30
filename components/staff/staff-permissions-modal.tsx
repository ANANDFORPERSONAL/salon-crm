"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Shield, X, AlertTriangle, User, Mail, Lock, Unlock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StaffAPI } from "@/lib/api"

interface Permission {
  module: string
  feature: string
  enabled: boolean
}

interface Staff {
  _id: string
  name: string
  email: string
  role: string
  hasLoginAccess: boolean
  allowAppointmentScheduling: boolean
  permissions: Permission[]
  isOwner?: boolean
}

interface StaffPermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  staff: Staff | null
  onUpdate: () => void
}

const roleDefinitions = {
  admin: {
    name: 'Admin',
    description: 'Full access to all features and settings (Mandatory for admin users)',
    color: 'red',
    mandatory: true
  },
  manager: {
    name: 'Manager',
    description: 'Most features and pages, cannot access Staff Directory, Payment Settings, or POS Settings',
    color: 'blue',
    mandatory: false
  },
  staff: {
    name: 'Staff',
    description: 'Limited access: Dashboard, Quick Sale, Products (View), Services (View), General Settings',
    color: 'green',
    mandatory: false
  }
}

const moduleDefinitions = {
  dashboard: { name: 'Dashboard', description: 'Main dashboard and analytics' },
  appointments: { name: 'Appointments', description: 'Appointment scheduling and management' },
  clients: { name: 'Clients', description: 'Client management and profiles' },
  services: { name: 'Services', description: 'Service catalog and pricing' },
  products: { name: 'Products', description: 'Product inventory and management' },
  staff: { name: 'Staff Directory', description: 'Staff management and permissions' },
  sales: { name: 'Sales', description: 'Sales transactions and reporting' },
  reports: { name: 'Reports', description: 'Business reports and analytics' },
  settings: { name: 'Settings', description: 'General system settings' },
  payment_settings: { name: 'Payment Settings', description: 'Payment methods and configurations' },
  pos_settings: { name: 'POS Settings', description: 'Point of sale configurations' },
  general_settings: { name: 'General Settings', description: 'Basic system configurations' }
}

const featureDefinitions = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  manage: 'Manage'
}

export function StaffPermissionsModal({ isOpen, onClose, staff, onUpdate }: StaffPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (staff) {
      setPermissions(staff.permissions || [])
    }
  }, [staff])

  const handlePermissionChange = (module: string, feature: string, enabled: boolean) => {
    if (staff?.isOwner && staff?.role === 'admin') {
      toast({
        title: "Cannot Modify",
        description: "Admin permissions cannot be modified",
        variant: "destructive",
      })
      return
    }

    setPermissions(prev => {
      const existing = prev.find(p => p.module === module && p.feature === feature)
      if (existing) {
        return prev.map(p => 
          p.module === module && p.feature === feature 
            ? { ...p, enabled }
            : p
        )
      } else {
        return [...prev, { module, feature, enabled }]
      }
    })
  }

  const handleSave = async () => {
    if (!staff) return

    setIsLoading(true)
    try {
      await StaffAPI.update(staff._id, { permissions })
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      })
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPermissionValue = (module: string, feature: string) => {
    const permission = permissions.find(p => p.module === module && p.feature === feature)
    return permission?.enabled || false
  }

  const isAdmin = staff?.role === 'admin'
  const isOwner = staff?.isOwner

  if (!staff) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800">
                  Staff Permissions
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Configure access permissions for {staff.name}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Admin User Notice */}
        {isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Admin User Notice</h4>
                <p className="text-yellow-700 text-sm">
                  This is an admin user. Admin access is mandatory and cannot be disabled. 
                  Only one admin user is allowed in the system.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Information */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">{staff.name}</h3>
                <p className="text-slate-600 text-sm flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {staff.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-2">Current Role</p>
              <Badge 
                variant={isAdmin ? "destructive" : staff.role === 'manager' ? "default" : "secondary"}
                className="text-xs px-3 py-1.5 font-medium"
              >
                {roleDefinitions[staff.role as keyof typeof roleDefinitions]?.name || staff.role.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              {roleDefinitions[staff.role as keyof typeof roleDefinitions]?.name || staff.role}
            </Badge>
            <Badge variant={staff.hasLoginAccess ? "default" : "secondary"} className="text-xs">
              {staff.hasLoginAccess ? "Login Enabled" : "Login Disabled"}
            </Badge>
            {isOwner && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                System Admin
              </Badge>
            )}
          </div>
        </div>

        {/* Access Description */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-800 mb-2">Access Description</h4>
          <p className="text-slate-600 text-sm">
            {roleDefinitions[staff.role as keyof typeof roleDefinitions]?.description || 
             'Configure specific permissions for this user'}
          </p>
        </div>

        {/* Access Level Controls */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-800 mb-4">Access Level Controls</h4>
          <div className="space-y-4">
            {Object.entries(roleDefinitions).map(([roleKey, roleDef]) => (
              <div key={roleKey} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-1 ${
                        roleDef.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                        roleDef.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      {roleDef.name}
                    </Badge>
                    {roleDef.mandatory && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        Mandatory
                      </Badge>
                    )}
                    <p className="text-sm text-slate-600">{roleDef.description}</p>
                  </div>
                  <Switch
                    checked={staff.role === roleKey}
                    disabled={isOwner || (roleKey === 'admin' && isAdmin)}
                    onCheckedChange={() => {
                      if (!isOwner && !(roleKey === 'admin' && isAdmin)) {
                        // Handle role change if needed
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Permissions */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-800 mb-4">Detailed Permissions</h4>
          <div className="space-y-4">
            {Object.entries(moduleDefinitions).map(([moduleKey, moduleDef]) => (
              <div key={moduleKey} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="mb-3">
                  <h5 className="font-medium text-slate-800">{moduleDef.name}</h5>
                  <p className="text-sm text-slate-600">{moduleDef.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(featureDefinitions).map(([featureKey, featureName]) => (
                    <div key={featureKey} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{featureName}</span>
                      <Switch
                        checked={getPermissionValue(moduleKey, featureKey)}
                        disabled={isOwner || (isAdmin && moduleKey === 'staff')}
                        onCheckedChange={(enabled) => 
                          handlePermissionChange(moduleKey, featureKey, enabled)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isOwner}>
            {isLoading ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
