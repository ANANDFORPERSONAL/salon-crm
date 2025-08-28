"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Eye,
  X,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  CalendarIcon,
  Receipt,
  CalendarDays,
  FileText,
  Minus,
} from "lucide-react"
import { Calendar as DatePicker } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ReceiptDialog } from "@/components/receipts/receipt-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  addReceipt,
  getReceiptsByClient,
  type PaymentMethod,
  getAllReceipts,
} from "@/lib/data"
import { ServicesAPI, ProductsAPI, StaffAPI, SalesAPI, UsersAPI, SettingsAPI, ReceiptsAPI } from "@/lib/api"
import { clientStore, type Client } from "@/lib/client-store"

// Mock data for customers
// const mockCustomers = [
//   {
//     id: "1",
//     name: "Shubham Anand",
//     phone: "7091140602",
//     email: "shubham@example.com",
//     status: "active",
//     visits: 12,
//     totalSpent: 15600,
//     lastVisit: "2024-01-25",
//     bills: [
//       {
//         id: "R001",
//         date: "2024-01-25",
//         time: "14:30",
//         total: 850,
//         paymentMethod: "Cash",
//         items: [
//           { name: "Hair Cut", price: 500, staff: "John Doe" },
//           { name: "Hair Wash", price: 200, staff: "John Doe" },
//           { name: "Hair Oil", price: 150, staff: "John Doe" },
//         ],
//         notes: "Regular customer, prefers short cut",
//       },
//       {
//         id: "R002",
//         date: "2024-01-10",
//         time: "16:15",
//         total: 1200,
//         paymentMethod: "Card",
//         items: [
//           { name: "Hair Cut", price: 500, staff: "Jane Smith" },
//           { name: "Beard Trim", price: 300, staff: "Jane Smith" },
//           { name: "Face Massage", price: 400, staff: "Jane Smith" },
//         ],
//         notes: "Requested specific styling",
//       },
//     ],
//   },
//   {
//     id: "2",
//     name: "Priya Sharma",
//     phone: "9876543210",
//     email: "priya@example.com",
//     status: "active",
//     visits: 8,
//     totalSpent: 12400,
//     lastVisit: "2024-01-20",
//     bills: [],
//   },
//   {
//     id: "3",
//     name: "Rahul Kumar",
//     phone: "8765432109",
//     email: "rahul@example.com",
//     status: "inactive",
//     visits: 3,
//     totalSpent: 2100,
//     lastVisit: "2023-12-15",
//     bills: [],
//   },
// ]

// Mock data for services and products
// const mockServices = [
//   { id: "1", name: "Hair Cut", price: 500, duration: 30 },
//   { id: "2", name: "Hair Wash", price: 200, duration: 15 },
//   { id: "3", name: "Beard Trim", price: 300, duration: 20 },
//   { id: "4", name: "Face Massage", price: 400, duration: 45 },
// ]

// const mockProducts = [
//   { id: "1", name: "Hair Oil", price: 150, stock: 25 },
//   { id: "2", name: "Shampoo", price: 250, stock: 15 },
//   { id: "3", name: "Hair Gel", price: 180, stock: 30 },
//   { id: "4", name: "Face Cream", price: 320, stock: 12 },
// ]

// interface CartItem {
//   id: string
//   name: string
//   price: number
//   quantity: number
//   type: "service" | "product"
// }

interface ServiceItem {
  id: string
  serviceId: string
  staffId: string
  quantity: number
  price: number
  discount: number
  total: number
}

interface ProductItem {
  id: string
  productId: string
  staffId: string
  quantity: number
  price: number
  discount: number
  total: number
}

export function QuickSale() {
  const { toast } = useToast()
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [productItems, setProductItems] = useState<ProductItem[]>([])
  const [discountValue, setDiscountValue] = useState(0)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [giftVoucher, setGiftVoucher] = useState("")
  const [tip, setTip] = useState(0)
  const [cashAmount, setCashAmount] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)
  const [onlineAmount, setOnlineAmount] = useState(0)
  const [remarks, setRemarks] = useState("")
  const [isOldQuickSale, setIsOldQuickSale] = useState(false)
  const [currentReceipt, setCurrentReceipt] = useState<any | null>(null)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [showBillActivityDialog, setShowBillActivityDialog] = useState(false)
  const [customerBills, setCustomerBills] = useState<any[]>([])
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  })
  const customerSearchRef = useRef<HTMLDivElement>(null)
  const [showBillDetailsDialog, setShowBillDetailsDialog] = useState(false)
  const [selectedBill, setSelectedBill] = useState<any>(null)

  // State for services and products from API
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [posSettings, setPOSSettings] = useState<any>(null)
  const [paymentSettings, setPaymentSettings] = useState<any>(null)
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingClients, setLoadingClients] = useState(true)

  // Fetch services, products, staff, clients, and business settings from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        console.log('Fetching services from API...')
        const response = await ServicesAPI.getAll()
        console.log('Services API response:', response)
        if (response.success) {
          setServices(response.data || [])
          console.log('Services loaded:', response.data?.length || 0)
        }
      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setLoadingServices(false)
      }
    }

    const fetchProducts = async () => {
      try {
        console.log('Fetching products from API...')
        const response = await ProductsAPI.getAll()
        console.log('Products API response:', response)
        if (response.success) {
          setProducts(response.data || [])
          console.log('Products loaded:', response.data?.length || 0)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoadingProducts(false)
      }
    }

    const fetchStaff = async () => {
      try {
        console.log('Fetching staff from API...')
        const response = await UsersAPI.getAll()
        console.log('Users API response:', response)
        if (response.success) {
          // Filter for active staff members with appointment scheduling enabled
          const staffMembers = response.data.filter((user: any) => {
            const hasValidId = user._id || user.id
            const isActiveStaff = user.role === 'staff' && 
              user.isActive === true && 
              user.allowAppointmentScheduling === true
            console.log(`User ${user.name}: ID=${hasValidId}, Active=${isActiveStaff}, AppointmentScheduling=${user.allowAppointmentScheduling}`)
            return hasValidId && isActiveStaff
          })
          setStaff(staffMembers)
          console.log('Active staff loaded:', staffMembers.length)
          console.log('Active staff members:', staffMembers.map(s => ({ name: s.name, id: s._id || s.id, allowAppointmentScheduling: s.allowAppointmentScheduling })))
        } else {
          console.error('Users API returned error:', response.error)
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error)
      } finally {
        setLoadingStaff(false)
      }
    }

    const fetchBusinessSettings = async () => {
      try {
        console.log('Fetching business settings from API...')
        const response = await SettingsAPI.getBusinessSettings()
        console.log('Business settings API response:', response)
        if (response.success) {
          setBusinessSettings(response.data)
          console.log('Business settings loaded:', response.data)
        }
      } catch (error) {
        console.error('Failed to fetch business settings:', error)
      }
    }

    const fetchPOSSettings = async () => {
      try {
        console.log('Fetching POS settings from API...')
        const response = await SettingsAPI.getPOSSettings()
        console.log('POS settings API response:', response)
        if (response.success) {
          setPOSSettings(response.data)
          console.log('POS settings loaded:', response.data)
          console.log('Invoice prefix from POS settings:', response.data.invoicePrefix)
        } else {
          console.error('POS settings API returned error:', response.error)
        }
      } catch (error) {
        console.error('Failed to fetch POS settings:', error)
      }
    }

    const fetchPaymentSettings = async () => {
      try {
        console.log('Fetching payment settings from API...')
        const response = await SettingsAPI.getPaymentSettings()
        console.log('Payment settings API response:', response)
        if (response.success) {
          setPaymentSettings(response.data)
          console.log('Payment settings loaded:', response.data)
        } else {
          console.error('Payment settings API returned error:', response.error)
        }
      } catch (error) {
        console.error('Failed to fetch payment settings:', error)
      }
    }

    const fetchClients = async () => {
      try {
        console.log('Fetching clients from API...')
        await clientStore.loadClients()
        const allClients = clientStore.getClients()
        setClients(allClients)
        console.log('Clients loaded:', allClients.length)
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchServices()
    fetchProducts()
    fetchStaff()
    fetchBusinessSettings()
    fetchPOSSettings()
    fetchPaymentSettings()
    fetchClients()
  }, [])

  // Subscribe to client store changes
  useEffect(() => {
    const unsubscribe = clientStore.subscribe(() => {
      const updatedClients = clientStore.getClients()
      setClients(updatedClients)
    })

    return unsubscribe
  }, [])

  // Prefill from Appointment payload if present
  useEffect(() => {
    try {
      const raw = localStorage.getItem('salon-quick-sale-prefill')
      if (!raw) return
      const payload = JSON.parse(raw)
      if (payload?.source !== 'appointment') return
      // Find and set client
      const prefillClientId = payload.client?._id || payload.client?.id
      if (prefillClientId) {
        const found = clientStore.getClientById(prefillClientId)
        if (found) {
          setSelectedCustomer(found as any)
          setCustomerSearch(found.name)
        } else if (payload.client?.name) {
          // Fallback with minimal client object if store not yet loaded
          const fallbackClient: any = {
            id: prefillClientId,
            name: payload.client.name,
            phone: payload.client.phone || '',
            email: payload.client.email || '',
            status: 'active',
            totalVisits: 0,
            totalSpent: 0,
            createdAt: new Date().toISOString(),
          }
          setSelectedCustomer(fallbackClient)
          setCustomerSearch(fallbackClient.name)
        }
      }
      // Prefill first service item with serviceId and staffId
      const item = payload.items?.[0]
      if (item) {
        setServiceItems([
          {
            id: Date.now().toString(),
            serviceId: item.serviceId || '',
            staffId: item.staffId || '',
            quantity: 1,
            price: 0,
            discount: 0,
            total: 0,
          },
        ])
      }
      // Optionally clear the prefill after applying
      localStorage.removeItem('salon-quick-sale-prefill')
    } catch {}
  }, [])

  // Once services load, if we have a prefilled serviceId, trigger price autofill
  useEffect(() => {
    if (services.length === 0 || serviceItems.length === 0) return
    const first = serviceItems[0]
    if (!first.serviceId) return
    const svc = services.find((s) => s._id === first.serviceId || s.id === first.serviceId)
    if (svc) {
      // Reuse existing update logic to compute price/total
      updateServiceItem(first.id, 'serviceId' as any, first.serviceId)
    }
  }, [services])

  // Filter customers based on search
  const filteredCustomers = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      client.phone.includes(customerSearch) ||
      (client.email && client.email.toLowerCase().includes(customerSearch.toLowerCase())),
  )

  // Get the correct customer ID (handles both id and _id properties)
  const getCustomerId = (customer: Client | null): string | null => {
    if (!customer) {
      console.log('❌ No customer provided to getCustomerId')
      return null
    }
    
    const id = customer._id || customer.id || null
    console.log('🔍 Customer object:', customer)
    console.log('🔑 Customer ID (_id):', customer._id)
    console.log('🔑 Customer ID (id):', customer.id)
    console.log('🔑 Final ID resolved:', id)
    
    return id
  }

  // Handle customer selection with statistics fetch
  const handleCustomerSelect = async (customer: Client) => {
    console.log('🔍 Customer selected:', customer)
    console.log('🔑 Customer ID (id):', customer.id)
    console.log('🔑 Customer ID (_id):', customer._id)
    console.log('🔑 Final ID to use:', getCustomerId(customer))
    
    // Validate that the customer has a valid ID
    const customerId = getCustomerId(customer)
    if (!customerId) {
      console.error('❌ Customer selected but no valid ID found:', customer)
      toast({
        title: "Invalid Customer",
        description: "Selected customer has no valid ID. Please try selecting again.",
        variant: "destructive",
      })
      return
    }
    
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)
    
    // Fetch customer statistics when customer is selected
    await fetchCustomerStats(customerId)
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
    setNewCustomer({
      firstName: "",
      lastName: "",
      phone: customerSearch,
      email: "",
    })
    setShowNewCustomerDialog(true)
    setShowCustomerDropdown(false)
  }

  // Handle saving new customer
  const handleSaveNewCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide both first and last name.",
        variant: "destructive",
      })
      return
    }

    const customer: Client = {
      id: Date.now().toString(),
      name: `${newCustomer.firstName} ${newCustomer.lastName}`,
      phone: newCustomer.phone || customerSearch,
      email: newCustomer.email,
      totalVisits: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      status: "active",
    }

    try {
      // Add to client store (which will save to API)
      const success = await clientStore.addClient(customer)
      
      if (success) {
        // Refresh clients list
        await clientStore.loadClients()
        const updatedClients = clientStore.getClients()
        setClients(updatedClients)
        
        // Find the newly created client (it will have the API-generated ID)
        const newClient = updatedClients.find(c => 
          c.name === customer.name && c.phone === customer.phone
        )
        
        if (newClient) {
          // Select the new customer
          setSelectedCustomer(newClient)
          setCustomerSearch(newClient.name)
        }
        
        setShowNewCustomerDialog(false)

        // Reset form
        setNewCustomer({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
        })

        toast({
          title: "Customer Created",
          description: "New customer has been successfully created and selected.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create customer. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle viewing bill activity
  const handleViewBillActivity = async () => {
    const customerId = getCustomerId(selectedCustomer)
    if (customerId) {
      try {
        // First get the customer object to get the name
        const customer = clients.find(c => (c._id || c.id) === customerId)
        if (!customer) {
          console.error('❌ Customer not found in clients list:', customerId)
          toast({
            title: "Error",
            description: "Customer not found. Please try again.",
            variant: "destructive",
          })
          return
        }
        
        console.log('👤 Fetching bills for customer:', customer.name)
        
        // Get sales data for this customer by name
        const salesResponse = await SalesAPI.getByClient(customer.name)
        if (salesResponse.success) {
          // Transform sales data to match the expected bill format
          const bills = salesResponse.data.map((sale: any) => ({
            id: sale._id || sale.id,
            receiptNumber: sale.billNo,
            date: sale.date,
            time: sale.time || '00:00',
            total: sale.grossTotal || sale.netTotal || 0,
            payments: sale.payments || [{ type: sale.paymentMode?.toLowerCase() || 'cash', amount: sale.grossTotal || sale.netTotal || 0 }],
            items: sale.items || [],
            notes: sale.notes || '',
            clientName: sale.customerName,
            staffName: sale.staffName || 'Unassigned Staff'
          }))
          
          setCustomerBills(bills)
          console.log('📋 Transformed bills:', bills)
        } else {
          console.error('Failed to fetch customer sales:', salesResponse.error)
          toast({
            title: "Error",
            description: "Failed to fetch customer bills. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error fetching customer bills:', error)
        toast({
          title: "Error",
          description: "Failed to fetch customer bills. Please try again.",
          variant: "destructive",
        })
      }
      setShowBillActivityDialog(true)
    } else {
      toast({
        title: "Error",
        description: "Invalid customer ID. Please select a customer again.",
        variant: "destructive",
      })
    }
  }

  // Fetch customer statistics including visits, revenue, and last visit
  const fetchCustomerStats = async (customerId: string) => {
    console.log('🔍 Fetching customer stats for ID:', customerId)
    try {
      // First get the customer object to get the name
      const customer = clients.find(c => (c._id || c.id) === customerId)
      if (!customer) {
        console.error('❌ Customer not found in clients list:', customerId)
        return
      }
      
      console.log('👤 Customer found:', customer.name)
      
      // Get sales data for this customer by name
      const salesResponse = await SalesAPI.getByClient(customer.name)
      console.log('📊 Sales API response:', salesResponse)
      
      if (salesResponse.success) {
        const sales = salesResponse.data || []
        const totalVisits = sales.length
        const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.grossTotal || sale.netTotal || 0), 0)
        const lastVisit = sales.length > 0 ? sales[0]?.date : null // Sales are sorted by date desc, so first is most recent
        
        console.log('📈 Calculated stats from sales:', { totalVisits, totalRevenue, lastVisit, salesCount: sales.length })
        
        // Update the customer object with real statistics
        setSelectedCustomer(prev => prev ? {
          ...prev,
          totalVisits,
          totalSpent: totalRevenue,
          lastVisit
        } : null)
      } else {
        console.error('❌ Failed to fetch sales data:', salesResponse.error)
      }
    } catch (error) {
      console.error('❌ Error fetching customer statistics:', error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Add service item
  const addServiceItem = () => {
    const newItem: ServiceItem = {
      id: Date.now().toString(),
      serviceId: "",
      staffId: "",
      quantity: 1,
      price: 0,
      discount: 0,
      total: 0,
    }
    setServiceItems([...serviceItems, newItem])
  }

  // Add product item
  const addProductItem = () => {
    const newItem: ProductItem = {
      id: Date.now().toString(),
      productId: "",
      staffId: "",
      quantity: 1,
      price: 0,
      discount: 0,
      total: 0,
    }
    setProductItems([...productItems, newItem])
  }

  // Update service item
  const updateServiceItem = (id: string, field: keyof ServiceItem, value: any) => {
    setServiceItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Auto-fill price when service is selected
          if (field === "serviceId" && value) {
            const service = services.find((s) => s._id === value || s.id === value)
            if (service) {
              updatedItem.price = service.price
            }
          }

          // Calculate total
          const subtotal = updatedItem.price * updatedItem.quantity
          const discountAmount = (subtotal * updatedItem.discount) / 100
          updatedItem.total = subtotal - discountAmount

          return updatedItem
        }
        return item
      }),
    )
  }

  // Update product item
  const updateProductItem = (id: string, field: keyof ProductItem, value: any) => {
    setProductItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Auto-fill price when product is selected
          if (field === "productId" && value) {
            const product = products.find((p) => p._id === value || p.id === value)
            if (product) {
              updatedItem.price = product.price
            }
          }

          // Calculate total
          const subtotal = updatedItem.price * updatedItem.quantity
          const discountAmount = (subtotal * updatedItem.discount) / 100
          updatedItem.total = subtotal - discountAmount

          return updatedItem
        }
        return item
      }),
    )
  }

  // Remove service item
  const removeServiceItem = (id: string) => {
    setServiceItems((items) => items.filter((item) => item.id !== id))
  }

  // Remove product item
  const removeProductItem = (id: string) => {
    setProductItems((items) => items.filter((item) => item.id !== id))
  }

  // Calculate totals
  const serviceTotal = serviceItems.reduce((sum, item) => sum + item.total, 0)
  const productTotal = productItems.reduce((sum, item) => sum + item.total, 0)
  const subtotal = serviceTotal + productTotal
  const totalDiscount = discountValue + (subtotal * discountPercentage) / 100
  const grandTotal = subtotal - totalDiscount + tip
  const totalPaid = cashAmount + cardAmount + onlineAmount
  const change = totalPaid - grandTotal

  // Generate receipt number
  const generateReceiptNumber = () => {
    // Use POS settings for receipt number generation
    const prefix = posSettings?.invoicePrefix || businessSettings?.invoicePrefix || businessSettings?.receiptPrefix || "INV"
    const receiptNumber = posSettings?.receiptNumber || businessSettings?.receiptNumber || 1
    
    console.log('=== RECEIPT NUMBER GENERATION DEBUG ===')
    console.log('posSettings:', posSettings)
    console.log('businessSettings:', businessSettings)
    console.log('posSettings?.invoicePrefix:', posSettings?.invoicePrefix)
    console.log('businessSettings?.invoicePrefix:', businessSettings?.invoicePrefix)
    console.log('businessSettings?.receiptPrefix:', businessSettings?.receiptPrefix)
    console.log('Final prefix used:', prefix)
    console.log('Final receipt number used:', receiptNumber)
    console.log('Final receipt number generated:', `${prefix}-${receiptNumber.toString().padStart(6, '0')}`)
    
    // Format: PREFIX-000001, PREFIX-000002, etc.
    return `${prefix}-${receiptNumber.toString().padStart(6, '0')}`
  }

  // Handle checkout
  const handleCheckout = async () => {
    if (!selectedCustomer && !customerSearch) {
      toast({
        title: "Customer Required",
        description: "Please select or enter a customer",
        variant: "destructive",
      })
      return
    }

    const validServiceItems = serviceItems.filter((item) => item.serviceId)
    const validProductItems = productItems.filter((item) => item.productId)

    if (validServiceItems.length === 0 && validProductItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one service or product",
        variant: "destructive",
      })
      return
    }

    // --- STOCK VALIDATION: Check if we have enough inventory for all products ---
    if (validProductItems.length > 0) {
      console.log('📦 Validating product stock before checkout...')
      
      for (const productItem of validProductItems) {
        const product = products.find((p) => p._id === productItem.productId || p.id === productItem.productId)
        
        if (product) {
          console.log(`📦 Checking stock for ${product.name}: Available ${product.stock}, Required ${productItem.quantity}`)
          
          if (product.stock < productItem.quantity) {
            toast({
              title: "Insufficient Stock",
              description: `${product.name} has insufficient stock. Available: ${product.stock}, Required: ${productItem.quantity}`,
              variant: "destructive",
            })
            return // Stop checkout if any product has insufficient stock
          }
        } else {
          console.error(`❌ Product not found for ID: ${productItem.productId}`)
          toast({
            title: "Product Error",
            description: "One or more products could not be found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }
      }
      
      console.log('✅ All products have sufficient stock')
    }

    if (totalPaid < grandTotal) {
      toast({
        title: "Insufficient Payment",
        description: "Payment amount is less than the total amount",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create or use existing customer
      let customer = selectedCustomer
      if (!customer && customerSearch) {
        // Create new customer
        customer = {
          id: Date.now().toString(),
          name: customerSearch,
          phone: customerSearch.match(/^\d+$/) ? customerSearch : "",
          email: customerSearch.includes("@") ? customerSearch : "",
          totalVisits: 1,
          totalSpent: grandTotal,
          createdAt: new Date().toISOString(),
          status: "active",
        }
        // Add to clients array
        clients.push(customer)
      } else if (customer) {
        // Update existing customer stats
        customer.totalVisits = (customer.totalVisits || 0) + 1
        customer.totalSpent = (customer.totalSpent || 0) + grandTotal
        customer.lastVisit = format(new Date(), "yyyy-MM-dd")
      }

      // Debug: Log all available data
      console.log('=== RECEIPT GENERATION DEBUG ===')
      console.log('Business Settings:', businessSettings)
      console.log('POS Settings:', posSettings)
      console.log('Business Settings invoicePrefix:', businessSettings?.invoicePrefix)
      console.log('Business Settings receiptPrefix:', businessSettings?.receiptPrefix)
      console.log('POS Settings invoicePrefix:', posSettings?.invoicePrefix)
      console.log('Services:', services.map(s => ({ id: s._id || s.id, name: s.name })))
      console.log('Products:', products.map(p => ({ id: p._id || p.id, name: p.name })))
      console.log('Staff:', staff.map(s => ({ id: s._id || s.id, name: s.name })))
      console.log('Valid Service Items:', validServiceItems)
      console.log('Valid Product Items:', validProductItems)
      
      // Create receipt items
      const receiptItems: any[] = [
        ...validServiceItems.map((item) => {
          const service = services.find((s) => s._id === item.serviceId || s.id === item.serviceId)
          const staffMember = staff.find((s) => s._id === item.staffId || s.id === item.staffId)
          console.log('Service lookup:', { serviceId: item.serviceId, foundService: service?.name, allServices: services.map(s => ({ id: s._id || s.id, name: s.name })) })
          console.log('Staff lookup:', { staffId: item.staffId, foundStaff: staffMember?.name, allStaff: staff.map(s => ({ id: s._id || s.id, name: s.name })) })
          return {
            id: item.id,
            name: service?.name || "Unknown Service",
            type: "service",
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            discountType: "percentage",
            staffId: item.staffId,
            staffName: staffMember?.name || "Unassigned Staff",
            total: item.total,
          }
        }),
        ...validProductItems.map((item) => {
          const product = products.find((p) => p._id === item.productId || p.id === item.productId)
          const staffMember = staff.find((s) => s._id === item.staffId || s.id === item.staffId)
          console.log('Product lookup:', { productId: item.productId, foundProduct: product?.name, allProducts: products.map(p => ({ id: p._id || p.id, name: p.name })) })
          return {
            id: item.id,
            name: product?.name || "Unknown Product",
            type: "product",
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            discountType: "percentage",
            staffId: item.staffId,
            staffName: staffMember?.name || "Unassigned Staff",
            total: item.total,
          }
        }),
      ]

      // Create payments array
      const payments: PaymentMethod[] = []
      if (cashAmount > 0) payments.push({ type: "cash", amount: cashAmount })
      if (cardAmount > 0) payments.push({ type: "card", amount: cardAmount })
      if (onlineAmount > 0) payments.push({ type: "digital", amount: onlineAmount })

      // Get the primary staff member (first staff member from items)
      const primaryStaff = receiptItems.length > 0 ? receiptItems[0] : null
      
      // Calculate tax and total based on payment settings
      const taxRate = paymentSettings?.enableTax ? (paymentSettings?.taxRate || 8.25) / 100 : 0
      const calculatedTax = subtotal * taxRate
      const calculatedTotal = subtotal + calculatedTax
      
      // Create receipt
      const receipt: any = {
        id: Date.now().toString(),
        receiptNumber: generateReceiptNumber(),
        clientId: getCustomerId(customer),
        clientName: customer!.name,
        clientPhone: customer!.phone,
        date: selectedDate.toISOString(),
        time: format(new Date(), "HH:mm"),
        items: receiptItems,
        subtotal: subtotal,
        tip: tip,
        discount: totalDiscount,
        tax: calculatedTax,
        total: calculatedTotal,
        payments: payments,
        staffId: primaryStaff?.staffId || staff[0]?._id || staff[0]?.id || "",
        staffName: primaryStaff?.staffName || staff[0]?.name || "Unassigned Staff",
        notes: remarks,
      }

      // Increment receipt number in business settings if auto increment is enabled
      if (businessSettings?.autoIncrementReceipt) {
        try {
          await SettingsAPI.incrementReceiptNumber()
          console.log('Receipt number incremented successfully')
        } catch (error) {
          console.error('Failed to increment receipt number:', error)
        }
      }

      // Add receipt to storage
      addReceipt(receipt)
      setCurrentReceipt(receipt)
      // setShowReceiptDialog(true) // Comment out modal dialog

      console.log('🎯 RECEIPT DIALOG DEBUG:')
      console.log('Current Receipt:', receipt)
      console.log('Receipt Number:', receipt.receiptNumber)
      console.log('Show Receipt Dialog:', true)
      console.log('Receipt Items:', receipt.items)
      console.log('Receipt Total:', receipt.total)
      console.log('Receipt Structure Check:')
      console.log('- Has ID:', !!receipt.id)
      console.log('- Has Receipt Number:', !!receipt.receiptNumber)
      console.log('- Has Client ID:', !!receipt.clientId)
      console.log('- Has Client Name:', !!receipt.clientName)
      console.log('- Has Items:', !!receipt.items && receipt.items.length > 0)
      console.log('- Has Total:', !!receipt.total)
      console.log('Full Receipt Object:', JSON.stringify(receipt, null, 2))

      // Debug: Check if receipt was stored
      const allReceipts = getAllReceipts()
      console.log('📋 All receipts after storage:', allReceipts)
      console.log('📊 Total receipts in store:', allReceipts.length)
      console.log('🔍 Looking for receipt with ID:', receipt.id)
      console.log('🔍 Looking for receipt with number:', receipt.receiptNumber)

      // Open receipt in new tab with more data
      const receiptUrl = `/receipt/${receipt.id}?receiptNumber=${receipt.receiptNumber}&data=${encodeURIComponent(JSON.stringify(receipt))}`
      console.log('🎯 Opening receipt in new tab:', receiptUrl)
      window.open(receiptUrl, '_blank')

      // --- Add to Sales Records (backend) ---
      try {
        // Create payments array for split payments
        const salePayments = payments.map(payment => ({
          mode: payment.type === 'cash' ? 'Cash' : payment.type === 'card' ? 'Card' : 'Online',
          amount: payment.amount
        }))

        const saleData = {
          billNo: receipt.receiptNumber,
          customerName: receipt.clientName,
          date: receipt.date,
          paymentMode: payments[0]?.type === 'cash' ? 'Cash' : payments[0]?.type === 'card' ? 'Card' : 'Online', // Legacy support
          payments: salePayments, // New split payment structure
          netTotal: receipt.subtotal,
          taxAmount: receipt.tax,
          grossTotal: receipt.total,
          status: 'completed' as const,
          staffName: receipt.staffName,
          items: receipt.items.map((item: any) => ({
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        }
        
        console.log('🔍 DEBUG: Starting sale creation...')
        console.log('📋 Sale data:', saleData)
        console.log('💰 Split payments:', salePayments)
        console.log('🔑 Auth token:', localStorage.getItem('salon-auth-token'))
        console.log('👤 Current user:', localStorage.getItem('salon-auth-user'))
        
        // Test API connection first
        try {
          const healthCheck = await fetch('http://localhost:3001/api/health')
          const healthData = await healthCheck.json()
          console.log('🏥 Backend health:', healthData.success)
        } catch (healthError) {
          console.error('❌ Backend health check failed:', healthError)
        }
        
        const result = await SalesAPI.create(saleData)
        console.log('✅ Sale created successfully:', result)
        
        // --- INVENTORY MANAGEMENT: Deduct product quantities from stock ---
        if (validProductItems.length > 0) {
          console.log('📦 Starting inventory management for products...')
          
          try {
            // Process each product item to update inventory
            for (const productItem of validProductItems) {
              const product = products.find((p) => p._id === productItem.productId || p.id === productItem.productId)
              
              if (product) {
                console.log(`📦 Updating inventory for product: ${product.name}`)
                console.log(`📊 Current stock: ${product.stock}, Quantity sold: ${productItem.quantity}`)
                
                // Check if we have enough stock before proceeding
                if (product.stock < productItem.quantity) {
                  console.error(`❌ Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${productItem.quantity}`)
                  toast({
                    title: "Stock Warning",
                    description: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${productItem.quantity}`,
                    variant: "destructive",
                  })
                  continue // Skip this product but continue with others
                }
                
                // Update product stock by decreasing it
                const stockUpdateResult = await ProductsAPI.updateStock(
                  product._id || product.id, 
                  productItem.quantity, 
                  'decrease'
                )
                
                if (stockUpdateResult.success) {
                  console.log(`✅ Stock updated successfully for ${product.name}`)
                  console.log(`📊 New stock level: ${stockUpdateResult.data.stock}`)
                  
                  // Update the local products array to reflect the new stock
                  setProducts(prevProducts => 
                    prevProducts.map(p => 
                      p._id === product._id || p.id === product.id 
                        ? { ...p, stock: stockUpdateResult.data.stock }
                        : p
                    )
                  )
                } else {
                  console.error(`❌ Failed to update stock for ${product.name}:`, stockUpdateResult.error)
                  toast({
                    title: "Stock Update Failed",
                    description: `Failed to update stock for ${product.name}. Please check inventory manually.`,
                    variant: "destructive",
                  })
                }
              } else {
                console.error(`❌ Product not found for ID: ${productItem.productId}`)
              }
            }
            
            console.log('✅ Inventory management completed')
          } catch (inventoryError) {
            console.error('❌ Error during inventory management:', inventoryError)
            toast({
              title: "Inventory Warning",
              description: "Sale completed but inventory update failed. Please check stock levels manually.",
              variant: "destructive",
            })
          }
        }
      } catch (err: any) {
        console.error('❌ Failed to add sale record:', err)
        console.error('📄 Error details:', err.response?.data)
        console.error('🔢 Error status:', err.response?.status)
        console.error('🌐 Error message:', err.message)
        console.error('📋 Full error object:', err)
      }

      // Reset form
      resetForm()

      toast({
        title: "Checkout Successful",
        description: `Sale completed successfully! Receipt #${receipt.receiptNumber}`,
      })
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: "An error occurred during checkout",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setSelectedCustomer(null)
    setCustomerSearch("")
    setServiceItems([])
    setProductItems([])
    setDiscountValue(0)
    setDiscountPercentage(0)
    setGiftVoucher("")
    setTip(0)
    setCashAmount(0)
    setCardAmount(0)
    setOnlineAmount(0)
    setRemarks("")
  }

  // Quick cash amounts
  const quickCashAmounts = [100, 200, 500]



  const formatCurrency = (amount: number) => {
    const currency = paymentSettings?.enableCurrency ? (paymentSettings?.currency || "USD") : "USD"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  const [showBillHistoryDialog, setShowBillHistoryDialog] = useState(false)
  const [generatedReceipt, setGeneratedReceipt] = useState<any | null>(null)

  const handleNewCustomerSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    handleSaveNewCustomer()
  }

  // Handle viewing individual bill details
  const handleViewBillDetails = (bill: any) => {
    setSelectedBill(bill)
    setShowBillDetailsDialog(true)
  }

  if (isOldQuickSale) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer"
                    placeholder="Search by name or phone..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerDropdown(true)
                      if (!e.target.value) {
                        setSelectedCustomer(null)
                      }
                    }}
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
                            onClick={() => handleCustomerSelect(customer)}
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
                          onClick={handleCreateNewCustomer}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Create new customer: &quot;{customerSearch}&quot;</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              {selectedCustomer && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
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

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Visits
                      </div>
                      <div className="font-semibold">{selectedCustomer.totalVisits || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="h-3 w-3" />
                        Revenue
                      </div>
                      <div className="font-semibold">{formatCurrency(selectedCustomer.totalSpent || 0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Last Visit
                      </div>
                      <div className="font-semibold text-xs">{formatDate(selectedCustomer.lastVisit || "")}</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 bg-transparent"
                    onClick={() => setShowBillActivityDialog(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Bill Activity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services & Products */}
          <Card>
            <CardHeader>
              <CardTitle>Services & Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Services */}
              {/* <div className="space-y-2">
                <Label>Services</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-32 overflow-auto space-y-1">
                  {filteredServices.map((service) => (
                    <div
                      key={service._id || service.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => addToCart(service, "service")}
                    >
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">{service.duration} min</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(service.price)}</div>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator /> */}

              {/* Products */}
              {/* <div className="space-y-2">
                <Label>Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-32 overflow-auto space-y-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => addToCart(product, "product")}
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">Stock: {product.stock}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(product.price)}</div>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Cart ({cart.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items in cart</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.type}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{item.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <div className="w-20 text-right font-medium">{formatCurrency(item.price * item.quantity)}</div>
                      <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id, item.type)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card> */}

        {/* Payment */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex gap-2">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                >
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("card")}
                >
                  Card
                </Button>
                <Button variant={paymentMethod === "upi" ? "default" : "outline"} onClick={() => setPaymentMethod("upi")}>
                  UPI
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={isLoading || cart.length === 0 || !selectedCustomer}
            >
              {isLoading ? "Processing..." : `Complete Sale - ${formatCurrency(grandTotal)}`}
            </Button>
          </CardContent>
        </Card> */}

        {/* New Customer Dialog */}
        <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
          <DialogContent className="border-gray-200 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">Create New Customer</DialogTitle>
              <DialogDescription className="text-gray-600">Add a new customer to your salon database.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                  <Input
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                  <Input
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Phone</Label>
                <Input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Enter email address"
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewCustomerDialog(false)} className="border-gray-200 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveNewCustomer} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bill Activity Dialog */}
        <Dialog open={showBillActivityDialog} onOpenChange={setShowBillActivityDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-gray-200 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Receipt className="h-5 w-5 text-indigo-600" />
                Bill Activity - {selectedCustomer?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-600">View all previous bills and transactions for this customer.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {customerBills.length > 0 ? (
                <div className="space-y-3">
                  {customerBills.map((bill) => (
                    <Card 
                      key={bill.id} 
                      className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 border-gray-200 hover:border-indigo-200 hover:shadow-md"
                      onClick={() => handleViewBillDetails(bill)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">Receipt #{bill.receiptNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(bill.date), "dd MMM yyyy")} at {bill.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-indigo-600">₹{bill.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{bill.payments.map((p: any) => p.type).join(", ")}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Items:</h5>
                        <div className="space-y-1">
                          {bill.items.map((item: any, index: number) => (
                            <div key={item.id || index} className="flex justify-between text-sm">
                              <span>
                                {item.name} x{item.quantity}
                                {item.staffName && <span className="text-gray-500"> by {item.staffName}</span>}
                              </span>
                              <span className="font-medium">₹{item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        {bill.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                              <strong>Notes:</strong> {bill.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Bills Found</h3>
                  <p className="text-gray-500">This customer doesn&apos;t have any previous bills or transactions.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBillActivityDialog(false)} className="border-gray-200 text-gray-700 hover:bg-gray-50">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bill Details Dialog */}
        <Dialog open={showBillDetailsDialog} onOpenChange={setShowBillDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-gray-200 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Receipt className="h-5 w-5 text-indigo-600" />
                Bill Details - {selectedBill?.receiptNumber}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Detailed view of the selected bill
              </DialogDescription>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4">
                {/* Bill Header */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Receipt Number</p>
                    <p className="font-semibold text-gray-800">{selectedBill.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(selectedBill.date), "dd MMM yyyy")} at {selectedBill.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold text-gray-800">{selectedBill.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-indigo-600">₹{selectedBill.total?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Bill Items */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Items</h4>
                  <div className="space-y-2">
                    {selectedBill.items?.map((item: any, index: number) => (
                      <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ₹{item.price?.toFixed(2)}
                            {item.staffName && ` • Staff: ${item.staffName}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">₹{item.total?.toFixed(2)}</p>
                          {item.discount > 0 && (
                            <p className="text-xs text-red-600">
                              -₹{((item.price * item.quantity * item.discount) / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Information */}
                {selectedBill.payments && selectedBill.payments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Payment Methods</h4>
                    <div className="space-y-2">
                      {selectedBill.payments.map((payment: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="capitalize font-medium text-gray-700">{payment.type}</span>
                          <span className="font-semibold text-gray-800">₹{payment.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                {(selectedBill.notes || selectedBill.staffName) && (
                  <div className="space-y-3">
                    {selectedBill.staffName && (
                      <div>
                        <p className="text-sm text-gray-600">Staff Member</p>
                        <p className="font-semibold text-gray-800">{selectedBill.staffName}</p>
                      </div>
                    )}
                    {selectedBill.notes && (
                      <div>
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="font-medium text-gray-800">{selectedBill.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBillDetailsDialog(false)} className="border-gray-200 text-gray-700 hover:bg-gray-50">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <ReceiptDialog
          receipt={currentReceipt}
          open={showReceiptDialog}
          onOpenChange={setShowReceiptDialog}
          onReceiptUpdate={(updatedReceipt) => {
            setCurrentReceipt(updatedReceipt)
            toast({ title: "Success", description: "Receipt updated successfully" })
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white/80 backdrop-blur-sm">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Quick Sale
              </h2>
              <p className="text-muted-foreground">Create and process sales quickly and efficiently</p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200/50">
              <Label htmlFor="old-quick-sale" className="text-sm font-medium text-gray-700">
                Switch to old quick sale
              </Label>
              <Switch id="old-quick-sale" checked={isOldQuickSale} onCheckedChange={setIsOldQuickSale} />
            </div>
          </div>

          {/* Customer and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 relative" ref={customerSearchRef}>
              <Label htmlFor="customer" className="text-sm font-semibold text-gray-700">Customer *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer"
                  placeholder="Search by name, phone, or email"
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-300"
                />
              </div>

              {/* Customer Dropdown */}
              {showCustomerDropdown && customerSearch && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto backdrop-blur-sm">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer._id || customer.id}
                        className="p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer border-b last:border-b-0 transition-all duration-200 group"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-200">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 group-hover:text-indigo-800 transition-colors duration-200">{customer.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </span>
                              {customer.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {customer.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="p-4 text-center text-muted-foreground hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 cursor-pointer transition-all duration-200 group"
                      onClick={handleCreateNewCustomer}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg group-hover:from-emerald-200 group-hover:to-green-200 transition-all duration-200">
                          <User className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">Create new customer: &quot;{customerSearch}&quot;</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Customer Details */}
              {selectedCustomer && (
                <div className="mt-4 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100/50 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">{selectedCustomer.name}</h4>
                        <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                        {selectedCustomer.email && (
                          <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={selectedCustomer.status === "active" ? "default" : "secondary"} className="px-3 py-1">
                      {selectedCustomer.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white/60 rounded-lg border border-white/50">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-medium text-gray-700">Visits</span>
                      </div>
                      <p className="text-lg font-bold text-indigo-700">{selectedCustomer.totalVisits || 0}</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-lg border border-white/50">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-medium text-gray-700">Revenue</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">₹{Number(selectedCustomer.totalSpent || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-lg border border-white/50">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CalendarIcon className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">Last Visit</span>
                      </div>
                      <p className="text-sm font-semibold text-purple-700">
                        {selectedCustomer.lastVisit ? format(new Date(selectedCustomer.lastVisit), "dd MMM") : "Never"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewBillActivity}
                    className="w-full h-10 text-sm bg-white/80 hover:bg-white border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:border-indigo-300 transition-all duration-300"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Bill Activity
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 border-gray-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-300",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd MMM, yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-gray-200 shadow-xl" align="start">
                      <DatePicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date: Date | undefined) => { if (date) setSelectedDate(date) }}
                        initialFocus
                      />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-800">Services</h3>
                <p className="text-sm text-muted-foreground">Add services to the sale</p>
              </div>
              <Button onClick={addServiceItem} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            {serviceItems.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="grid grid-cols-[2fr_1.5fr_120px_100px_100px_100px_40px] gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 font-semibold text-sm text-gray-700 border-b">
                  <div>Service *</div>
                  <div>Staff *</div>
                  <div>Qty</div>
                  <div>Price (₹)</div>
                  <div>Disc. (%)</div>
                  <div>Total (₹)</div>
                  <div></div>
                </div>

                {serviceItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_1.5fr_120px_100px_100px_100px_40px] gap-4 p-4 border-b last:border-b-0 items-center hover:bg-gray-50/50 transition-all duration-200"
                  >
                    <Select
                      value={item.serviceId}
                      onValueChange={(value) => updateServiceItem(item.id, "serviceId", value)}
                    >
                      <SelectTrigger className="h-8">
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
                          services.map((service) => (
                            <SelectItem key={service._id || service.id} value={service._id || service.id}>
                              {service.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <Select
                      value={item.staffId}
                      onValueChange={(value) => updateServiceItem(item.id, "staffId", value)}
                    >
                      <SelectTrigger className="h-8">
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
                          (() => {
                            const validStaff = staff.filter((member) => {
                              const validId = member._id || member.id
                              const isValid = validId && validId.toString().trim() !== ''
                              console.log(`Staff member ${member.name}: ID=${validId}, Valid=${isValid}`)
                              return isValid
                            })
                            
                            if (validStaff.length === 0) {
                              return (
                                <SelectItem value="no-valid-staff" disabled>
                                  No valid staff available
                                </SelectItem>
                              )
                            }
                            
                            return validStaff.map((member) => {
                              const staffId = member._id || member.id
                              return (
                                <SelectItem key={staffId} value={staffId}>
                                  {member.name} {member.role ? `(${member.role})` : ''}
                                </SelectItem>
                              )
                            })
                          })()
                        )}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={() => updateServiceItem(item.id, "quantity", Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-8 text-center text-sm font-medium">{item.quantity}</div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={() => updateServiceItem(item.id, "quantity", item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateServiceItem(item.id, "price", Number(e.target.value))}
                      className="h-8"
                    />

                    <Input
                      type="number"
                      value={item.discount}
                      onChange={(e) => updateServiceItem(item.id, "discount", Number(e.target.value))}
                      className="h-8"
                    />

                    <div className="text-sm font-medium">₹{item.total.toFixed(2)}</div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeServiceItem(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-800">Products</h3>
                <p className="text-sm text-muted-foreground">Add products to the sale</p>
              </div>
              <Button onClick={addProductItem} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {productItems.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="grid grid-cols-[2fr_1.5fr_120px_100px_100px_100px_40px] gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 font-semibold text-sm text-gray-700 border-b">
                  <div>Product *</div>
                  <div>Staff *</div>
                  <div>Qty</div>
                  <div>Price (₹)</div>
                  <div>Disc. (%)</div>
                  <div>Total (₹)</div>
                  <div></div>
                </div>

                {productItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="grid grid-cols-[2fr_1.5fr_120px_100px_100px_100px_40px] gap-4 p-4 border-b last:border-b-0 items-center hover:bg-emerald-50/30 transition-all duration-200">
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateProductItem(item.id, "productId", value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingProducts ? (
                            <SelectItem value="" disabled>
                              Loading products...
                            </SelectItem>
                          ) : products.length === 0 ? (
                            <SelectItem value="" disabled>
                              No products available
                            </SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product._id || product.id} value={product._id || product.id}>
                                {product.name} (Stock: {product.stock})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      <Select
                        value={item.staffId}
                        onValueChange={(value) => updateProductItem(item.id, "staffId", value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingStaff ? (
                            <SelectItem value="" disabled>
                              Loading staff...
                            </SelectItem>
                          ) : staff.length === 0 ? (
                            <SelectItem value="no-staff" disabled>
                              No active staff available
                            </SelectItem>
                          ) : (
                            (() => {
                              const validStaff = staff.filter((member) => {
                                const validId = member._id || member.id
                                const isValid = validId && validId.toString().trim() !== ''
                                console.log(`Staff member ${member.name}: ID=${validId}, Valid=${isValid}`)
                                return isValid
                              })
                              
                              if (validStaff.length === 0) {
                                return (
                                  <SelectItem value="no-valid-staff" disabled>
                                    No valid staff available
                                  </SelectItem>
                                )
                              }
                              
                              return validStaff.map((member) => {
                                const staffId = member._id || member.id
                                return (
                                  <SelectItem key={staffId} value={staffId}>
                                    {member.name} {member.role ? `(${member.role})` : ''}
                                  </SelectItem>
                                )
                              })
                            })()
                          )}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 p-0 bg-transparent"
                          onClick={() => updateProductItem(item.id, "quantity", Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-8 text-center text-sm font-medium">{item.quantity}</div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 p-0 bg-transparent"
                          onClick={() => updateProductItem(item.id, "quantity", item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateProductItem(item.id, "price", Number(e.target.value))}
                        className="h-8"
                      />

                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateProductItem(item.id, "discount", Number(e.target.value))}
                        className="h-8"
                      />

                      <div className="text-sm font-medium">₹{item.total.toFixed(2)}</div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeProductItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Stock Warning */}
                    {item.productId && (() => {
                      const product = products.find((p) => p._id === item.productId || p.id === item.productId)
                      if (product && item.quantity > product.stock) {
                        return (
                          <div className="px-3 text-xs text-red-600 font-medium">
                            ⚠️ Insufficient stock! Available: {product.stock}, Requested: {item.quantity}
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Items Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Add Items</h3>
            <Tabs defaultValue="membership" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="membership">Membership</TabsTrigger>
                <TabsTrigger value="gift-voucher">Gift Voucher</TabsTrigger>
                <TabsTrigger value="prepaid">Prepaid</TabsTrigger>
              </TabsList>
              <TabsContent value="membership" className="mt-4">
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Membership options coming soon
                </div>
              </TabsContent>
              <TabsContent value="gift-voucher" className="mt-4">
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Gift voucher options coming soon
                </div>
              </TabsContent>
              <TabsContent value="prepaid" className="mt-4">
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Prepaid options coming soon
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Discounts & Offers */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Discounts & Offers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount-value">Disc. by Value</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">₹</span>
                  <Input
                    id="discount-value"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="pl-8"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-percentage">Disc. by Percentage</Label>
                <div className="relative">
                  <Input
                    id="discount-percentage"
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="pr-8"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gift-voucher">Redeem Gift Voucher</Label>
                <Input
                  id="gift-voucher"
                  value={giftVoucher}
                  onChange={(e) => setGiftVoucher(e.target.value)}
                  placeholder="Eg: YKL/VPPM"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Summary Sidebar */}
      <div className="w-80 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 p-6 space-y-6 shadow-xl h-screen overflow-hidden flex flex-col">
        <div className="space-y-2 flex-shrink-0">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Billing Summary
          </h3>
          <p className="text-sm text-muted-foreground">Review and complete the sale</p>
        </div>

        <div className="space-y-3 p-3 bg-white rounded-xl border border-gray-200/50 shadow-sm flex-shrink-0">
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-gray-600">Sub Total:</span>
            <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-gray-600">Discount:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(totalDiscount)}</span>
            </div>
          )}
          {paymentSettings?.enableTax && (
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-gray-600">Tax ({paymentSettings?.taxRate || 8.25}%):</span>
              <span className="font-semibold text-gray-800">{formatCurrency(subtotal * ((paymentSettings?.taxRate || 8.25) / 100))}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2 border-t border-gray-100 pt-2">
            <span className="text-base font-semibold text-gray-800">Grand Total:</span>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{formatCurrency(grandTotal)}</span>
          </div>
          
          <div className="space-y-2 pt-1">
            <Label htmlFor="tip" className="text-xs font-medium text-gray-700">Add Tip</Label>
            <Input
              id="tip"
              type="number"
              value={tip}
              onChange={(e) => setTip(Number(e.target.value))}
              placeholder="0"
              className="h-8 text-sm border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>
          
          <div className="flex justify-between items-center py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg px-3 border border-emerald-200">
            <span className="text-sm font-semibold text-emerald-800">Change</span>
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(change)}</span>
          </div>
        </div>

        <div className="space-y-2 flex-shrink-0">
          <Label className="text-xs font-medium text-gray-700">Remarks</Label>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add remarks..."
            className="h-16 text-sm border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 resize-none"
          />
        </div>

        <Separator className="bg-gray-200 flex-shrink-0" />

        <div className="space-y-4 flex-1 min-h-0">
          <div className="flex justify-between items-center text-lg font-bold flex-shrink-0">
            <span className="text-gray-800">Payable Amount</span>
            <span className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{formatCurrency(grandTotal)}</span>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 flex-shrink-0">
            <h4 className="text-sm font-semibold text-gray-700">Payment Methods</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
                  <Banknote className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="flex-1 text-sm font-medium text-green-800">Cash</span>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="w-20 h-7 text-sm border-green-200 focus:border-green-500 focus:ring-green-500/20 bg-white/80"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <CreditCard className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="flex-1 text-sm font-medium text-blue-800">Card</span>
                <Input
                  type="number"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(Number(e.target.value))}
                  className="w-20 h-7 text-sm border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-sm">
                  <Smartphone className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="flex-1 text-sm font-medium text-purple-800">Online/PayTM</span>
                <Input
                  type="number"
                  value={onlineAmount}
                  onChange={(e) => setOnlineAmount(Number(e.target.value))}
                  className="w-20 h-7 text-sm border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 bg-white/80"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Processing Fees */}
          {paymentSettings?.enableProcessingFees && (cardAmount > 0 || onlineAmount > 0) && (
            <div className="space-y-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 flex-shrink-0">
              <div className="text-xs font-semibold text-amber-800">Processing Fees</div>
              {cardAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-amber-700">Card Payment ({paymentSettings?.processingFee || 2.9}%):</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency((cardAmount * (paymentSettings?.processingFee || 2.9)) / 100)}
                  </span>
                </div>
              )}
              {onlineAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-amber-700">Online Payment ({paymentSettings?.processingFee || 2.9}%):</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency((onlineAmount * (paymentSettings?.processingFee || 2.9)) / 100)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg px-3 border border-emerald-200 flex-shrink-0">
            <span className="text-sm font-semibold text-emerald-800">Total Paid:</span>
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
          </div>

          {/* Quick Cash Amounts */}
          <div className="space-y-2 flex-shrink-0">
            <Label className="text-xs font-medium text-gray-700">Quick Cash Amounts:</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {quickCashAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setCashAmount(amount)}
                  className="h-7 text-xs bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-200"
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCashAmount(grandTotal)} 
              className="w-full h-7 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 hover:border-indigo-300 text-indigo-700 hover:text-indigo-800 transition-all duration-200"
            >
              Exact Amount ({formatCurrency(grandTotal)})
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 flex-shrink-0">
            <Button 
              onClick={handleCheckout} 
              disabled={isProcessing} 
              className="flex-1 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="h-3.5 w-3.5 mr-1.5" />
                  Checkout
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={resetForm} 
              className="flex-1 h-10 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-200"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
