"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Check, Plus, Trash2, Search, User, Phone, Mail, X } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { clientStore, type Client } from "@/lib/client-store"
import { ServicesAPI, StaffAPI, AppointmentsAPI, UsersAPI } from "@/lib/api"

// Time slots for appointments
const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
]

const formSchema = z.object({
  date: z.date({
    required_error: "Please select a date.",
  }),
  time: z.string({
    required_error: "Please select a time.",
  }),
  notes: z.string().optional(),
})

interface SelectedService {
  id: string
  serviceId: string
  staffId: string
  name: string
  duration: number
  price: number
}

export function AppointmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  
  // Client search state
  const [customerSearch, setCustomerSearch] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  
  // Services and staff state
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)
  
  // New client dialog
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  })

  // Load services and staff on component mount
  useEffect(() => {
    fetchServices()
    fetchStaff()
    fetchClients()
  }, [])

  // Subscribe to client store changes
  useEffect(() => {
    const unsubscribe = clientStore.subscribe(() => {
      const updatedClients = clientStore.getClients()
      setClients(updatedClients || [])
    })

    return unsubscribe
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchServices = async () => {
    try {
      setLoadingServices(true)
      const response = await ServicesAPI.getAll()
      if (response.success) {
        setServices(response.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoadingServices(false)
    }
  }

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true)
      // Align with Quick Sale behavior: use Users API and filter enabled staff
      const response = await UsersAPI.getAll()
      if (response.success) {
        const staffMembers = (response.data || []).filter((user: any) => {
          const hasValidId = user._id || user.id
          const isEnabled = user.role === 'staff' && user.isActive === true && user.allowAppointmentScheduling === true
          return hasValidId && isEnabled
        })
        setStaff(staffMembers)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  const fetchClients = async () => {
    try {
      await clientStore.loadClients()
      const allClients = clientStore.getClients()
      setClients(allClients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  // Filter customers based on search
  const filteredCustomers = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      client.phone.includes(customerSearch) ||
      (client.email && client.email.toLowerCase().includes(customerSearch.toLowerCase())),
  )

  console.log('Filtered customers:', filteredCustomers)
  console.log('Customer search:', customerSearch)
  console.log('All clients:', clients)

  // Handle customer selection
  const handleCustomerSelect = (customer: Client) => {
    console.log('Customer selected:', customer)
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)
  }

  // Handle customer search input
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value)
    setShowCustomerDropdown(true)

    // If search doesn't match selected customer, clear selection
    if (selectedCustomer && !selectedCustomer.name.toLowerCase().includes(value.toLowerCase())) {
      setSelectedCustomer(null)
    }
  }

  // Handle creating new customer
  const handleCreateNewCustomer = () => {
    console.log('Creating new customer for:', customerSearch)
    setNewClient({
      firstName: "",
      lastName: "",
      phone: customerSearch,
      email: "",
    })
    setShowNewClientDialog(true)
    setShowCustomerDropdown(false)
  }

  // Handle saving new customer
  const handleSaveNewCustomer = async () => {
    if (!newClient.firstName || !newClient.lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide both first and last name.",
        variant: "destructive",
      })
      return
    }

    try {
             const newClientData = {
         id: `new-${Date.now()}`,
         name: `${newClient.firstName} ${newClient.lastName}`,
         phone: newClient.phone || customerSearch,
         email: newClient.email,
         status: "active" as const,
       }

      const success = await clientStore.addClient(newClientData)
      
      if (success) {
        // Refresh clients list
        await fetchClients()
        
        // Find the newly created client
        const allClients = clientStore.getClients()
        const createdClient = allClients.find(c => 
          c.name === newClientData.name && c.phone === newClientData.phone
        )
        
        if (createdClient) {
          setSelectedCustomer(createdClient)
          setCustomerSearch(createdClient.name)
        }

        setNewClient({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
        })
        setShowNewClientDialog(false)

        toast({
          title: "Client Created",
          description: "New client has been successfully created.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create client. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add a service to the appointment
  const addService = () => {
    const newService: SelectedService = {
      id: Date.now().toString(),
      serviceId: "",
      staffId: "",
      name: "",
      duration: 0,
      price: 0,
    }
    setSelectedServices([...selectedServices, newService])
  }

  // Remove a service from the appointment
  const removeService = (id: string) => {
    setSelectedServices(selectedServices.filter(service => service.id !== id))
  }

  // Update a service
  const updateService = (id: string, field: keyof SelectedService, value: any) => {
    setSelectedServices(selectedServices => 
      selectedServices.map(service => {
        if (service.id === id) {
          const updatedService = { ...service, [field]: value }
          
          // Auto-fill service details when service is selected
          if (field === "serviceId" && value) {
            const selectedService = services.find(s => s._id === value || s.id === value)
            if (selectedService) {
              updatedService.name = selectedService.name
              updatedService.duration = selectedService.duration
              updatedService.price = selectedService.price
            }
          }
          
          return updatedService
        }
        return service
      })
    )
  }

  // Calculate total duration
  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0)
  }

  // Calculate total amount
  const calculateTotalAmount = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a client.",
        variant: "destructive",
      })
      return
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one service.",
        variant: "destructive",
      })
      return
    }

    // Validate that all services have staff assigned
    const unassignedServices = selectedServices.filter(service => !service.staffId)
    if (unassignedServices.length > 0) {
      toast({
        title: "Error",
        description: "Please assign staff to all services.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare appointment data
      const appointmentData = {
        clientId: selectedCustomer._id || selectedCustomer.id,
        clientName: selectedCustomer.name,
        date: format(values.date, "yyyy-MM-dd"),
        time: values.time,
        services: selectedServices.map(service => ({
          serviceId: service.serviceId,
          staffId: service.staffId,
          name: service.name,
          duration: service.duration,
          price: service.price,
        })),
        totalDuration: calculateTotalDuration(),
        totalAmount: calculateTotalAmount(),
        notes: values.notes,
        status: "scheduled",
      }

      // Create appointment
      const response = await AppointmentsAPI.create(appointmentData)
      
      if (response.success) {
        toast({
          title: "Appointment Created",
          description: "New appointment has been successfully scheduled.",
        })
        router.push("/appointments")
      } else {
        toast({
          title: "Error",
          description: "Failed to create appointment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Appointment</CardTitle>
        <CardDescription>Schedule a new appointment with multiple services</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="appointmentForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Client Selection */}
            <div className="space-y-4">
              <Label>Client *</Label>
              <div className="relative customer-search-container">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="pl-10"
                />

                {showCustomerDropdown && customerSearch && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer._id || customer.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Customer clicked:', customer)
                            handleCustomerSelect(customer)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">📞 {customer.phone}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className="p-3 hover:bg-muted cursor-pointer flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Create new customer clicked')
                          handleCreateNewCustomer()
                        }}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Create new customer: "{customerSearch}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Customer Details */}
              {selectedCustomer && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{selectedCustomer.name}</span>
                      <Badge variant={selectedCustomer.status === "active" ? "default" : "secondary"}>
                        {selectedCustomer.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedCustomer.phone}
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedCustomer.email}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Services Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Services *</Label>
                <Button type="button" onClick={addService} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>

              {selectedServices.length > 0 ? (
                <div className="space-y-3">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Service {selectedServices.indexOf(service) + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Service</Label>
                          <Select
                            value={service.serviceId}
                            onValueChange={(value) => updateService(service.id, "serviceId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingServices ? (
                                <SelectItem value="__loading__" disabled>
                                  Loading services...
                                </SelectItem>
                              ) : services.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                  No services available
                                </SelectItem>
                              ) : (
                                services.map((s) => (
                                  <SelectItem key={s._id || s.id} value={s._id || s.id}>
                                    {s.name} - ₹{s.price}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Staff Member</Label>
                          <Select
                            value={service.staffId}
                            onValueChange={(value) => updateService(service.id, "staffId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff" />
                            </SelectTrigger>
                          <SelectContent>
                             {loadingStaff ? (
                              <SelectItem value="__loading__" disabled>
                                Loading staff...
                              </SelectItem>
                            ) : staff.length === 0 ? (
                              <SelectItem value="no-staff" disabled>
                                No active staff available
                              </SelectItem>
                            ) : (
                              staff
                                .filter((member) => (member._id || member.id))
                                .map((member) => {
                                  const staffId = member._id || member.id
                                  return (
                                    <SelectItem key={staffId} value={staffId}>
                                      {member.name} {member.role ? `(${member.role})` : ''}
                                    </SelectItem>
                                  )
                                })
                            )}
                          </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {service.name && (
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{service.duration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Price:</span>
                            <span>₹{service.price}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border rounded-md text-muted-foreground">
                  No services added yet. Please add at least one service.
                </div>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes about the appointment"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Include any special requests or important information.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            {selectedServices.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Appointment Summary</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Services:</span>
                    <span>{selectedServices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span>{calculateTotalDuration()} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>₹{calculateTotalAmount()}</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" type="button" onClick={() => router.push("/appointments")}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          form="appointmentForm" 
          disabled={isSubmitting || selectedServices.length === 0 || !selectedCustomer}
        >
          {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
        </Button>
      </CardFooter>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>Add a new client to your salon database.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewCustomer}>
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
