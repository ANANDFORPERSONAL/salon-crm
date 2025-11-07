"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Send, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"

const grievanceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  category: z.enum(["data-access", "data-correction", "data-deletion", "consent-withdrawal", "data-breach", "other"], {
    required_error: "Please select a grievance category",
  }),
  subject: z.string().min(10, "Subject must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
})

type GrievanceFormData = z.infer<typeof grievanceSchema>

export function GrievanceForm() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      category: undefined,
      subject: "",
      description: "",
    },
  })

  const onSubmit = async (data: GrievanceFormData) => {
    setIsSubmitting(true)
    try {
      // In a real implementation, this would send to your backend API
      // For now, we'll simulate the submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Log grievance (in production, this would be stored in database)
      console.log("Grievance submitted:", {
        ...data,
        userId: user?._id,
        submittedAt: new Date().toISOString(),
      })

      toast({
        title: "Grievance Submitted",
        description: "Your grievance has been received. We will respond within 30 days as per DPDP Act requirements.",
      })

      setIsSubmitted(true)
      form.reset()
    } catch (error) {
      console.error("Error submitting grievance:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit your grievance. Please try again or contact us directly.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Grievance Submitted Successfully</h2>
                  <p className="text-gray-600">
                    Your grievance has been received and assigned a reference number. We will respond within 30 days 
                    as required under the Digital Personal Data Protection Act, 2023.
                  </p>
                </div>
                <div className="pt-4">
                  <Button onClick={() => setIsSubmitted(false)} variant="outline">
                    Submit Another Grievance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Grievance Redressal</h1>
              <p className="text-gray-600 mt-1">Submit a grievance regarding your personal data processing</p>
            </div>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>DPDP Act Compliance</AlertTitle>
          <AlertDescription>
            Under the Digital Personal Data Protection Act, 2023 (DPDP Act), you have the right to file a grievance 
            regarding the processing of your personal data. We will respond to your grievance within 30 days.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Submit Your Grievance</CardTitle>
            <CardDescription>
              Please provide details about your grievance. All fields are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
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
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormDescription>
                        We may contact you via phone to resolve your grievance faster
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grievance Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="data-access">Right to Access Personal Data</SelectItem>
                          <SelectItem value="data-correction">Right to Correction</SelectItem>
                          <SelectItem value="data-deletion">Right to Erasure/Deletion</SelectItem>
                          <SelectItem value="consent-withdrawal">Withdrawal of Consent</SelectItem>
                          <SelectItem value="data-breach">Data Breach Concern</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief summary of your grievance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed information about your grievance..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Please include all relevant details, dates, and any supporting information
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t">
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Grievance
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-sm text-gray-700">Grievance Officer</p>
              <p className="text-sm text-gray-600">Email: grievance@saloncrm.com</p>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-700">Data Protection Officer</p>
              <p className="text-sm text-gray-600">Email: privacy@saloncrm.com</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Response Time: We will respond to your grievance within 30 days as required under Section 12 of the DPDP Act, 2023.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

