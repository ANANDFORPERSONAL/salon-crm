"use client"

import { useState, useRef, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Camera, Save, Edit, X, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { SideNav } from "@/components/side-nav"
import { TopNav } from "@/components/top-nav"
import { useAuth } from "@/lib/auth-context"
import { UsersAPI } from "@/lib/api"

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
})

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [staffData, setStaffData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
    },
  })

  // Fetch staff data from database
  useEffect(() => {
    const fetchStaffData = async () => {
      if (!user?._id) return
      
      try {
        setIsLoading(true)
        const response = await UsersAPI.getById(user._id)
        if (response.success && response.data) {
          const staff = response.data
          setStaffData(staff)
          
          // Update form with fetched data
          form.reset({
            firstName: staff.firstName || "",
            lastName: staff.lastName || "",
            email: staff.email || "",
            mobile: staff.mobile || "",
          })
          
          // Set profile photo if available
          if (staff.avatar) {
            setProfilePhoto(staff.avatar)
          }
        }
      } catch (error) {
        console.error("Failed to fetch staff data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStaffData()
  }, [user?._id, form])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode)
    if (isEditMode) {
      // Cancel edit - reset form to original values
      if (staffData) {
        form.reset({
          firstName: staffData.firstName || "",
          lastName: staffData.lastName || "",
          email: staffData.email || "",
          mobile: staffData.mobile || "",
        })
        setProfilePhoto(staffData.avatar || null)
      }
    }
  }

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user?._id || !staffData) return

    setIsSubmitting(true)

    try {
      // Update staff data in database
      const updateData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        mobile: values.mobile,
        avatar: profilePhoto || staffData.avatar,
      }

      const response = await UsersAPI.update(user._id, updateData)
      
      if (response.success) {
        // Update local state
        setStaffData({ ...staffData, ...updateData })
        
        // Update auth context to sync with dropdown menu
        updateUser({
          name: `${values.firstName} ${values.lastName}`,
          email: values.email,
          avatar: profilePhoto || staffData.avatar
        })
        
        setIsEditMode(false)
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
      } else {
        throw new Error(response.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      default:
        return "secondary"
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <div className="flex flex-1">
          <SideNav />
          <main className="flex-1 p-6 md:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <SideNav />
        <main className="flex-1 p-6 md:p-8">
          <div className="flex flex-col space-y-6 max-w-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
              </div>
              <Button
                onClick={handleEditToggle}
                variant={isEditMode ? "outline" : "default"}
                className="flex items-center gap-2"
              >
                {isEditMode ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>

            {/* Profile Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={profilePhoto || staffData?.avatar || "/placeholder.svg"} 
                        alt={staffData?.name || "User"} 
                      />
                      <AvatarFallback className="text-lg">
                        {staffData?.firstName?.charAt(0) || staffData?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {isEditMode && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">
                      {staffData?.firstName} {staffData?.lastName}
                    </h2>
                    <p className="text-muted-foreground">{staffData?.email}</p>
                    <Badge variant={getRoleBadgeVariant(staffData?.role || "staff")}>
                      {staffData?.role ? staffData.role.charAt(0).toUpperCase() + staffData.role.slice(1) : "Staff"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your first name" 
                                {...field} 
                                disabled={!isEditMode}
                                className={!isEditMode ? "bg-gray-50" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your last name" 
                                {...field} 
                                disabled={!isEditMode}
                                className={!isEditMode ? "bg-gray-50" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                {...field} 
                                disabled={!isEditMode}
                                className={!isEditMode ? "bg-gray-50" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="Enter your mobile number" 
                                {...field} 
                                disabled={!isEditMode}
                                className={!isEditMode ? "bg-gray-50" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditMode && (
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleEditToggle}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          <Save className="mr-2 h-4 w-4" />
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
