"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserPlus, Mail, Phone, Shield, Users, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: string
  hasLoginAccess: boolean
  allowAppointmentScheduling: boolean
  createdAt: string
  lastLogin?: string
}

interface BusinessInfo {
  _id: string
  name: string
  code: string
}

function BusinessUsersContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [business, setBusiness] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (params.id) {
      fetchBusinessInfo()
      fetchUsers()
    }
  }, [params.id, searchTerm, roleFilter, statusFilter])

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/businesses/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBusiness(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching business info:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter })
      })

      const response = await fetch(`http://localhost:3001/api/admin/businesses/${params.id}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(data.data)
        }
      }
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

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(users.map(user => 
            user._id === userId ? { ...user, status: newStatus } : user
          ))
          toast({
            title: "Success",
            description: `User ${newStatus} successfully`,
          })
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(users.filter(user => user._id !== userId))
          toast({
            title: "Success",
            description: "User deleted successfully",
          })
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'manager': return 'secondary'
      case 'staff': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'suspended': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Section with Gradient */}
      <div className="mb-8 animate-in fade-in" style={{ animationDelay: '200ms' }}>
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/businesses/${params.id}`)}
                className="text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Manage Users
                </h1>
                <p className="text-indigo-100 text-lg">{business?.name} ({business?.code})</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push(`/admin/businesses/${params.id}/users/new`)}
              className="bg-white text-indigo-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 animate-in slide-in-from-bottom-2" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-semibold text-gray-800">User Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Users className="h-5 w-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600">{users.length}</div>
            </CardContent>
          </Card>
          
          <Card className="transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Shield className="h-5 w-5" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600">
                {users.filter(user => user.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg border-b border-purple-100">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Shield className="h-5 w-5" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-purple-600">
                {users.filter(user => user.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b border-orange-100">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Users className="h-5 w-5" />
                Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-orange-600">
                {users.filter(user => user.role === 'staff').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 animate-in slide-in-from-bottom-2" style={{ animationDelay: '600ms' }}>
        <Card className="transform hover:scale-[1.01] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <div className="animate-in slide-in-from-bottom-2" style={{ animationDelay: '800ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-semibold text-gray-800">Users</h2>
        </div>
        <Card className="transform hover:scale-[1.01] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription className="text-indigo-600">Manage users for this business</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600 mb-6">Get started by adding a new user to this business.</p>
                <Button 
                  onClick={() => router.push(`/admin/businesses/${params.id}/users/new`)}
                  className="bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login Access</TableHead>
                    <TableHead>Appointment Access</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {user.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.hasLoginAccess ? 'default' : 'secondary'}>
                          {user.hasLoginAccess ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.allowAppointmentScheduling ? 'default' : 'secondary'}>
                          {user.allowAppointmentScheduling ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => router.push(`/admin/businesses/${params.id}/users/${user._id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user._id, user.status === 'active' ? 'suspended' : 'active')}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function BusinessUsersPage() {
  return (
    <AdminLayout>
      <BusinessUsersContent />
    </AdminLayout>
  )
}
