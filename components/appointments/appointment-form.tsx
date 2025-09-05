"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Check, Plus, Trash2, Search, User, Phone, Mail, X, CalendarDays, FileText, TrendingUp, Loader2, Calendar as CalendarIcon } from "lucide-react"
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
          const isEnabled = (user.role === 'staff' || user.role === 'manager' || user.role === 'admin') && user.isActive === true && user.allowAppointmentScheduling === true
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">New Appointment</CardTitle>
                <CardDescription className="text-indigo-100 mt-1">Schedule a new appointment with multiple services</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
        <Form {...form}>
          <form id="appointmentForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            
            {/* Client Selection */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client *
                </Label>
                <p className="text-sm text-slate-500">Search and select a client for the appointment</p>
              </div>
              <div className="relative customer-search-container">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="pl-12 h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                />

                {showCustomerDropdown && customerSearch && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer._id || customer.id}
                          className="p-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Customer clicked:', customer)
                            handleCustomerSelect(customer)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <User className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{customer.name}</div>
                              <div className="text-sm text-slate-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className="p-4 hover:bg-indigo-50 cursor-pointer flex items-center gap-3 transition-colors"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Create new customer clicked')
                          handleCreateNewCustomer()
                        }}
                      >
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="font-medium text-slate-700">Create new customer: "{customerSearch}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Customer Details */}
              {selectedCustomer && (
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-lg">{selectedCustomer.name}</span>
                        <Badge 
                          variant={selectedCustomer.status === "active" ? "default" : "secondary"}
                          className="ml-2 bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          {selectedCustomer.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium">{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium">{selectedCustomer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-slate-600" />
                  Schedule Details
                </h3>
                <p className="text-sm text-slate-500">Select the date and time for the appointment</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 pb-8">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel className="text-sm font-semibold text-slate-700">Date *</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 px-4 justify-start text-left font-normal border-slate-200 hover:border-slate-400 hover:bg-slate-50 focus:border-slate-500 focus:ring-slate-500 rounded-xl font-medium text-slate-700 bg-white shadow-sm transition-all duration-200",
                              !field.value && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 text-slate-500" />
                            {field.value ? (
                              <span className="font-medium">{format(field.value, "PPP")}</span>
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50" align="start">
                          <div className="p-4 bg-white rounded-xl shadow-xl border border-slate-200">
                            <style dangerouslySetInnerHTML={{
                              __html: `
                                .rdp {
                                  margin: 0;
                                }
                                .rdp-day {
                                  width: 2rem;
                                  height: 2rem;
                                  border-radius: 0.375rem;
                                  transition: all 0.2s ease;
                                  cursor: pointer;
                                  color: #374151;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                }
                                .rdp-day_selected {
                                  background-color: #2563eb !important;
                                  color: white !important;
                                  font-weight: bold !important;
                                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                                  border: 2px solid #1d4ed8 !important;
                                }
                                .rdp-day_today {
                                  background-color: #f1f5f9 !important;
                                  color: #1e293b !important;
                                  font-weight: 600 !important;
                                }
                                .rdp-day:hover {
                                  background-color: #f1f5f9 !important;
                                  color: #1e293b !important;
                                  font-weight: 500 !important;
                                }
                                .rdp-head_cell {
                                  color: #6b7280 !important;
                                }
                                .rdp-caption_label {
                                  color: #1f2937 !important;
                                }
                                .rdp-nav_button {
                                  color: #6b7280 !important;
                                }
                              `
                            }} />
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date: Date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel className="text-sm font-semibold text-slate-700">Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 px-4 border-slate-200 hover:border-slate-400 focus:border-slate-500 focus:ring-slate-500 rounded-xl font-medium text-slate-700 bg-white shadow-sm transition-all duration-200">
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
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
            </div>

            {/* Services Section */}
            <div className="space-y-6 mt-12">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-600" />
                    Services *
                  </h3>
                  <Button type="button" onClick={addService} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-4 py-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
                <p className="text-sm text-slate-500">Add services and assign staff members for this appointment</p>
              </div>

              {selectedServices.length > 0 ? (
                <div className="space-y-4">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <FileText className="h-4 w-4 text-slate-600" />
                          </div>
                          <h4 className="font-semibold text-slate-800">Service {selectedServices.indexOf(service) + 1}</h4>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">Service</Label>
                          <Select
                            value={service.serviceId}
                            onValueChange={(value) => updateService(service.id, "serviceId", value)}
                          >
                            <SelectTrigger className="border-slate-200 hover:border-indigo-500 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
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
                          <Label className="text-sm font-semibold text-slate-700">Staff Member</Label>
                          <Select
                            value={service.staffId}
                            onValueChange={(value) => updateService(service.id, "staffId", value)}
                          >
                            <SelectTrigger className="border-slate-200 hover:border-indigo-500 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
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
                                      {member.name}
                                    </SelectItem>
                                  )
                                })
                            )}
                          </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {service.name && (
                        <div className="bg-white/60 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Duration:</span>
                            <span className="text-sm font-semibold text-slate-800">{service.duration} minutes</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Price:</span>
                            <span className="text-sm font-semibold text-green-600">₹{service.price}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No services added yet</p>
                  <p className="text-sm text-slate-400 mt-1">Please add at least one service to continue</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Additional Notes
                </h3>
                <p className="text-sm text-slate-500">Add any special requests or important information</p>
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes about the appointment"
                        className="resize-none h-24 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">Include any special requests or important information.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Summary */}
            {selectedServices.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-slate-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800">Appointment Summary</h4>
                </div>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                    <span className="text-slate-600 font-medium">Total Services:</span>
                    <span className="text-slate-800 font-semibold">{selectedServices.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                    <span className="text-slate-600 font-medium">Total Duration:</span>
                    <span className="text-slate-800 font-semibold">{calculateTotalDuration()} minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600 font-medium">Total Amount:</span>
                    <span className="text-green-600 font-bold text-lg">₹{calculateTotalAmount()}</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
          </CardContent>
          <CardFooter className="bg-slate-50/50 px-8 py-8 border-t border-slate-200/50">
            <div className="flex justify-end gap-4 w-full">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.push("/appointments")}
                className="px-8 py-3 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium min-w-[120px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="appointmentForm" 
                disabled={isSubmitting || selectedServices.length === 0 || !selectedCustomer}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

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
    </div>
  )
}
