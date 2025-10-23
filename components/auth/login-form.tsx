"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Eye, EyeOff, Scissors } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { AccountSuspended } from "@/components/auth/account-suspended"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  businessCode: z.string().optional()
})


export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("admin")
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionMessage, setSuspensionMessage] = useState("")
  const { login, staffLogin } = useAuth()
  const router = useRouter()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      businessCode: ""
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true)
    setIsSuspended(false) // Reset suspension state

    try {
      let result: any = false

      if (activeTab === "staff") {
        if (!values.businessCode) {
          toast({
            title: "Business Code Required",
            description: "Please enter your business code for staff login.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        result = await staffLogin(values.email, values.password, values.businessCode)
      } else {
        result = await login(values.email, values.password)
      }

      // Handle different result types
      if (typeof result === 'boolean') {
        // Staff login returns boolean
        if (result) {
          toast({
            title: "Login successful",
            description: "Welcome back to Salon CRM!",
          })
          router.push("/")
        } else {
          toast({
            title: "Login failed",
            description: "Invalid credentials. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // Admin login returns object with success, error, message
        if (result.success) {
          toast({
            title: "Login successful",
            description: "Welcome back to Salon CRM!",
          })
          router.push("/")
        } else if (result.error === 'ACCOUNT_SUSPENDED') {
          setIsSuspended(true)
          setSuspensionMessage(result.message || "Your account has been suspended. Please contact your host for assistance.")
        } else {
          toast({
            title: "Login failed",
            description: result.message || "Invalid credentials. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  // Show suspension message if account is suspended
  if (isSuspended) {
    return (
      <AccountSuspended 
        message={suspensionMessage}
        onBackToLogin={() => {
          setIsSuspended(false)
          setSuspensionMessage("")
        }}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Scissors className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Salon CRM</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your credentials to access the salon management system</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the salon management system</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>
              
              <TabsContent value="admin" className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Signing in..." : "Sign in as Admin"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="staff" className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your business code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Signing in..." : "Sign in as Staff"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => router.push("/forgot-password")}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Forgot your password?
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
