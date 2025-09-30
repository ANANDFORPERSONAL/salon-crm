"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Building2, User, CreditCard, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const businessSchema = z.object({
  // Business Information
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum(["salon", "spa", "barbershop", "beauty_clinic"]),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  country: z.string().default("India"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().optional(),
  
  // Owner Information
  ownerFirstName: z.string().min(2, "First name is required"),
  ownerLastName: z.string().min(2, "Last name is required"),
  ownerEmail: z.string().email("Valid email is required"),
  ownerPhone: z.string().min(10, "Phone number is required"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
  
  // Subscription Information
  plan: z.enum(["basic", "premium", "enterprise"]),
  maxUsers: z.number().min(1, "At least 1 user required"),
  maxBranches: z.number().min(1, "At least 1 branch required"),
  
  // Business Settings
  timezone: z.string().default("Asia/Kolkata"),
  currency: z.string().default("INR"),
  taxRate: z.number().min(0).max(100).default(18),
  gstNumber: z.string().optional(),
})

type BusinessFormData = z.infer<typeof businessSchema>

export function CreateBusinessForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessType: "salon",
      country: "India",
      plan: "basic",
      maxUsers: 5,
      maxBranches: 1,
      timezone: "Asia/Kolkata",
      currency: "INR",
      taxRate: 18,
    },
  })

  const onSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true)
    
    try {
      const businessData = {
        businessInfo: {
          name: data.businessName,
          businessType: data.businessType,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country
          },
          contact: {
            phone: data.phone,
            email: data.email,
            website: data.website
          },
          settings: {
            timezone: data.timezone,
            currency: data.currency,
            taxRate: data.taxRate,
            gstNumber: data.gstNumber,
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
          firstName: data.ownerFirstName,
          lastName: data.ownerLastName,
          email: data.ownerEmail,
          phone: data.ownerPhone,
          password: data.ownerPassword
        },
        subscriptionInfo: {
          plan: data.plan,
          maxUsers: data.maxUsers,
          maxBranches: data.maxBranches,
          features: getPlanFeatures(data.plan)
        }
      }

      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-auth-token')}`
        },
        body: JSON.stringify(businessData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Business Created Successfully",
          description: `Business "${data.businessName}" has been created with owner access.`,
        })
        router.push('/admin/businesses')
      } else {
        toast({
          title: "Creation Failed",
          description: result.error || "Failed to create business",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create business error:", error)
      toast({
        title: "Creation Failed",
        description: "An error occurred while creating the business",
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Business</h1>
          <p className="text-gray-600">Set up a new salon business account</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="business" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="business" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Business Info</span>
            </TabsTrigger>
            <TabsTrigger value="owner" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Owner Details</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Subscription</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Enter the basic information about the salon business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="e.g., Glamour Salon & Spa"
                      {...form.register("businessName")}
                    />
                    {form.formState.errors.businessName && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.businessName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select onValueChange={(value) => form.setValue("businessType", value as any)}>
                      <SelectTrigger>
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

                <div className="space-y-4">
                  <h4 className="font-medium">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        placeholder="123 Beauty Street"
                        {...form.register("street")}
                      />
                      {form.formState.errors.street && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.street.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        {...form.register("city")}
                      />
                      {form.formState.errors.city && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.city.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="Maharashtra"
                        {...form.register("state")}
                      />
                      {form.formState.errors.state && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.state.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        placeholder="400001"
                        {...form.register("zipCode")}
                      />
                      {form.formState.errors.zipCode && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.zipCode.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value="India"
                        disabled
                        {...form.register("country")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        {...form.register("phone")}
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="info@glamoursalon.com"
                        {...form.register("email")}
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        placeholder="https://www.glamoursalon.com"
                        {...form.register("website")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Business Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select onValueChange={(value) => form.setValue("timezone", value)}>
                        <SelectTrigger>
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
                      <Label htmlFor="currency">Currency</Label>
                      <Select onValueChange={(value) => form.setValue("currency", value)}>
                        <SelectTrigger>
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
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        {...form.register("taxRate", { valueAsNumber: true })}
                      />
                      {form.formState.errors.taxRate && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.taxRate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                    <Input
                      id="gstNumber"
                      placeholder="12ABCDE1234F1Z5"
                      {...form.register("gstNumber")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
                <CardDescription>
                  Set up the business owner account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFirstName">First Name *</Label>
                    <Input
                      id="ownerFirstName"
                      placeholder="John"
                      {...form.register("ownerFirstName")}
                    />
                    {form.formState.errors.ownerFirstName && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.ownerFirstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerLastName">Last Name *</Label>
                    <Input
                      id="ownerLastName"
                      placeholder="Doe"
                      {...form.register("ownerLastName")}
                    />
                    {form.formState.errors.ownerLastName && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.ownerLastName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Email Address *</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="john@glamoursalon.com"
                      {...form.register("ownerEmail")}
                    />
                    {form.formState.errors.ownerEmail && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.ownerEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">Phone Number *</Label>
                    <Input
                      id="ownerPhone"
                      placeholder="+91 98765 43210"
                      {...form.register("ownerPhone")}
                    />
                    {form.formState.errors.ownerPhone && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.ownerPhone.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="ownerPassword">Password *</Label>
                    <Input
                      id="ownerPassword"
                      type="password"
                      placeholder="Enter a strong password"
                      {...form.register("ownerPassword")}
                    />
                    {form.formState.errors.ownerPassword && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.ownerPassword.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      This will be the login password for the business owner
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>
                  Choose the subscription plan for this business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan *</Label>
                    <Select onValueChange={(value) => form.setValue("plan", value as any)}>
                      <SelectTrigger>
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
                    <Label htmlFor="maxUsers">Max Users *</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      min="1"
                      {...form.register("maxUsers", { valueAsNumber: true })}
                    />
                    {form.formState.errors.maxUsers && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.maxUsers.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxBranches">Max Branches *</Label>
                    <Input
                      id="maxBranches"
                      type="number"
                      min="1"
                      {...form.register("maxBranches", { valueAsNumber: true })}
                    />
                    {form.formState.errors.maxBranches && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.maxBranches.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Plan Features</h4>
                  <div className="text-sm text-blue-800">
                    {getPlanFeatures(form.watch("plan")).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        <span>{feature.replace(/_/g, ' ').toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Business...
              </>
            ) : (
              "Create Business"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
