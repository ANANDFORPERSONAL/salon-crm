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
  EyeOff
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
import { UsersAPI } from "@/lib/api"
import { UserForm } from "./user-form"
import { UserAccessControlDialog } from "./user-access-control-dialog"

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
  permissions: Array<{
    module: string
    feature: string
    enabled: boolean
  }>
  specialties?: string[]
  hourlyRate?: number
  commissionRate?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAccessControlDialogOpen, setIsAccessControlDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await UsersAPI.getAll({ search: searchTerm })
      setUsers(response.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (userData: any) => {
    try {
      const response = await UsersAPI.create(userData)
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member added successfully",
        })
        setIsAddDialogOpen(false)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add staff member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding user:', error)
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async (userData: any) => {
    if (!selectedUser) return
    
    try {
      const response = await UsersAPI.update(selectedUser._id, userData)
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update staff member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      const response = await UsersAPI.delete(selectedUser._id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete staff member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'manager':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'staff':
        return <User className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'staff':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredUsers = users.filter(user =>
    (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.mobile?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl font-semibold">Staff Directory</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Manage your salon staff and their permissions</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="px-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search staff by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Staff Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Mobile</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Appointment</TableHead>
              <TableHead className="font-semibold text-gray-700">Login Access</TableHead>
              <TableHead className="font-semibold text-gray-700">Access Control</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id} className="hover:bg-gray-50">
                  <TableCell className="font-medium py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.firstName || 'N/A'} {user.lastName || 'N/A'}
                        </div>
                        {/* Show role badge for all users */}
                        <Badge 
                          variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'default' : 'secondary'} 
                          className="text-xs mt-1"
                        >
                          {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : 'Staff'}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">{user.mobile || "-"}</TableCell>
                  <TableCell className="py-4">{user.email}</TableCell>
                  <TableCell className="py-4">
                    <Badge variant={user.allowAppointmentScheduling ? "default" : "secondary"} className="text-xs">
                      {user.allowAppointmentScheduling ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant={user.hasLoginAccess ? "default" : "secondary"} className="text-xs">
                      {user.hasLoginAccess ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setIsAccessControlDialogOpen(true)
                      }}
                      disabled={!user.hasLoginAccess}
                      className={user.hasLoginAccess ? "hover:bg-blue-50" : "cursor-not-allowed opacity-50"}
                      title={user.hasLoginAccess ? "Configure access permissions" : "Login access must be enabled to configure permissions"}
                    >
                      {user.hasLoginAccess ? (
                        <Unlock className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setIsAccessControlDialogOpen(true)
                          }}
                          disabled={!user.hasLoginAccess}
                          className={!user.hasLoginAccess ? "text-gray-400 cursor-not-allowed" : ""}
                          title={user.hasLoginAccess ? "Configure access permissions" : "Login access must be enabled to configure permissions"}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Access Control
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setIsDeleteDialogOpen(true)
                          }}
                          className={user.role === 'admin' ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
                          disabled={user.role === 'admin'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {user.role === 'admin' ? 'Delete (Protected)' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Add Staff Member</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new staff account with custom permissions and access controls
            </DialogDescription>
          </DialogHeader>
          <UserForm onSubmit={handleAddUser} />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Edit Staff Member</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update staff information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm 
              user={selectedUser} 
              onSubmit={handleEditUser}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              {selectedUser?.role === 'admin' ? (
                <div className="text-red-600 font-medium">
                  Cannot delete admin user. Admin account is protected and cannot be removed from the system.
                </div>
              ) : (
                <>
                  Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? 
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            {selectedUser?.role !== 'admin' && (
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
              >
                Delete
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Control Dialog */}
      {selectedUser && (
        <UserAccessControlDialog
          user={selectedUser}
          open={isAccessControlDialogOpen}
          onOpenChange={setIsAccessControlDialogOpen}
          onClose={() => {
            setIsAccessControlDialogOpen(false)
            setSelectedUser(null)
          }}
          onUserUpdated={fetchUsers}
        />
      )}
    </Card>
  )
} 