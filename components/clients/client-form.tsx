"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { clientStore, type Client } from "@/lib/client-store"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface ClientFormProps {
  client?: Client
  isEditMode?: boolean
  onEditComplete?: () => void
}

export function ClientForm({ client, isEditMode = false, onEditComplete }: ClientFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Parse client name into first and last name
  const parseClientName = (name: string) => {
    const parts = name.split(' ')
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    }
  }

  // Define schema inside component to access client prop
  const formSchema = z.object({
    firstName: z.string().min(2, {
      message: "First name must be at least 2 characters.",
    }),
    lastName: z.string().min(2, {
      message: "Last name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }).optional().or(z.literal("")),
    phone: z.string().min(10, {
      message: "Phone number must be at least 10 digits.",
    }).refine((phone) => {
      // Get all clients from the store
      const allClients = clientStore.getClients()
      // Check if phone number already exists (excluding current client when editing)
      const existingClient = allClients.find(c => 
        c.phone === phone && 
        c.id !== client?.id && 
        c._id !== client?._id
      )
      return !existingClient
    }, {
      message: "Phone number already exists. Please use a different number.",
    }),
    address: z.string().optional(),
    notes: z.string().optional(),
    gender: z.enum(["male", "female", "other"], {
      required_error: "Please select a gender.",
    }),
    birthdate: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      gender: "female" as const,
      birthdate: "",
    },
  })

  // Set form values when client data is available
  useEffect(() => {
    if (client) {
      const { firstName, lastName } = parseClientName(client.name)
      form.reset({
        firstName,
        lastName,
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        notes: client.notes || "",
        gender: (client.gender as "male" | "female" | "other") || "female",
        birthdate: client.birthdate || "",
      })
    }
  }, [client, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const clientData = {
        id: client?.id || '',
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        phone: values.phone,
        address: values.address,
        notes: values.notes,
        gender: values.gender,
        birthdate: values.birthdate,
        status: "active" as const,
        totalVisits: client?.totalVisits || 0,
        totalSpent: client?.totalSpent || 0,
        createdAt: client?.createdAt || new Date().toISOString(),
      }

      let success = false

      if (client) {
        // Update existing client
        const clientId = client._id || client.id
        success = await clientStore.updateClient(clientId, clientData)
        if (success) {
          toast({
            title: "Client updated",
            description: "Client has been successfully updated.",
          })
          onEditComplete?.()
        }
      } else {
        // Create new client
        success = await clientStore.addClient(clientData)
        if (success) {
          toast({
            title: "Client created",
            description: "New client has been successfully created.",
          })
          router.push("/clients")
        }
      }

      if (!success) {
        toast({
          title: "Error",
          description: `Failed to ${client ? 'update' : 'create'} client. Please try again.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${client ? 'updating' : 'creating'} client:`, error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isViewMode = client && !isEditMode

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter first name" 
                        {...field} 
                        disabled={isViewMode}
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
                        placeholder="Enter last name" 
                        {...field} 
                        disabled={isViewMode}
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
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter email address" 
                        {...field} 
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter phone number" 
                        {...field} 
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                        disabled={isViewMode}
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="female" />
                          </FormControl>
                          <FormLabel className="font-normal">Female</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">Male</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="other" />
                          </FormControl>
                          <FormLabel className="font-normal">Other</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter address" 
                      {...field} 
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes about the client"
                      className="resize-none"
                      {...field}
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormDescription>
                    Include any relevant information about client preferences, allergies, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isViewMode && (
              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => router.push("/clients")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : client ? "Update Client" : "Save Client"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
