"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Building2, User, CreditCard, Loader2, Phone, MapPin, TrendingUp, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Create schema factory function
const createBusinessSchema = (isEditMode: boolean) => z.object({
  // Business Information
  businessName: isEditMode ? z.string().optional() : z.string().min(2, "Business name must be at least 2 characters"),
  businessType: isEditMode ? z.enum(["salon", "spa", "barbershop", "beauty_clinic"]).optional() : z.enum(["salon", "spa", "barbershop", "beauty_clinic"]),
  street: isEditMode ? z.string().optional() : z.string().min(5, "Street address is required"),
  city: isEditMode ? z.string().optional() : z.string().min(2, "City is required"),
  state: isEditMode ? z.string().optional() : z.string().min(2, "State is required"),
  zipCode: isEditMode ? z.string().optional() : z.string().min(5, "ZIP code is required"),
  country: z.string().default("India"),
  phone: isEditMode ? z.string().optional() : z.string().min(10, "Phone number is required"),
  email: isEditMode ? z.string().email("Valid email is required").optional() : z.string().email("Valid email is required"),
  website: z.string().optional(),
  
  // Owner Information
  ownerFirstName: isEditMode ? z.string().optional() : z.string().min(2, "First name is required"),
  ownerLastName: isEditMode ? z.string().optional() : z.string().min(2, "Last name is required"),
  ownerEmail: isEditMode ? z.string().email("Valid email is required").optional() : z.string().email("Valid email is required"),
  ownerPhone: isEditMode ? z.string().optional() : z.string().min(10, "Phone number is required"),
  ownerPassword: isEditMode ? z.string().optional() : z.string().min(6, "Password must be at least 6 characters"),
  
  // Subscription Information
  plan: isEditMode ? z.enum(["basic", "premium", "enterprise"]).optional() : z.enum(["basic", "premium", "enterprise"]),
  maxUsers: isEditMode ? z.number().optional() : z.number().min(1, "At least 1 user required"),
  maxBranches: isEditMode ? z.number().optional() : z.number().min(1, "At least 1 branch required"),
  
  // Business Settings
  timezone: z.string().default("Asia/Kolkata"),
  currency: z.string().default("INR"),
  taxRate: z.number().min(0).max(100).default(18),
  gstNumber: z.string().optional(),
})

type BusinessFormData = z.infer<ReturnType<typeof createBusinessSchema>>

interface BusinessFormProps {
  mode?: 'create' | 'edit'
  businessId?: string
}

export function CreateBusinessForm({ mode = 'create', businessId }: BusinessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  
  // Get business ID from params if not provided as prop
  const currentBusinessId = businessId || params?.id as string
  const isEditMode = mode === 'edit' || !!currentBusinessId

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(createBusinessSchema(isEditMode)) as any,
    defaultValues: {
      businessName: "",
      businessType: "salon",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      phone: "",
      email: "",
      website: "",
      ownerFirstName: "",
      ownerLastName: "",
      ownerEmail: "",
      ownerPhone: "",
      ownerPassword: "",
      plan: "basic",
      maxUsers: 5,
      maxBranches: 1,
      timezone: "Asia/Kolkata",
      currency: "INR",
      taxRate: 18,
      gstNumber: "",
    },
  })

  // Load business data for edit mode
  useEffect(() => {
    if (isEditMode && currentBusinessId) {
      loadBusinessData()
    }
  }, [isEditMode, currentBusinessId])

  const loadBusinessData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/admin/businesses/${currentBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const business = data.data
          
          // Map the business data to form format
          form.reset({
            businessName: business.name,
            businessType: business.businessType,
            street: business.address.street,
            city: business.address.city,
            state: business.address.state,
            zipCode: business.address.zipCode,
            country: business.address.country,
            phone: business.contact.phone,
            email: business.contact.email,
            website: business.contact.website || '',
            ownerFirstName: business.owner.name.split(' ')[0] || '',
            ownerLastName: business.owner.name.split(' ').slice(1).join(' ') || '',
            ownerEmail: business.owner.email,
            ownerPhone: business.owner.phone,
            ownerPassword: '', // Don't pre-fill password for security
            plan: business.subscription.plan,
            maxUsers: business.subscription.maxUsers,
            maxBranches: business.subscription.maxBranches,
            timezone: business.settings?.timezone || 'Asia/Kolkata',
            currency: business.settings?.currency || 'INR',
            taxRate: business.settings?.taxRate || 18,
            gstNumber: business.settings?.gstNumber || '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading business data:', error)
      toast({
        title: "Error",
        description: "Failed to load business data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true)
    
    try {
      // Filter out empty/undefined values for edit mode
      const filterEmptyValues = (obj: any) => {
        const filtered: any = {}
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'object' && !Array.isArray(value)) {
              const nested = filterEmptyValues(value)
              if (Object.keys(nested).length > 0) {
                filtered[key] = nested
              }
            } else {
              filtered[key] = value
            }
          }
        }
        return filtered
      }

      const businessData = {
        businessInfo: {
          ...(data.businessName && { name: data.businessName }),
          ...(data.businessType && { businessType: data.businessType }),
          address: {
            ...(data.street && { street: data.street }),
            ...(data.city && { city: data.city }),
            ...(data.state && { state: data.state }),
            ...(data.zipCode && { zipCode: data.zipCode }),
            ...(data.country && { country: data.country })
          },
          contact: {
            ...(data.phone && { phone: data.phone }),
            ...(data.email && { email: data.email }),
            ...(data.website && { website: data.website })
          },
          settings: {
            ...(data.timezone && { timezone: data.timezone }),
            ...(data.currency && { currency: data.currency }),
            ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
            ...(data.gstNumber && { gstNumber: data.gstNumber }),
            operatingHours: {
              monday: { open: "09:00", close: "18:00", closed: false },
              tuesday: { open: "09:00", close: "18:00", closed: false },
              wednesday: { open: "09:00", close: "18:00", closed: false },
              thursday: { open: "09:00", close: "18:00", closed: false },
              friday: { open: "09:00", close: "18:00", closed: false },
              saturday: { open: "09:00", close: "18:00", closed: false },
              sunday: { open: "09:00", close: "18:00", closed: true }
            }
          }
        },
        ownerInfo: {
          ...(data.ownerFirstName && { firstName: data.ownerFirstName }),
          ...(data.ownerLastName && { lastName: data.ownerLastName }),
          ...(data.ownerEmail && { email: data.ownerEmail }),
          ...(data.ownerPhone && { phone: data.ownerPhone }),
          ...(data.ownerPassword && { password: data.ownerPassword })
        },
        subscriptionInfo: {
          ...(data.plan && { plan: data.plan }),
          ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers }),
          ...(data.maxBranches !== undefined && { maxBranches: data.maxBranches }),
          ...(data.plan && { features: getPlanFeatures(data.plan) })
        }
      }

      // Filter out empty nested objects for edit mode
      const filteredBusinessData = isEditMode ? filterEmptyValues(businessData) : businessData

      let response
      if (isEditMode) {
        // Update existing business
        response = await fetch(`http://localhost:3001/api/admin/businesses/${currentBusinessId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`
          },
          body: JSON.stringify(filteredBusinessData)
        })
      } else {
        // Create new business
        response = await fetch('http://localhost:3001/api/admin/businesses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`
          },
          body: JSON.stringify(businessData)
        })
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: isEditMode ? "Business Updated Successfully" : "Business Created Successfully",
          description: isEditMode 
            ? `Business "${data.businessName}" has been updated successfully.`
            : `Business "${data.businessName}" has been created with owner access.`,
        })
        router.push('/admin/businesses')
      } else {
        toast({
          title: isEditMode ? "Update Failed" : "Creation Failed",
          description: result.error || `Failed to ${isEditMode ? 'update' : 'create'} business`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`${isEditMode ? 'Update' : 'Create'} business error:`, error)
      toast({
        title: isEditMode ? "Update Failed" : "Creation Failed",
        description: `An error occurred while ${isEditMode ? 'updating' : 'creating'} the business`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPlanFeatures = (plan: string) => {
    const features = {
      basic: ['basic_reporting', 'email_support', 'mobile_app'],
      premium: ['advanced_analytics', 'priority_support', 'custom_integrations', 'api_access'],
      enterprise: ['custom_reporting', 'dedicated_support', 'white_label', 'unlimited_users']
    }
    return features[plan as keyof typeof features] || []
  }

  // Helper function to get label with optional asterisk
  const getLabel = (text: string, required: boolean = true) => {
    return isEditMode ? text : `${text}${required ? ' *' : ''}`
  }

  // Show loading state when loading business data for edit
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading business data...</p>
          </div>
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
                onClick={() => router.back()}
                className="text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  {isEditMode ? 'Edit Business' : 'Create New Business'}
                </h1>
                <p className="text-indigo-100 text-lg">
                  {isEditMode ? 'Update business information and settings' : 'Set up a new salon business account'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <div className="max-w-6xl mx-auto">
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">

          {/* Business Information Section */}
          <div className="space-y-8 animate-in slide-in-from-bottom-2" style={{ animationDelay: '400ms' }}>
              
              <Card className="transform hover:scale-[1.01] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Building2 className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Enter the basic information about the salon business
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">{getLabel("Business Name")}</Label>
                      <Input
                        id="businessName"
                        placeholder="e.g., Glamour Salon & Spa"
                        {...form.register("businessName")}
                        className="mt-1"
                      />
                      {form.formState.errors.businessName && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessType" className="text-sm font-medium text-gray-700">{getLabel("Business Type")}</Label>
                      <Select onValueChange={(value) => form.setValue("businessType", value as any)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salon">Salon</SelectItem>
                          <SelectItem value="spa">Spa</SelectItem>
                          <SelectItem value="barbershop">Barbershop</SelectItem>
                          <SelectItem value="beauty_clinic">Beauty Clinic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-gray-800">Address</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="street" className="text-sm font-medium text-gray-700">{getLabel("Street Address")}</Label>
                        <Input
                          id="street"
                          placeholder="123 Beauty Street"
                          {...form.register("street")}
                          className="mt-1"
                        />
                        {form.formState.errors.street && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.street.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">{getLabel("City")}</Label>
                        <Input
                          id="city"
                          placeholder="Mumbai"
                          {...form.register("city")}
                          className="mt-1"
                        />
                        {form.formState.errors.city && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.city.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium text-gray-700">{getLabel("State")}</Label>
                        <Input
                          id="state"
                          placeholder="Maharashtra"
                          {...form.register("state")}
                          className="mt-1"
                        />
                        {form.formState.errors.state && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.state.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">{getLabel("ZIP Code")}</Label>
                        <Input
                          id="zipCode"
                          placeholder="400001"
                          {...form.register("zipCode")}
                          className="mt-1"
                        />
                        {form.formState.errors.zipCode && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.zipCode.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                        <Input
                          id="country"
                          value="India"
                          disabled
                          {...form.register("country")}
                          className="mt-1"
                        />
                      </div>
                  </div>
                </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-600" />
                      <h4 className="text-lg font-semibold text-gray-800">Contact Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">{getLabel("Phone Number")}</Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          {...form.register("phone")}
                          className="mt-1"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">{getLabel("Business Email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="info@glamoursalon.com"
                          {...form.register("email")}
                          className="mt-1"
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website (Optional)</Label>
                        <Input
                          id="website"
                          placeholder="https://www.glamoursalon.com"
                          {...form.register("website")}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-orange-600" />
                      <h4 className="text-lg font-semibold text-gray-800">Business Settings</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-sm font-medium text-gray-700">Timezone</Label>
                        <Select onValueChange={(value) => form.setValue("timezone", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                            <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                            <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Currency</Label>
                        <Select onValueChange={(value) => form.setValue("currency", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxRate" className="text-sm font-medium text-gray-700">Tax Rate (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          {...form.register("taxRate", { valueAsNumber: true })}
                          className="mt-1"
                        />
                        {form.formState.errors.taxRate && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.taxRate.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gstNumber" className="text-sm font-medium text-gray-700">GST Number (Optional)</Label>
                      <Input
                        id="gstNumber"
                        placeholder="12ABCDE1234F1Z5"
                        {...form.register("gstNumber")}
                        className="mt-1"
                      />
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Owner Information Section */}
          <div className="space-y-8 animate-in slide-in-from-bottom-2" style={{ animationDelay: '600ms' }}>
              
              <Card className="transform hover:scale-[1.01] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <User className="h-5 w-5" />
                    Owner Account Details
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Set up the business owner account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ownerFirstName" className="text-sm font-medium text-gray-700">{getLabel("First Name")}</Label>
                      <Input
                        id="ownerFirstName"
                        placeholder="John"
                        {...form.register("ownerFirstName")}
                        className="mt-1"
                      />
                      {form.formState.errors.ownerFirstName && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.ownerFirstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerLastName" className="text-sm font-medium text-gray-700">{getLabel("Last Name")}</Label>
                      <Input
                        id="ownerLastName"
                        placeholder="Doe"
                        {...form.register("ownerLastName")}
                        className="mt-1"
                      />
                      {form.formState.errors.ownerLastName && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.ownerLastName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail" className="text-sm font-medium text-gray-700">{getLabel("Email Address")}</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        placeholder="john@glamoursalon.com"
                        {...form.register("ownerEmail")}
                        className="mt-1"
                      />
                      {form.formState.errors.ownerEmail && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.ownerEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerPhone" className="text-sm font-medium text-gray-700">{getLabel("Phone Number")}</Label>
                      <Input
                        id="ownerPhone"
                        placeholder="+91 98765 43210"
                        {...form.register("ownerPhone")}
                        className="mt-1"
                      />
                      {form.formState.errors.ownerPhone && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.ownerPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="ownerPassword" className="text-sm font-medium text-gray-700">
                        {isEditMode ? 'New Password (Optional)' : 'Password *'}
                      </Label>
                      <Input
                        id="ownerPassword"
                        type="password"
                        placeholder={isEditMode ? "Leave blank to keep current password" : "Enter a strong password"}
                        {...form.register("ownerPassword")}
                        className="mt-1"
                      />
                      {form.formState.errors.ownerPassword && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.ownerPassword.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {isEditMode 
                          ? "Only enter a new password if you want to change it. Leave blank to keep the current password."
                          : "This will be the login password for the business owner"
                        }
                      </p>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plan Section */}
          <div className="space-y-8 animate-in slide-in-from-bottom-2" style={{ animationDelay: '800ms' }}>
              
              <Card className="transform hover:scale-[1.01] transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg border-b border-purple-100">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <CreditCard className="h-5 w-5" />
                    Choose Your Plan
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Choose the subscription plan for this business
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="plan" className="text-sm font-medium text-gray-700">{getLabel("Plan")}</Label>
                      <Select onValueChange={(value) => form.setValue("plan", value as any)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic - ₹2,999/month</SelectItem>
                          <SelectItem value="premium">Premium - ₹4,999/month</SelectItem>
                          <SelectItem value="enterprise">Enterprise - ₹7,999/month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxUsers" className="text-sm font-medium text-gray-700">{getLabel("Max Users")}</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        min="1"
                        {...form.register("maxUsers", { valueAsNumber: true })}
                        className="mt-1"
                      />
                      {form.formState.errors.maxUsers && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.maxUsers.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxBranches" className="text-sm font-medium text-gray-700">{getLabel("Max Branches")}</Label>
                      <Input
                        id="maxBranches"
                        type="number"
                        min="1"
                        {...form.register("maxBranches", { valueAsNumber: true })}
                        className="mt-1"
                      />
                      {form.formState.errors.maxBranches && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.maxBranches.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                    <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Plan Features
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-800">
                      {getPlanFeatures(form.watch("plan") || "basic").map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0" />
                          <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4 pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-8 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300 px-8 py-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating Business...' : 'Creating Business...'}
                </>
              ) : (
                isEditMode ? 'Update Business' : 'Create Business'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
