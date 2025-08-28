"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { StaffAPI } from "@/lib/api"
import { useCurrency } from "@/hooks/use-currency"

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  role: z.enum(["admin", "manager", "staff"], {
    required_error: "Please select a role",
  }),
  specialties: z.array(z.string()).min(1, "Please select at least one specialty"),
  hourlyRate: z.string().min(1, "Please enter hourly rate"),
  commissionRate: z.string().min(1, "Please enter commission rate"),
  notes: z.string().optional(),
})

const specialtyOptions = [
  "Haircut",
  "Hair Color",
  "Hair Styling",
  "Manicure",
  "Pedicure",
  "Facial",
  "Massage",
  "Eyebrow Threading",
  "Makeup",
  "Hair Extensions",
]

export function StaffForm() {
  const { getSymbol } = useCurrency()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "staff",
      specialties: [],
      hourlyRate: "",
      commissionRate: "",
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof staffSchema>) {
    setIsSubmitting(true)

    try {
      const staffData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        specialties: values.specialties,
        hourlyRate: parseFloat(values.hourlyRate),
        commissionRate: parseFloat(values.commissionRate),
        notes: values.notes,
        isActive: true
      }

      console.log("Submitting staff data:", staffData)
      const response = await StaffAPI.create(staffData)
      console.log("Staff API response:", response)

      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member has been added successfully.",
        })
        router.push("/settings")
      } else {
        throw new Error(response.error || "Failed to create staff member")
      }
    } catch (error) {
      console.error("Error creating staff member:", error)
      toast({
        title: "Error",
        description: "Failed to create staff member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
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
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
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
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly Rate ({getSymbol()}) *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commissionRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission Rate (%) *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="specialties"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Specialties *</FormLabel>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specialtyOptions.map((specialty) => (
                  <FormField
                    key={specialty}
                    control={form.control}
                    name="specialties"
                    render={({ field }) => {
                      return (
                        <FormItem key={specialty} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(specialty)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, specialty])
                                  : field.onChange(field.value?.filter((value) => value !== specialty))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">{specialty}</FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information about the staff member..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Adding..." : "Add Staff Member"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
