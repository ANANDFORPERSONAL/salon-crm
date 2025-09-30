"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { StaffAPI, CommissionProfileAPI } from "@/lib/api"
import { useCurrency } from "@/hooks/use-currency"

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  role: z.enum(["admin", "manager", "staff"], {
    required_error: "Please select a role",
  }),
  specialties: z.array(z.string()).optional(),
  salary: z.string().min(1, "Please enter salary"),
  commissionProfileIds: z.array(z.string()).optional(),
  hasLoginAccess: z.boolean().optional(),
  allowAppointmentScheduling: z.boolean().optional(),
  password: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If login access is enabled, password is required
  if (data.hasLoginAccess && (!data.password || data.password.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Password is required when login access is enabled",
  path: ["password"],
}).refine((data) => {
  // If appointment scheduling is enabled, specialties are required
  if (data.allowAppointmentScheduling && (!data.specialties || data.specialties.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one specialty when appointment scheduling is enabled",
  path: ["specialties"],
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

interface StaffFormProps {
  staff?: any
  onSuccess?: () => void
}

export function StaffForm({ staff, onSuccess }: StaffFormProps) {
  const { getSymbol } = useCurrency()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commissionProfiles, setCommissionProfiles] = useState<any[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [commissionDropdownOpen, setCommissionDropdownOpen] = useState(false)

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: staff?.name || "",
      email: staff?.email || "",
      phone: staff?.phone || "",
      role: staff?.role || "staff",
      specialties: staff?.specialties || [],
      salary: staff?.salary?.toString() || "",
      commissionProfileIds: staff?.commissionProfileIds || [],
      hasLoginAccess: staff?.hasLoginAccess || false,
      allowAppointmentScheduling: staff?.allowAppointmentScheduling || false,
      password: "",
      notes: staff?.notes || "",
    },
  })

  // Fetch commission profiles
  useEffect(() => {
    const fetchCommissionProfiles = async () => {
      try {
        setLoadingProfiles(true)
        const response = await CommissionProfileAPI.getProfiles()
        if (response.success) {
          setCommissionProfiles(response.data)
        }
      } catch (error) {
        console.error('Error fetching commission profiles:', error)
        toast({
          title: "Error",
          description: "Failed to load commission profiles",
          variant: "destructive",
        })
      } finally {
        setLoadingProfiles(false)
      }
    }

    fetchCommissionProfiles()
  }, [toast])

  async function onSubmit(values: z.infer<typeof staffSchema>) {
    setIsSubmitting(true)

    try {
      const staffData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        specialties: values.specialties || [],
        salary: parseFloat(values.salary),
        commissionProfileIds: values.commissionProfileIds || [],
        hasLoginAccess: values.hasLoginAccess || false,
        allowAppointmentScheduling: values.allowAppointmentScheduling || false,
        password: values.password || undefined,
        notes: values.notes,
        isActive: staff?.isActive ?? true
      }

      console.log("Submitting staff data:", staffData)
      
      let response
      if (staff) {
        // Update existing staff
        response = await StaffAPI.update(staff._id, staffData)
        console.log("Staff API update response:", response)
      } else {
        // Create new staff
        response = await StaffAPI.create(staffData)
        console.log("Staff API create response:", response)
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `Staff member has been ${staff ? 'updated' : 'added'} successfully.`,
        })
        
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/settings")
        }
      } else {
        throw new Error(response.error || `Failed to ${staff ? 'update' : 'create'} staff member`)
      }
    } catch (error) {
      console.error(`Error ${staff ? 'updating' : 'creating'} staff member:`, error)
      toast({
        title: "Error",
        description: `Failed to ${staff ? 'update' : 'create'} staff member. Please try again.`,
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
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary ({getSymbol()}) *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commissionProfileIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission Profiles</FormLabel>
                <FormControl>
                  <Popover open={commissionDropdownOpen} onOpenChange={setCommissionDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={commissionDropdownOpen}
                        className="w-full justify-between"
                        disabled={loadingProfiles}
                      >
                        {loadingProfiles ? (
                          "Loading commission profiles..."
                        ) : field.value && field.value.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {field.value.map((profileId) => {
                              const profile = commissionProfiles.find(p => p.id === profileId)
                              return profile ? (
                                <Badge key={profileId} variant="secondary" className="text-xs">
                                  {profile.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        ) : (
                          "Select commission profiles..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search commission profiles..." />
                        <CommandEmpty>No commission profiles found.</CommandEmpty>
                        <CommandGroup>
                          {commissionProfiles.map((profile) => (
                            <CommandItem
                              key={profile.id}
                              value={profile.name}
                              onSelect={() => {
                                const currentValues = field.value || []
                                const isSelected = currentValues.includes(profile.id)
                                
                                if (isSelected) {
                                  field.onChange(currentValues.filter(id => id !== profile.id))
                                } else {
                                  field.onChange([...currentValues, profile.id])
                                }
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  field.value?.includes(profile.id) ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex items-center gap-2">
                                <span>{profile.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {profile.type === 'target_based' ? 'Target Based' : 'Item Based'}
                                </Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Permissions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Permissions</h3>
          
          <FormField
            control={form.control}
            name="hasLoginAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Provide login access to this staff
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Allow this staff member to log into the system
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={staff?.isOwner}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Password field - only show when login access is enabled */}
          {form.watch("hasLoginAccess") && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password for login access"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="allowAppointmentScheduling"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Allow appointment scheduling for this staff
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Allow this staff member to schedule and manage appointments
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={staff?.isOwner}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Specialties - only show when appointment scheduling is enabled */}
        {form.watch("allowAppointmentScheduling") && (
          <FormField
            control={form.control}
            name="specialties"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Specialties *</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Select the services this staff member can provide
                  </div>
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
        )}

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
            {isSubmitting 
              ? (staff ? "Updating..." : "Adding...") 
              : (staff ? "Update Staff Details" : "Add Staff Member")
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
