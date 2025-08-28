"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Check, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clientStore } from "@/lib/client-store"
import { services, products, staff } from "@/lib/data"
import { QuickSale } from "./quick-sale"

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
  clientId: z.string({
    required_error: "Please select a client.",
  }),
  staffId: z.string({
    required_error: "Please select a staff member.",
  }),
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
  name: string
  duration: number
  price: number
}

interface SelectedProduct {
  id: string
  name: string
  price: number
  quantity: number
}

export function AppointmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [phoneSearch, setPhoneSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  })

  // Set initial tab based on URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab")
    return tabParam === "quicksale" ? "quicksale" : "appointment"
  })

  const [serviceToAdd, setServiceToAdd] = useState("")
  const [productToAdd, setProductToAdd] = useState("")
  const [productQuantity, setProductQuantity] = useState(1)
  const [showBillDialog, setShowBillDialog] = useState(false)
  const [currentSale, setCurrentSale] = useState<any>(null)

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam === "quicksale") {
      setActiveTab("quicksale")
    }
  }, [searchParams])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  })

  // Search clients by phone number
  const searchClientsByPhone = (phone: string) => {
    if (!phone) {
      setSearchResults([])
      setSelectedClient(null)
      return
    }

    // Use the client store to search
    const results = clientStore.searchClients(phone)
    console.log("Search results:", results)
    setSearchResults(results)

    // Clear selected client if no results found
    if (results.length === 0) {
      setSelectedClient(null)
    }
  }

  // Handle creating a new client
  const handleCreateClient = () => {
    // Validate required fields
    if (!newClient.firstName || !newClient.lastName) {
      toast({
        title: "Missing information",
        description: "Please provide both first and last name.",
        variant: "destructive",
      })
      return
    }

    // Create a new client object
    const newClientId = `new-${Date.now()}`
    const createdClient = {
      id: newClientId,
      name: `${newClient.firstName} ${newClient.lastName}`,
      phone: newClient.phone || phoneSearch,
      email: newClient.email,
      status: "active" as const,
      lastVisit: new Date().toLocaleDateString(),
    }

    // Add client to store
    clientStore.addClient(createdClient)
    console.log("Client created:", createdClient)

    // Select the new client
    form.setValue("clientId", newClientId)
    setSelectedClient(createdClient)
    setPhoneSearch(createdClient.phone)

    // Update search results to include the new client
    setSearchResults([createdClient])

    // Reset and close dialog
    setNewClient({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    })
    setShowNewClientDialog(false)

    toast({
      title: "Client created",
      description: "New client has been successfully created.",
    })
  }

  // Add a service to the appointment
  const addService = () => {
    if (!serviceToAdd) return

    const service = services.find((s) => s.id === serviceToAdd)
    if (service) {
      setSelectedServices([...selectedServices, service])
      setServiceToAdd("")
    }
  }

  // Remove a service from the appointment
  const removeService = (index: number) => {
    const updatedServices = [...selectedServices]
    updatedServices.splice(index, 1)
    setSelectedServices(updatedServices)
  }

  // Add a product to the sale
  const addProduct = () => {
    if (!productToAdd || productQuantity < 1) return

    const product = products.find((p) => p.id === productToAdd)
    if (product) {
      // Check if product already exists in the list
      const existingIndex = selectedProducts.findIndex((p) => p.id === productToAdd)

      if (existingIndex >= 0) {
        // Update quantity if product already exists
        const updatedProducts = [...selectedProducts]
        updatedProducts[existingIndex].quantity += productQuantity
        setSelectedProducts(updatedProducts)
      } else {
        // Add new product
        setSelectedProducts([...selectedProducts, { ...product, quantity: productQuantity }])
      }

      setProductToAdd("")
      setProductQuantity(1)
    }
  }

  // Remove a product from the sale
  const removeProduct = (index: number) => {
    const updatedProducts = [...selectedProducts]
    updatedProducts.splice(index, 1)
    setSelectedProducts(updatedProducts)
  }

  // Update product quantity
  const updateProductQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedProducts = [...selectedProducts]
    updatedProducts[index].quantity = newQuantity
    setSelectedProducts(updatedProducts)
  }

  // Calculate totals
  const calculateServiceTotal = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0)
  }

  const calculateProductTotal = () => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0)
  }

  const calculateGrandTotal = () => {
    return calculateServiceTotal() + calculateProductTotal()
  }

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0)
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedServices.length === 0 && selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one service or product.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Prepare data for submission
    const saleData = {
      ...values,
      services: selectedServices,
      products: selectedProducts,
      totalAmount: calculateGrandTotal(),
      totalDuration: calculateTotalDuration(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
    }

    // Simulate API call
    setTimeout(() => {
      console.log(saleData)
      setIsSubmitting(false)

      if (activeTab === "appointment") {
        toast({
          title: "Appointment created",
          description: "New appointment has been successfully scheduled.",
        })
        router.push("/appointments")
      } else {
        // For quick sale, show the bill instead of redirecting
        setCurrentSale(saleData)
        setShowBillDialog(true)
      }
    }, 1000)
  }

  // If quicksale tab is active, render the new QuickSale component
  if (activeTab === "quicksale") {
    return <QuickSale />
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="appointment">Appointment</TabsTrigger>
        <TabsTrigger value="quicksale">Quick Sale</TabsTrigger>
      </TabsList>

      <TabsContent value="appointment">
        <Card>
          <CardHeader>
            <CardTitle>New Appointment</CardTitle>
            <CardDescription>Schedule a new appointment with multiple services</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="appointmentForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel>Client</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="tel"
                              placeholder="Search by phone number"
                              value={phoneSearch}
                              onChange={(e) => {
                                setPhoneSearch(e.target.value)
                                searchClientsByPhone(e.target.value)
                              }}
                            />
                            <Button type="button" variant="outline" onClick={() => searchClientsByPhone(phoneSearch)}>
                              Search
                            </Button>
                          </div>

                          {searchResults.length > 0 ? (
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                              {searchResults.map((client) => (
                                <div
                                  key={client.id}
                                  className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                                  onClick={() => {
                                    field.onChange(client.id)
                                    setSelectedClient(client)
                                    setPhoneSearch(client.phone)
                                  }}
                                >
                                  <div>
                                    <div className="font-medium">{client.name}</div>
                                    <div className="text-sm text-muted-foreground">{client.phone}</div>
                                  </div>
                                  {field.value === client.id && <Check className="h-4 w-4 text-primary" />}
                                </div>
                              ))}
                            </div>
                          ) : phoneSearch && phoneSearch.length >= 10 ? (
                            <div className="text-sm text-muted-foreground py-2">
                              No clients found with this phone number.
                              <Button
                                type="button"
                                variant="link"
                                className="px-1 h-auto"
                                onClick={() => setShowNewClientDialog(true)}
                              >
                                Create new client
                              </Button>
                            </div>
                          ) : null}

                          {selectedClient && (
                            <div className="rounded-md border p-2 bg-muted/30">
                              <div className="font-medium">{selectedClient.name}</div>
                              <div className="text-sm text-muted-foreground">{selectedClient.phone}</div>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="staffId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff Member</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a staff member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staff.map((person) => (
                              <SelectItem key={person.id} value={person.id}>
                                {person.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                                  className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Services</h3>
                    <div className="flex gap-2 mb-4">
                      <Select value={serviceToAdd} onValueChange={setServiceToAdd}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${service.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addService} className="shrink-0">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {selectedServices.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-12 bg-muted p-2 text-sm font-medium">
                          <div className="col-span-5">Service</div>
                          <div className="col-span-3 text-right">Duration</div>
                          <div className="col-span-3 text-right">Price</div>
                          <div className="col-span-1"></div>
                        </div>
                        <div className="divide-y">
                          {selectedServices.map((service, index) => (
                            <div key={index} className="grid grid-cols-12 p-2 items-center">
                              <div className="col-span-5">{service.name}</div>
                              <div className="col-span-3 text-right">{service.duration} min</div>
                              <div className="col-span-3 text-right">₹{service.price}</div>
                              <div className="col-span-1 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeService(index)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="grid grid-cols-12 p-2 bg-muted/50 font-medium">
                            <div className="col-span-5">Total</div>
                            <div className="col-span-3 text-right">{calculateTotalDuration()} min</div>
                            <div className="col-span-3 text-right">₹{calculateServiceTotal()}</div>
                            <div className="col-span-1"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 border rounded-md text-muted-foreground">
                        No services added yet. Please add at least one service.
                      </div>
                    )}
                  </div>

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
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/appointments")}>
              Cancel
            </Button>
            <Button type="submit" form="appointmentForm" disabled={isSubmitting || selectedServices.length === 0}>
              {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

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
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  First Name
                </label>
                <Input
                  id="firstName"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Last Name
                </label>
                <Input
                  id="lastName"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={newClient.phone || phoneSearch}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowNewClientDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateClient}>
              <Plus className="mr-2 h-4 w-4" />
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
