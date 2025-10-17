"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  MoreHorizontal, 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock,
  User,
  Users,
  Crown,
  Eye,
  EyeOff,
  Search,
  Shield
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { StaffAPI, StaffDirectoryAPI } from "@/lib/api"
import { StaffForm } from "./staff-form"
import { StaffPermissionsModal } from "./staff-permissions-modal"

interface Staff {
  _id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'staff'
  specialties: string[]
  salary: number
  commissionProfileIds: string[]
  notes?: string
  isActive: boolean
  hasLoginAccess?: boolean
  allowAppointmentScheduling?: boolean
  permissions?: Array<{
    module: string
    feature: string
    enabled: boolean
  }>
  createdAt: string
  updatedAt: string
  isOwner?: boolean // Flag to identify business owner
}

export function StaffTable() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isAccessControlDialogOpen, setIsAccessControlDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await StaffDirectoryAPI.getAll({ search: searchTerm })
      setStaff(response.data || [])
    } catch (error) {
      console.error('Error fetching staff directory:', error)
      toast({
        title: "Error",
        description: "Failed to fetch staff directory",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    fetchStaff()
  }

  const handleAddStaff = () => {
    setSelectedStaff(null)
    setIsAddDialogOpen(true)
  }

  const handleEditStaff = (staff: Staff) => {
    if (staff.isOwner) {
      toast({
        title: "Cannot Edit",
        description: "Business owner cannot be edited from staff directory",
        variant: "destructive",
      })
      return
    }
    setSelectedStaff(staff)
    setIsEditDialogOpen(true)
  }

  const handleDeleteStaff = (staff: Staff) => {
    if (staff.isOwner) {
      toast({
        title: "Cannot Delete",
        description: "Business owner cannot be deleted",
        variant: "destructive",
      })
      return
    }
    setSelectedStaff(staff)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleStatus = async (staff: Staff) => {
    if (staff.isOwner) {
      toast({
        title: "Cannot Modify",
        description: "Business owner status cannot be modified",
        variant: "destructive",
      })
      return
    }
    
    try {
      await StaffAPI.update(staff._id, { isActive: !staff.isActive })
      toast({
        title: "Success",
        description: `Staff ${staff.isActive ? 'disabled' : 'enabled'} successfully`,
      })
      fetchStaff()
    } catch (error) {
      console.error('Error updating staff status:', error)
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      })
    }
  }


  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return

    try {
      await StaffAPI.delete(selectedStaff._id)
      toast({
        title: "Success",
        description: "Staff deleted successfully",
      })
      fetchStaff()
      setIsDeleteDialogOpen(false)
      setSelectedStaff(null)
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast({
        title: "Error",
        description: "Failed to delete staff",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string, isOwner: boolean = false) => {
    if (isOwner) {
      return <Crown className="h-4 w-4 text-purple-600" />
    }
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-purple-600" />
      case 'manager':
        return <User className="h-4 w-4 text-blue-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'manager':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Staff Members</h3>
          <p className="text-sm text-slate-600">Manage your team members and their roles</p>
        </div>
        <Button onClick={handleAddStaff} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search staff by name, email, or role..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Staff Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700 py-4 px-6">Staff Name</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-6">Mobile</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-6">Email</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-6">Appointment</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-6">Login Access</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-6">Access Control</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 py-4 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No staff members found</p>
                    <p className="text-slate-500 text-sm">Try adjusting your search criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member._id} className={`hover:bg-slate-50/50 border-b border-slate-100 transition-colors duration-200 ${member.isOwner ? "bg-purple-50" : ""}`}>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                        member.isOwner ? "bg-gradient-to-br from-purple-100 to-indigo-100" : "bg-gradient-to-br from-blue-100 to-indigo-100"
                      }`}>
                        <User className={`h-5 w-5 ${member.isOwner ? "text-purple-600" : "text-blue-600"}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          {member.name}
                          {member.isOwner && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                              Owner
                            </Badge>
                          )}
                        </div>
                        <Badge 
                          variant={member.role === 'admin' ? 'destructive' : member.role === 'manager' ? 'default' : 'secondary'} 
                          className="text-xs mt-1.5 px-2 py-1 font-medium"
                        >
                          {member.role === 'admin' ? 'Admin' : member.role === 'manager' ? 'Manager' : 'Staff'}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-slate-700 font-medium">{member.phone || "-"}</TableCell>
                  <TableCell className="py-4 px-6 text-slate-700">{member.email}</TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge 
                      variant={member.allowAppointmentScheduling ? "default" : "secondary"} 
                      className="text-xs px-3 py-1.5 font-medium"
                    >
                      {member.allowAppointmentScheduling ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge 
                      variant={member.hasLoginAccess ? "default" : "secondary"} 
                      className="text-xs px-3 py-1.5 font-medium"
                    >
                      {member.hasLoginAccess ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStaff(member)
                        setIsAccessControlDialogOpen(true)
                      }}
                      disabled={!member.hasLoginAccess || member.isOwner}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        member.hasLoginAccess && !member.isOwner
                          ? "hover:bg-blue-50 hover:text-blue-700" 
                          : "cursor-not-allowed opacity-50"
                      }`}
                      title={member.isOwner ? "Business owner permissions cannot be modified" : member.hasLoginAccess ? "Configure access permissions" : "Login access must be enabled to configure permissions"}
                    >
                      {member.hasLoginAccess && !member.isOwner ? (
                        <Unlock className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Lock className="h-5 w-5 text-slate-400" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-9 w-9 p-0 hover:bg-slate-100 rounded-lg transition-all duration-200"
                          disabled={member.isOwner}
                        >
                          <MoreHorizontal className="h-4 w-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleEditStaff(member)}
                          disabled={member.isOwner}
                          className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 text-slate-600" />
                          <span className="font-medium">Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedStaff(member)
                            setIsPermissionsDialogOpen(true)
                          }}
                          disabled={member.isOwner}
                          className={`flex items-center gap-2 px-3 py-2.5 ${
                            member.isOwner
                              ? "text-gray-400 cursor-not-allowed" 
                              : "hover:bg-slate-50 cursor-pointer"
                          }`}
                          title={member.isOwner ? "Business owner permissions cannot be modified" : "Configure detailed permissions"}
                        >
                          <Shield className="h-4 w-4 text-slate-600" />
                          <span className="font-medium">Permissions</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedStaff(member)
                            setIsAccessControlDialogOpen(true)
                          }}
                          disabled={!member.hasLoginAccess || member.isOwner}
                          className={`flex items-center gap-2 px-3 py-2.5 ${
                            !member.hasLoginAccess || member.isOwner
                              ? "text-gray-400 cursor-not-allowed" 
                              : "hover:bg-slate-50 cursor-pointer"
                          }`}
                          title={member.isOwner ? "Business owner permissions cannot be modified" : member.hasLoginAccess ? "Configure access permissions" : "Login access must be enabled to configure permissions"}
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                          <span className="font-medium">Access Control</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteStaff(member)}
                          disabled={member.isOwner}
                          className={`flex items-center gap-2 px-3 py-2.5 ${
                            member.isOwner 
                              ? "text-gray-400 cursor-not-allowed" 
                              : "text-red-600 hover:bg-red-50 cursor-pointer"
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="font-medium">
                            {member.isOwner ? 'Delete (Protected)' : 'Delete'}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        setIsEditDialogOpen(open)
        if (!open) setSelectedStaff(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {selectedStaff ? 'Update staff member information' : 'Add a new staff member to your team'}
            </DialogDescription>
          </DialogHeader>
          <StaffForm 
            staff={selectedStaff}
            onSuccess={() => {
              fetchStaff()
              setIsAddDialogOpen(false)
              setIsEditDialogOpen(false)
              setSelectedStaff(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStaff?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Control Dialog */}
      <Dialog open={isAccessControlDialogOpen} onOpenChange={setIsAccessControlDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold text-slate-800">Access Control</DialogTitle>
            <DialogDescription className="text-slate-600">
              Configure permissions and access controls for {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Login Access</label>
                <Badge 
                  variant={selectedStaff?.hasLoginAccess ? "default" : "secondary"} 
                  className="text-xs px-3 py-1.5 font-medium"
                >
                  {selectedStaff?.hasLoginAccess ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Appointment Scheduling</label>
                <Badge 
                  variant={selectedStaff?.allowAppointmentScheduling ? "default" : "secondary"} 
                  className="text-xs px-3 py-1.5 font-medium"
                >
                  {selectedStaff?.allowAppointmentScheduling ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-slate-800">Permissions</h4>
              <div className="grid grid-cols-1 gap-3">
                {selectedStaff?.permissions?.map((permission, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-700 capitalize">
                        {permission.module.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-slate-500 ml-2">
                        - {permission.feature}
                      </span>
                    </div>
                    <Badge 
                      variant={permission.enabled ? "default" : "secondary"} 
                      className="text-xs px-2 py-1"
                    >
                      {permission.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">No permissions configured</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button 
                variant="outline" 
                onClick={() => setIsAccessControlDialogOpen(false)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  // TODO: Implement permission editing
                  toast({
                    title: "Feature Coming Soon",
                    description: "Permission editing will be available in the next update",
                  })
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Permissions Modal */}
      <StaffPermissionsModal
        isOpen={isPermissionsDialogOpen}
        onClose={() => setIsPermissionsDialogOpen(false)}
        staff={selectedStaff}
        onUpdate={fetchStaff}
      />
    </div>
  )
}
