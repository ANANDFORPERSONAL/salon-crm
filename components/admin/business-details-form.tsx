"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Building2, User, CreditCard, Loader2, Phone, MapPin, TrendingUp, Settings, Edit, Users, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface BusinessDetails {
  _id: string
  name: string
  code: string
  businessType: string
  status: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  subscription: {
    plan: string
    status: string
    startDate: string
    maxUsers: number
    maxBranches: number
  }
  owner: {
    _id: string
    name: string
    email: string
    phone: string
  }
  settings?: {
    timezone: string
    currency: string
    taxRate: number
    gstNumber?: string
  }
  createdAt: string
  updatedAt: string
  isOnboarded: boolean
  onboardingStep: number
}

export function BusinessDetailsForm() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [business, setBusiness] = useState<BusinessDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchBusinessDetails()
    }
  }, [params.id])

  const fetchBusinessDetails = async () => {
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
      console.error('Error fetching business details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch business details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/admin/businesses/${params.id}/edit`)
  }

  const handleManageUsers = () => {
    router.push(`/admin/businesses/${params.id}/users`)
  }

  const handleSuspend = async () => {
    if (!business) return
    
    const newStatus = business.status === 'active' ? 'suspended' : 'active'
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/businesses/${params.id}/status`, {
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
          setBusiness({ ...business, status: newStatus })
          toast({
            title: "Success",
            description: `Business ${newStatus} successfully`,
          })
        }
      }
    } catch (error) {
      console.error('Error updating business status:', error)
      toast({
        title: "Error",
        description: "Failed to update business status",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading business details...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
          <p className="text-gray-600 mb-6">The business you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/businesses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Businesses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/businesses')}
                className="text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                  Business Details
                </h1>
                <p className="text-gray-600 text-lg">Business Code: {business.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={business.status === 'active' ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                {business.status}
              </Badge>
              <Button onClick={handleEdit} variant="secondary" className="bg-gray-100 hover:bg-gray-200 border-gray-300">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleSuspend} variant={business.status === 'active' ? 'destructive' : 'default'} className="transform hover:scale-105 transition-all duration-300">
                <Shield className="h-4 w-4 mr-2" />
                {business.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Business Form in Read-Only Mode */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Business Information */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Basic business details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Business Name</Label>
                <Input
                  value={business.name}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Business Type</Label>
                <Input
                  value={business.businessType.charAt(0).toUpperCase() + business.businessType.slice(1).replace('_', ' ')}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Street Address</Label>
                  <Input
                    value={business.address.street}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">City</Label>
                  <Input
                    value={business.address.city}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">State</Label>
                  <Input
                    value={business.address.state}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">ZIP Code</Label>
                  <Input
                    value={business.address.zipCode}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Country</Label>
                  <Input
                    value={business.address.country}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <Input
                    value={business.contact.phone}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    value={business.contact.email}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Website</Label>
                  <Input
                    value={business.contact.website || 'Not provided'}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <User className="h-5 w-5" />
              Owner Information
            </CardTitle>
            <CardDescription>
              Business owner details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Owner Name</Label>
                <Input
                  value={business.owner.name}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Owner Email</Label>
                <Input
                  value={business.owner.email}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Owner Phone</Label>
                <Input
                  value={business.owner.phone}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="pt-6 border-t border-green-100">
              <Button onClick={handleManageUsers} className="bg-green-600 hover:bg-green-700 transform hover:scale-105 transition-all duration-300">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg border-b border-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <CreditCard className="h-5 w-5" />
              Subscription Information
            </CardTitle>
            <CardDescription>
              Plan details and subscription limits
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Plan Type</Label>
                <Input
                  value={business.subscription.plan.charAt(0).toUpperCase() + business.subscription.plan.slice(1)}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={business.subscription.status}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <Badge variant={business.subscription.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                    {business.subscription.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Max Users</Label>
                <Input
                  value={business.subscription.maxUsers.toString()}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Max Branches</Label>
                <Input
                  value={business.subscription.maxBranches.toString()}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                <Input
                  value={new Date(business.subscription.startDate).toLocaleDateString()}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        {business.settings && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b border-orange-100">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Settings className="h-5 w-5" />
                Business Settings
              </CardTitle>
              <CardDescription>
                Configuration and operational settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Timezone</Label>
                  <Input
                    value={business.settings.timezone}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Currency</Label>
                  <Input
                    value={business.settings.currency}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tax Rate (%)</Label>
                  <Input
                    value={business.settings.taxRate?.toString() || 'Not set'}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">GST Number</Label>
                  <Input
                    value={business.settings.gstNumber || 'Not provided'}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="h-5 w-5" />
              Additional Information
            </CardTitle>
            <CardDescription>
              Business status and onboarding information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Business Status</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={business.status}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <Badge variant={business.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                    {business.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Onboarding Status</Label>
                <Input
                  value={business.isOnboarded ? 'Completed' : `Step ${business.onboardingStep}`}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                <Input
                  value={new Date(business.createdAt).toLocaleDateString()}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                <Input
                  value={new Date(business.updatedAt).toLocaleDateString()}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
