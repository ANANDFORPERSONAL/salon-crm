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
  Pencil,
  ChevronDown,
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
import { useToast } from "@/components/ui/use-toast"
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
import { ServicesAPI, ProductsAPI, StaffAPI, SalesAPI, UsersAPI, SettingsAPI, ReceiptsAPI, StaffDirectoryAPI } from "@/lib/api"
import { clientStore, type Client } from "@/lib/client-store"
import { MultiStaffSelector, type StaffContribution } from "@/components/ui/multi-staff-selector"
import { TaxCalculator, createTaxCalculator, type TaxSettings, type BillItem } from "@/lib/tax-calculator"

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
  staffId: string // Legacy field for backward compatibility
  staffContributions?: Array<{
    staffId: string
    staffName: string
    percentage: number
    amount: number
  }>
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
  const [isGlobalDiscountActive, setIsGlobalDiscountActive] = useState(false)
  const [isValueDiscountActive, setIsValueDiscountActive] = useState(false)
  const [cashAmount, setCashAmount] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)
  const [onlineAmount, setOnlineAmount] = useState(0)
  const [remarks, setRemarks] = useState("")
  const [isOldQuickSale, setIsOldQuickSale] = useState(false)
  const [currentReceipt, setCurrentReceipt] = useState<any | null>(null)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  
  // Search states for service items dropdown
  const [serviceDropdownSearch, setServiceDropdownSearch] = useState("")
  const [productDropdownSearch, setProductDropdownSearch] = useState("")
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
  const [confirmUnpaid, setConfirmUnpaid] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [tempTipAmount, setTempTipAmount] = useState(0)

  // State for services and products from API
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [posSettings, setPOSSettings] = useState<any>(null)
  const [paymentSettings, setPaymentSettings] = useState<any>(null)

  // Filtered services and products for dropdown search
  const filteredServicesForDropdown = services.filter(service =>
    service.name.toLowerCase().includes(serviceDropdownSearch.toLowerCase())
  )
  const filteredProductsForDropdown = products.filter(product =>
    product.name.toLowerCase().includes(productDropdownSearch.toLowerCase())
  )

  // Add item to cart function
  const addToCart = (item: any, type: "service" | "product") => {
    if (type === "service") {
      const newItem: ServiceItem = {
        id: Date.now().toString(),
        serviceId: item._id || item.id,
        staffId: "",
        quantity: 1,
        price: item.price || 0,
        discount: 0,
        total: item.price || 0,
      }
      setServiceItems([...serviceItems, newItem])
    } else if (type === "product") {
      const newItem: ProductItem = {
        id: Date.now().toString(),
        productId: item._id || item.id,
        staffId: "",
        quantity: 1,
        price: item.price || 0,
        discount: 0,
        total: item.price || 0,
      }
      setProductItems([...productItems, newItem])
    }
    
    // Clear search after adding
          // Clear search when item is added
          if (type === "service") {
            setServiceDropdownSearch("")
          } else {
            setProductDropdownSearch("")
          }
  }
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null)
  const [taxCalculator, setTaxCalculator] = useState<TaxCalculator | null>(null)
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
          // Filter out service-only products (only show retail and both)
          const sellableProducts = (response.data || []).filter((product: any) => {
            const productType = product.productType || 'retail'
            return productType === 'retail' || productType === 'both'
          })
          setProducts(sellableProducts)
          console.log('Products loaded:', response.data?.length || 0)
          console.log('Sellable products (retail + both):', sellableProducts.length)
        } else {
          console.log('Products API returned unsuccessful response:', response)
          setProducts([])
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([]) // Ensure products array is empty on error
      } finally {
        setLoadingProducts(false)
      }
    }

    const fetchStaff = async () => {
      try {
        console.log('Fetching staff from API...')
        const response = await StaffDirectoryAPI.getAll()
        console.log('Staff API response:', response)
        if (response.success) {
          // Filter for active staff members with appointment scheduling enabled
          const staffMembers = response.data.filter((user: any) => {
            const hasValidId = user._id || user.id
            const isActiveStaff = (user.role === 'staff' || user.role === 'manager' || user.role === 'admin') && 
              user.isActive === true && 
              user.allowAppointmentScheduling === true
            console.log(`User ${user.name}: ID=${hasValidId}, Active=${isActiveStaff}, AppointmentScheduling=${user.allowAppointmentScheduling}`)
            return hasValidId && isActiveStaff
          })
          setStaff(staffMembers)
          console.log('Active staff loaded:', staffMembers.length)
          console.log('Active staff members:', staffMembers.map(s => ({ name: s.name, id: s._id || s.id, allowAppointmentScheduling: s.allowAppointmentScheduling })))
        } else {
          console.error('Staff API returned error:', response.error)
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

    const fetchTaxSettings = async () => {
      try {
        console.log('Fetching tax settings from API...')
        const response = await SettingsAPI.getPaymentSettings()
        console.log('Tax settings API response:', response)
        if (response.success) {
          const taxSettingsData: TaxSettings = {
            enableTax: response.data.enableTax !== false,
            taxType: response.data.taxType || 'gst',
            serviceTaxRate: response.data.serviceTaxRate || 5,
            essentialProductRate: response.data.essentialProductRate || 5,
            intermediateProductRate: response.data.intermediateProductRate || 12,
            standardProductRate: response.data.standardProductRate || 18,
            luxuryProductRate: response.data.luxuryProductRate || 28,
            exemptProductRate: response.data.exemptProductRate || 0,
            cgstRate: response.data.cgstRate || 9,
            sgstRate: response.data.sgstRate || 9,
          }
          setTaxSettings(taxSettingsData)
          setTaxCalculator(createTaxCalculator(taxSettingsData))
          console.log('Tax settings loaded:', taxSettingsData)
        } else {
          console.error('Tax settings API returned error:', response.error)
        }
      } catch (error) {
        console.error('Failed to fetch tax settings:', error)
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
    fetchTaxSettings()
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

  // In production, prefill data should come from URL params or API
  // No localStorage dependency for critical business functionality

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
    console.log('🎯 Create new customer clicked!')
    console.log('🎯 Customer search value:', customerSearch)
    console.log('🎯 Current showNewCustomerDialog state:', showNewCustomerDialog)
    
    setNewCustomer({
      firstName: "",
      lastName: "",
      phone: customerSearch,
      email: "",
    })
    setShowNewCustomerDialog(true)
    setShowCustomerDropdown(false)
    
    console.log('🎯 Set showNewCustomerDialog to true')
  }

  // Handle saving new customer
  const handleSaveNewCustomer = async () => {
    if (!newCustomer.firstName) {
      toast({
        title: "Missing Information",
        description: "Please provide a first name.",
        variant: "destructive",
      })
      return
    }

    const customer: Client = {
      id: Date.now().toString(),
      name: newCustomer.lastName ? `${newCustomer.firstName} ${newCustomer.lastName}` : newCustomer.firstName,
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

  // Handle discount state flags
  useEffect(() => {
    if (discountPercentage > 0) {
      setIsGlobalDiscountActive(true)
      setIsValueDiscountActive(false)
    } else if (discountValue > 0) {
      setIsValueDiscountActive(true)
      setIsGlobalDiscountActive(false)
    } else {
      setIsGlobalDiscountActive(false)
      setIsValueDiscountActive(false)
    }
  }, [discountPercentage, discountValue])

  // Function to recalculate discounts
  const recalculateDiscounts = () => {
    console.log('🔄 Recalculating discounts...', { discountValue, discountPercentage, serviceItems: serviceItems.length, productItems: productItems.length })
    console.log('📋 Current service items:', serviceItems)
    console.log('📋 Current product items:', productItems)
    
    if (discountValue > 0) {
      // Value discount logic
      const serviceItemsWithGST = serviceItems.map(item => {
        const baseAmount = item.price * item.quantity
        const serviceTaxRate = taxSettings?.serviceTaxRate || 5
        const gstAmount = (baseAmount * serviceTaxRate) / 100
        return { ...item, totalWithGST: baseAmount + gstAmount }
      })
      
      const productItemsWithGST = productItems.map(item => {
        const baseAmount = item.price * item.quantity
        const product = products.find((p) => p._id === item.productId || p.id === item.productId)
        let productTaxRate = 18
        if (product?.taxCategory && taxSettings) {
          switch (product.taxCategory) {
            case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
            case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
            case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
            case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
            case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
          }
        }
        const gstAmount = (baseAmount * productTaxRate) / 100
        return { ...item, totalWithGST: baseAmount + gstAmount }
      })
      
      const totalPayableAmount = serviceItemsWithGST.reduce((sum, item) => sum + item.totalWithGST, 0) + 
                                productItemsWithGST.reduce((sum, item) => sum + item.totalWithGST, 0)
      
      if (totalPayableAmount > 0) {
        setServiceItems(prev => prev.map((item, index) => {
          const baseAmount = item.price * item.quantity
          const serviceTaxRate = taxSettings?.serviceTaxRate || 5
          const gstAmount = (baseAmount * serviceTaxRate) / 100
          const totalWithGST = baseAmount + gstAmount
          const proportionalDiscountValue = (totalWithGST / totalPayableAmount) * discountValue
          const proportionalDiscountPercentage = (proportionalDiscountValue / totalWithGST) * 100
          const finalTotal = totalWithGST - proportionalDiscountValue
          
          console.log(`🔧 Service item ${index + 1} calculation:`, {
            id: item.id,
            serviceId: item.serviceId,
            price: item.price,
            quantity: item.quantity,
            baseAmount,
            gstAmount,
            totalWithGST,
            proportionalDiscountValue,
            proportionalDiscountPercentage,
            finalTotal,
            totalPayableAmount
          })
          
          return { ...item, discount: proportionalDiscountPercentage, total: finalTotal }
        }))
        
        console.log('✅ Service items updated with new totals')
        
        setProductItems(prev => prev.map(item => {
          const baseAmount = item.price * item.quantity
          const product = products.find((p) => p._id === item.productId || p.id === item.productId)
          let productTaxRate = 18
          if (product?.taxCategory && taxSettings) {
            switch (product.taxCategory) {
              case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
              case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
              case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
              case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
              case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
            }
          }
          const gstAmount = (baseAmount * productTaxRate) / 100
          const totalWithGST = baseAmount + gstAmount
          const proportionalDiscountValue = (totalWithGST / totalPayableAmount) * discountValue
          const proportionalDiscountPercentage = (proportionalDiscountValue / totalWithGST) * 100
          const finalTotal = totalWithGST - proportionalDiscountValue
          return { ...item, discount: proportionalDiscountPercentage, total: finalTotal }
        }))
      }
    } else if (discountPercentage > 0) {
      // Percentage discount logic
      const serviceItemsWithGST = serviceItems.map(item => {
        const baseAmount = item.price * item.quantity
        const serviceTaxRate = taxSettings?.serviceTaxRate || 5
        const gstAmount = (baseAmount * serviceTaxRate) / 100
        return { ...item, totalWithGST: baseAmount + gstAmount }
      })
      
      const productItemsWithGST = productItems.map(item => {
        const baseAmount = item.price * item.quantity
        const product = products.find((p) => p._id === item.productId || p.id === item.productId)
        let productTaxRate = 18
        if (product?.taxCategory && taxSettings) {
          switch (product.taxCategory) {
            case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
            case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
            case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
            case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
            case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
          }
        }
        const gstAmount = (baseAmount * productTaxRate) / 100
        return { ...item, totalWithGST: baseAmount + gstAmount }
      })
      
      const totalPayableAmount = serviceItemsWithGST.reduce((sum, item) => sum + item.totalWithGST, 0) + 
                                productItemsWithGST.reduce((sum, item) => sum + item.totalWithGST, 0)
      
      const totalDiscountAmount = (totalPayableAmount * discountPercentage) / 100
      
      setServiceItems(prev => prev.map(item => {
        const baseAmount = item.price * item.quantity
        const serviceTaxRate = taxSettings?.serviceTaxRate || 5
        const gstAmount = (baseAmount * serviceTaxRate) / 100
        const totalWithGST = baseAmount + gstAmount
        const proportionalDiscountValue = (totalWithGST / totalPayableAmount) * totalDiscountAmount
        const proportionalDiscountPercentage = (proportionalDiscountValue / totalWithGST) * 100
        const finalTotal = totalWithGST - proportionalDiscountValue
        
        console.log('🔧 Service item calculation (percentage):', {
          name: item.serviceId,
          baseAmount,
          gstAmount,
          totalWithGST,
          proportionalDiscountValue,
          proportionalDiscountPercentage,
          finalTotal
        })
        
        return { ...item, discount: proportionalDiscountPercentage, total: finalTotal }
      }))
      
      setProductItems(prev => prev.map(item => {
        const baseAmount = item.price * item.quantity
        const product = products.find((p) => p._id === item.productId || p.id === item.productId)
        let productTaxRate = 18
        if (product?.taxCategory && taxSettings) {
          switch (product.taxCategory) {
            case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
            case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
            case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
            case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
            case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
          }
        }
        const gstAmount = (baseAmount * productTaxRate) / 100
        const totalWithGST = baseAmount + gstAmount
        const proportionalDiscountValue = (totalWithGST / totalPayableAmount) * totalDiscountAmount
        const proportionalDiscountPercentage = (proportionalDiscountValue / totalWithGST) * 100
        const finalTotal = totalWithGST - proportionalDiscountValue
        return { ...item, discount: proportionalDiscountPercentage, total: finalTotal }
      }))
    } else {
      // No discount - reset to GST-inclusive amounts
      setServiceItems(prev => prev.map(item => {
        const baseAmount = item.price * item.quantity
        const serviceTaxRate = taxSettings?.serviceTaxRate || 5
        const gstAmount = (baseAmount * serviceTaxRate) / 100
        return { ...item, discount: 0, total: baseAmount + gstAmount }
      }))
      
      setProductItems(prev => prev.map(item => {
        const baseAmount = item.price * item.quantity
        const product = products.find((p) => p._id === item.productId || p.id === item.productId)
        let productTaxRate = 18
        if (product?.taxCategory && taxSettings) {
          switch (product.taxCategory) {
            case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
            case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
            case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
            case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
            case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
          }
        }
        const gstAmount = (baseAmount * productTaxRate) / 100
        return { ...item, discount: 0, total: baseAmount + gstAmount }
      }))
    }
  }

  // Recalculate discounts when discount values or tax settings change
  useEffect(() => {
    recalculateDiscounts()
  }, [discountValue, discountPercentage, taxSettings])

  // Log when service items change
  useEffect(() => {
    console.log('🔄 Service items state changed:', serviceItems.map(item => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
      discount: item.discount
    })))
  }, [serviceItems])

  // Recalculate discounts when item properties change (but avoid infinite loops)
  useEffect(() => {
    if (discountValue > 0 || discountPercentage > 0) {
      // Use setTimeout to avoid infinite loops
      const timeoutId = setTimeout(() => {
        recalculateDiscounts()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [serviceItems.map(item => `${item.price}-${item.quantity}-${item.serviceId}`).join(','), 
       productItems.map(item => `${item.price}-${item.quantity}-${item.productId}`).join(',')])

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
      staffContributions: [],
    }
    setServiceItems([...serviceItems, newItem])
    
    // Recalculate discounts after adding new item
    setTimeout(() => {
      recalculateDiscounts()
    }, 0)
  }

  // Add product item
  const addProductItem = () => {
    // Check if products are still loading
    if (loadingProducts) {
      toast({
        title: "Loading Products",
        description: "Please wait while products are being loaded...",
        variant: "default",
      })
      return
    }
    
    // Check if there are any products available
    if (products.length === 0) {
      toast({
        title: "No Products Available",
        description: "Please add products to the inventory first.",
        variant: "destructive",
      })
      return
    }

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
    
    // Recalculate discounts after adding new item
    setTimeout(() => {
      recalculateDiscounts()
    }, 0)
  }

  // Update service item
  const updateServiceItem = (id: string, field: keyof ServiceItem, value: any) => {
    console.log('=== UPDATE SERVICE ITEM ===')
    console.log('Service ID:', id)
    console.log('Field:', field)
    console.log('Value:', value)
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

          // Calculate total with GST for services (without discount - discount will be applied by useEffect)
          const baseAmount = updatedItem.price * updatedItem.quantity
          const serviceTaxRate = taxSettings?.serviceTaxRate || 5
          const gstAmount = (baseAmount * serviceTaxRate) / 100
          
          // Only update total if no discount is active, otherwise let discount logic handle it
          if (discountValue === 0 && discountPercentage === 0) {
            updatedItem.total = baseAmount + gstAmount
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  // Update product item
  const updateProductItem = (id: string, field: keyof ProductItem, value: any) => {
    console.log('=== UPDATE PRODUCT ITEM ===')
    console.log('Product ID:', id)
    console.log('Field:', field)
    console.log('Value:', value)
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

          // Calculate total with GST for products
          const baseAmount = updatedItem.price * updatedItem.quantity
          
          // Add GST for products based on tax category
          let productTaxRate = 18 // default standard rate
          if (field === "productId" && value) {
            const product = products.find((p) => p._id === value || p.id === value)
            if (product?.taxCategory && taxSettings) {
              switch (product.taxCategory) {
                case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
                case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
                case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
                case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
                case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
              }
            }
          }
          
          const gstAmount = (baseAmount * productTaxRate) / 100
          
          // Only update total if no discount is active, otherwise let discount logic handle it
          if (discountValue === 0 && discountPercentage === 0) {
            updatedItem.total = baseAmount + gstAmount
          }

          console.log('Updated Product Item:', updatedItem)
          return updatedItem
        }
        return item
      }),
    )
    console.log('Product Items After Update:', productItems.map(p => ({ id: p.id, staffId: p.staffId })))
  }

  // Remove service item
  const removeServiceItem = (id: string) => {
    setServiceItems((items) => items.filter((item) => item.id !== id))
  }

  // Remove product item
  const removeProductItem = (id: string) => {
    setProductItems((items) => items.filter((item) => item.id !== id))
  }

  // Calculate totals (now includes GST in individual items)
  const serviceTotal = serviceItems.reduce((sum, item) => sum + item.total, 0)
  const productTotal = productItems.reduce((sum, item) => sum + item.total, 0)
  const subtotal = serviceTotal + productTotal
  const totalDiscount = discountValue + (subtotal * discountPercentage) / 100

  // Calculate tax breakdown for billing summary
  // Tax should be calculated on the discounted amount, not original price
  
  // Helper function to calculate discounted amount for an item
  const calculateDiscountedAmount = (baseAmount: number, taxRate: number) => {
    if (discountValue === 0 && discountPercentage === 0) {
      return baseAmount
    }
    
    // Calculate total payable amount (original prices + GST)
    const totalPayableAmount = serviceItems.reduce((total, serviceItem) => {
      const serviceBaseAmount = serviceItem.price * serviceItem.quantity
      const serviceTaxRate = taxSettings?.serviceTaxRate || 5
      const serviceGstAmount = (serviceBaseAmount * serviceTaxRate) / 100
      return total + serviceBaseAmount + serviceGstAmount
    }, 0) + productItems.reduce((total, productItem) => {
      const productBaseAmount = productItem.price * productItem.quantity
      const product = products.find((p) => p._id === productItem.productId || p.id === productItem.productId)
      let productTaxRate = 18
      if (product?.taxCategory && taxSettings) {
        switch (product.taxCategory) {
          case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
          case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
          case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
          case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
          case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
        }
      }
      const productGstAmount = (productBaseAmount * productTaxRate) / 100
      return total + productBaseAmount + productGstAmount
    }, 0)
    
    const itemAmountWithGST = baseAmount + (baseAmount * taxRate) / 100
    const totalDiscountAmount = discountValue + (totalPayableAmount * discountPercentage / 100)
    const proportionalDiscount = totalPayableAmount > 0 ? (itemAmountWithGST / totalPayableAmount) * totalDiscountAmount : 0
    const discountOnBaseAmount = proportionalDiscount * baseAmount / itemAmountWithGST
    
    return baseAmount - discountOnBaseAmount
  }
  
  // Calculate service tax on discounted amounts
  const serviceTax = serviceItems.reduce((sum, item) => {
    const baseAmount = item.price * item.quantity
    const serviceTaxRate = taxSettings?.serviceTaxRate || 5
    const discountedAmount = calculateDiscountedAmount(baseAmount, serviceTaxRate)
    const gstAmount = (discountedAmount * serviceTaxRate) / 100
    return sum + gstAmount
  }, 0)
  
  // Calculate product tax on discounted amounts
  const productTax = productItems.reduce((sum, item) => {
    const baseAmount = item.price * item.quantity
    const product = products.find((p) => p._id === item.productId || p.id === item.productId)
    let productTaxRate = 18
    if (product?.taxCategory && taxSettings) {
      switch (product.taxCategory) {
        case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
        case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
        case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
        case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
        case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
      }
    }
    const discountedAmount = calculateDiscountedAmount(baseAmount, productTaxRate)
    const gstAmount = (discountedAmount * productTaxRate) / 100
    return sum + gstAmount
  }, 0)

  const totalTax = serviceTax + productTax
  
  // Calculate subtotal excluding tax (discounted amounts)
  const subtotalExcludingTax = serviceItems.reduce((sum, item) => {
    const baseAmount = item.price * item.quantity
    const serviceTaxRate = taxSettings?.serviceTaxRate || 5
    const discountedAmount = calculateDiscountedAmount(baseAmount, serviceTaxRate)
    return sum + discountedAmount
  }, 0) + productItems.reduce((sum, item) => {
    const baseAmount = item.price * item.quantity
    const product = products.find((p) => p._id === item.productId || p.id === item.productId)
    let productTaxRate = 18
    if (product?.taxCategory && taxSettings) {
      switch (product.taxCategory) {
        case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
        case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
        case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
        case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
        case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
      }
    }
    const discountedAmount = calculateDiscountedAmount(baseAmount, productTaxRate)
    return sum + discountedAmount
  }, 0)
  
  const serviceCGST = serviceTax / 2
  const serviceSGST = serviceTax / 2
  const productCGST = productTax / 2
  const productSGST = productTax / 2

  // Grand total = subtotal + tip (GST already included in subtotal)
  const grandTotal = subtotal + tip
  const roundedTotal = Math.round(grandTotal)
  const roundOff = roundedTotal - grandTotal
  const totalPaid = cashAmount + cardAmount + onlineAmount
  const change = totalPaid - roundedTotal

  // Generate receipt number with proper increment
  const generateReceiptNumber = async () => {
    try {
      console.log('=== RECEIPT NUMBER GENERATION DEBUG ===')
      
      // First, increment the receipt number atomically
      const incrementResponse = await SettingsAPI.incrementReceiptNumber()
      if (incrementResponse.success) {
        const newReceiptNumber = incrementResponse.data.receiptNumber
        console.log('✅ Receipt number incremented successfully:', newReceiptNumber)
        
        // Get fresh business settings to get the prefix
        const settingsResponse = await SettingsAPI.getBusinessSettings()
        if (settingsResponse.success) {
          const currentSettings = settingsResponse.data
        const prefix = currentSettings?.invoicePrefix || currentSettings?.receiptPrefix || "INV"
        
        console.log('Fresh business settings:', currentSettings)
          console.log('New receipt number from increment:', newReceiptNumber)
        console.log('Final prefix used:', prefix)
          
          const formattedReceiptNumber = `${prefix}-${newReceiptNumber.toString().padStart(6, '0')}`
          console.log('Final receipt number generated:', formattedReceiptNumber)
          
          // Update local state with new receipt number
          setBusinessSettings((prev: any) => ({
            ...prev,
            receiptNumber: newReceiptNumber
          }))
          
          return formattedReceiptNumber
        }
      } else {
        console.error('Failed to increment receipt number:', incrementResponse.error)
        throw new Error(incrementResponse.error || 'Failed to increment receipt number')
      }
    } catch (error) {
      console.error('Failed to generate receipt number:', error)
    
    // Fallback to cached settings if API call fails
    const prefix = posSettings?.invoicePrefix || businessSettings?.invoicePrefix || businessSettings?.receiptPrefix || "INV"
      const receiptNumber = (posSettings?.receiptNumber || businessSettings?.receiptNumber || 1)
    
    console.log('=== FALLBACK RECEIPT NUMBER GENERATION ===')
    console.log('Using cached settings - posSettings:', posSettings)
    console.log('Using cached settings - businessSettings:', businessSettings)
    console.log('Final prefix used:', prefix)
    console.log('Final receipt number used:', receiptNumber)
      
      const formattedReceiptNumber = `${prefix}-${receiptNumber.toString().padStart(6, '0')}`
      console.log('Final receipt number generated (fallback):', formattedReceiptNumber)
      
      return formattedReceiptNumber
    }
  }

  // Handle checkout
  const handleCheckout = async () => {
    console.log('🚀 handleCheckout function called!')
    console.log('🚀 selectedCustomer:', selectedCustomer)
    console.log('🚀 customerSearch:', customerSearch)
    console.log('🚀 isProcessing:', isProcessing)
    
    // Prevent multiple simultaneous checkouts
    if (isProcessing) {
      console.log('❌ Checkout already in progress, ignoring')
      return
    }
    
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

    // Validate that we have a valid total amount
    if (roundedTotal <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Total amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    // Validate payment amounts don't exceed total
    if (totalPaid > roundedTotal) {
      toast({
        title: "Payment Error",
        description: `Total paid (₹${totalPaid.toFixed(2)}) cannot exceed total amount (₹${roundedTotal.toFixed(2)})`,
        variant: "destructive",
      })
      return
    }

    // Validate that all services have staff assigned
    const servicesWithoutStaff = validServiceItems.filter((item) => !item.staffId)
    if (servicesWithoutStaff.length > 0) {
      toast({
        title: "Staff Required",
        description: "Please select staff for all services before checkout",
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
          totalSpent: roundedTotal,
          createdAt: new Date().toISOString(),
          status: "active",
        }
        // Add to clients array
        clients.push(customer)
      } else if (customer) {
        // Update existing customer stats
        customer.totalVisits = (customer.totalVisits || 0) + 1
        customer.totalSpent = (customer.totalSpent || 0) + roundedTotal
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
      console.log('=== CURRENT STATE BEFORE RECEIPT GENERATION ===')
      console.log('Service Items State:', serviceItems.map(s => ({ id: s.id, staffId: s.staffId, staffContributions: s.staffContributions })))
      console.log('Product Items State:', productItems.map(p => ({ id: p.id, staffId: p.staffId })))
      console.log('Staff Data:', staff.map(s => ({ id: s._id || s.id, name: s.name })))
      
      // Create receipt items
      const receiptItems: any[] = [
        ...validServiceItems.map((item) => {
          const service = services.find((s) => s._id === item.serviceId || s.id === item.serviceId)
          const staffMember = staff.find((s) => s._id === item.staffId || s.id === item.staffId)
          console.log('=== SERVICE RECEIPT GENERATION ===')
          console.log('Service item:', { id: item.id, serviceId: item.serviceId, staffId: item.staffId })
          console.log('Service lookup:', { serviceId: item.serviceId, foundService: service?.name, allServices: services.map(s => ({ id: s._id || s.id, name: s.name })) })
          console.log('Staff lookup:', { staffId: item.staffId, foundStaff: staffMember?.name, allStaff: staff.map(s => ({ id: s._id || s.id, name: s.name })) })
          
          // Handle staff contributions
          let staffContributions = item.staffContributions
          if (!staffContributions && item.staffId) {
            // Legacy support - create single staff contribution
            staffContributions = [{
              staffId: item.staffId,
              staffName: staffMember?.name || "Unassigned Staff",
              percentage: 100,
              amount: item.total
            }]
          }
          
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
            staffContributions: staffContributions
          }
        }),
        ...validProductItems.map((item) => {
          const product = products.find((p) => p._id === item.productId || p.id === item.productId)
          const staffMember = staff.find((s) => s._id === item.staffId || s.id === item.staffId)
          console.log('=== PRODUCT RECEIPT GENERATION ===')
          console.log('Product item:', { id: item.id, productId: item.productId, staffId: item.staffId })
          console.log('Product lookup:', { productId: item.productId, foundProduct: product?.name, allProducts: products.map(p => ({ id: p._id || p.id, name: p.name })) })
          console.log('Product staff lookup:', { staffId: item.staffId, foundStaff: staffMember?.name, allStaff: staff.map(s => ({ id: s._id || s.id, name: s.name })) })
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
        if (onlineAmount > 0) payments.push({ type: "online", amount: onlineAmount })

      // Get the primary staff member (first staff member from items)
      const primaryStaff = receiptItems.length > 0 ? {
        staffId: receiptItems[0].staffId,
        staffName: receiptItems[0].staffName
      } : null
      
      console.log('=== STAFF ASSIGNMENT DEBUG ===')
      console.log('Service items before processing:', serviceItems)
      console.log('Staff list:', staff)
      console.log('Receipt items:', receiptItems)
      console.log('Primary staff:', primaryStaff)
      console.log('First item staff info:', receiptItems[0] ? {
        staffId: receiptItems[0].staffId,
        staffName: receiptItems[0].staffName
      } : 'No items')
      
      // Calculate tax breakdown from individual items (GST already included in totals)
      let calculatedTax = 0
      let calculatedTotal = subtotal + tip
      let taxBreakdown = { cgst: 0, sgst: 0, igst: 0 }

      // Calculate tax breakdown from individual items
      const serviceTax = serviceItems.reduce((sum, item) => {
        const baseAmount = item.price * item.quantity
        const discountAmount = (baseAmount * item.discount) / 100
        const discountedAmount = baseAmount - discountAmount
        const serviceTaxRate = taxSettings?.serviceTaxRate || 5
        const gstAmount = (discountedAmount * serviceTaxRate) / 100
        return sum + gstAmount
      }, 0)

      const productTax = productItems.reduce((sum, item) => {
        const baseAmount = item.price * item.quantity
        const discountAmount = (baseAmount * item.discount) / 100
        const discountedAmount = baseAmount - discountAmount
        const product = products.find((p) => p._id === item.productId || p.id === item.productId)
        let productTaxRate = 18 // default standard rate
        if (product?.taxCategory && taxSettings) {
          switch (product.taxCategory) {
            case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
            case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
            case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
            case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
            case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
          }
        }
        const gstAmount = (discountedAmount * productTaxRate) / 100
        return sum + gstAmount
      }, 0)

      calculatedTax = serviceTax + productTax
      taxBreakdown = {
        cgst: calculatedTax / 2,
        sgst: calculatedTax / 2,
        igst: 0
      }

      // Update receipt items with tax information
      receiptItems.forEach((item) => {
        if (item.type === 'service') {
          const baseAmount = item.price * item.quantity
          const discountAmount = (baseAmount * item.discount) / 100
          const discountedAmount = baseAmount - discountAmount
          const serviceTaxRate = taxSettings?.serviceTaxRate || 5
          const gstAmount = (discountedAmount * serviceTaxRate) / 100
          item.taxAmount = gstAmount
          item.cgst = gstAmount / 2
          item.sgst = gstAmount / 2
          item.totalWithTax = item.total
        } else if (item.type === 'product') {
          const baseAmount = item.price * item.quantity
          const discountAmount = (baseAmount * item.discount) / 100
          const discountedAmount = baseAmount - discountAmount
          const product = products.find((p) => p._id === item.productId || p.id === item.productId)
          let productTaxRate = 18
          if (product?.taxCategory && taxSettings) {
            switch (product.taxCategory) {
              case 'essential': productTaxRate = taxSettings.essentialProductRate || 5; break
              case 'intermediate': productTaxRate = taxSettings.intermediateProductRate || 12; break
              case 'standard': productTaxRate = taxSettings.standardProductRate || 18; break
              case 'luxury': productTaxRate = taxSettings.luxuryProductRate || 28; break
              case 'exempt': productTaxRate = taxSettings.exemptProductRate || 0; break
            }
          }
          const gstAmount = (discountedAmount * productTaxRate) / 100
          item.taxAmount = gstAmount
          item.cgst = gstAmount / 2
          item.sgst = gstAmount / 2
          item.totalWithTax = item.total
        }
      })
      
      // Create sale in backend database for inventory tracking FIRST
      // Generate receipt number only when we're about to create the sale
      try {
      // Generate receipt number first
        let receiptNumber
        try {
          receiptNumber = await generateReceiptNumber()
          if (!receiptNumber) {
            throw new Error('Failed to generate receipt number')
          }
          console.log('✅ Receipt number generated successfully:', receiptNumber)
        } catch (error) {
          console.error('❌ Failed to generate receipt number:', error)
          toast({
            title: "Receipt Generation Failed",
            description: "Failed to generate receipt number. Please try again.",
            variant: "destructive",
          })
          return
        }

        // Create sale data with the generated receipt number
        const saleData = {
          billNo: receiptNumber,
          customerId: getCustomerId(customer),
          customerName: customer!.name,
          customerPhone: customer!.phone,
          items: [
            ...validServiceItems.map((item: any) => {
              const service = services.find((s) => s._id === item.serviceId || s.id === item.serviceId)
              const staffMember = staff.find((s) => s._id === item.staffId || s.id === item.staffId)
              return {
                serviceId: item.serviceId,
                productId: null,
                name: service?.name || 'Unknown Service',
                type: 'service' as const,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                staffId: item.staffId || '',
                staffName: staffMember?.name || '',
                staffContributions: item.staffContributions || []
              }
            }),
            ...validProductItems.map((item: any) => {
              const product = products.find((p) => p._id === item.productId || p.id === item.productId)
              const staffMember = staff.find((s) => s._id === item.staffId || s.id === item.staffId)
              return {
                productId: item.productId,
                serviceId: null,
                name: product?.name || 'Unknown Product',
                type: 'product' as const,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                staffId: item.staffId || '',
                staffName: staffMember?.name || '',
                staffContributions: item.staffContributions || []
              }
            })
          ],
          // Sale model required fields
          netTotal: subtotal,
          taxAmount: calculatedTax,
          grossTotal: calculatedTotal,
          discount: totalDiscount || 0,
          discountType: 'percentage',
          // Payment status tracking
          paymentStatus: {
            totalAmount: calculatedTotal,
            paidAmount: totalPaid,
            remainingAmount: calculatedTotal - totalPaid,
            dueDate: new Date()
          },
          status: totalPaid === 0 ? 'unpaid' : (totalPaid < calculatedTotal ? 'partial' : 'completed'),
          paymentMode: payments.map(p => p.type).join(', '),
          payments: payments.map(p => ({
            mode: p.type.charAt(0).toUpperCase() + p.type.slice(1), // Capitalize first letter
            amount: p.amount
          })),
          staffId: primaryStaff?.staffId || staff[0]?._id || staff[0]?.id || "",
          staffName: primaryStaff?.staffName || staff[0]?.name || "Unassigned Staff",
          notes: remarks || '',
          date: selectedDate.toISOString()
        }

        console.log('💾 Creating sale in backend:', saleData)
        console.log('💾 Sale data items:', saleData.items)
        console.log('💾 Sale data validation:', {
          hasBillNo: !!saleData.billNo,
          hasCustomerName: !!saleData.customerName,
          hasItems: !!saleData.items && saleData.items.length > 0,
          hasGrossTotal: !!saleData.grossTotal,
          itemsCount: saleData.items?.length || 0
        })
        
        // Use the SalesAPI for proper authentication and error handling
        try {
          console.log('🚀 About to call SalesAPI.create with data:', saleData)
          console.log('🔐 Current auth token:', localStorage.getItem('salon-auth-token') ? 'Present' : 'Missing')
          const result = await SalesAPI.create(saleData)
          console.log('📊 SalesAPI.create response:', result)
          
          if (result.success) {
            console.log('✅ Sale created successfully in backend:', result)
            
            // Now that backend sale is successful, create and store the receipt locally
      const receipt: any = {
        id: Date.now().toString(),
        receiptNumber: receiptNumber,
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
        roundOff: calculatedTotal - (subtotal - totalDiscount + calculatedTax + tip),
        total: calculatedTotal,
        taxBreakdown: taxBreakdown,
        payments: payments,
        staffId: primaryStaff?.staffId || staff[0]?._id || staff[0]?.id || "",
        staffName: primaryStaff?.staffName || staff[0]?.name || "Unassigned Staff",
        notes: remarks,
      }

            // Store the receipt locally
      addReceipt(receipt)
      setCurrentReceipt(receipt)
            console.log('✅ Receipt stored locally with number:', receipt.receiptNumber)
            
            // Refresh products to get updated stock levels from backend
            if (validProductItems.length > 0) {
              console.log('🔄 Refreshing product list to get updated stock levels...')
              try {
                const refreshResponse = await ProductsAPI.getAll()
                if (refreshResponse.success) {
                  const sellableProducts = (refreshResponse.data || []).filter((product: any) => {
                    const productType = product.productType || 'retail'
                    return productType === 'retail' || productType === 'both'
                  })
                  setProducts(sellableProducts)
                  console.log('✅ Product list refreshed with updated stock levels')
                }
              } catch (refreshError) {
                console.warn('⚠️ Failed to refresh product list:', refreshError)
              }
            }

            // Open receipt in new tab
            try {
        const receiptUrl = `/receipt/${receipt.receiptNumber}?data=${encodeURIComponent(JSON.stringify(receipt))}&t=${Date.now()}`
      console.log('🎯 Opening receipt in new tab:', receiptUrl)
              
              const newWindow = window.open(receiptUrl, '_blank')
              if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                console.warn('⚠️ Popup was blocked, showing fallback message')
                toast({
                  title: "Receipt Generated",
                  description: `Receipt #${receipt.receiptNumber} created successfully. Please check the receipts page.`,
                })
              } else {
                console.log('✅ Receipt opened successfully in new tab')
              }
            } catch (error) {
              console.error('❌ Error opening receipt:', error)
              toast({
                title: "Receipt Generated",
                description: `Receipt #${receipt.receiptNumber} created successfully. Please check the receipts page.`,
              })
            }
          } else {
            console.error('❌ Failed to create sale in backend:', result.error)
                  toast({
              title: "Sale Creation Failed",
              description: result.error || "Failed to create sale. Please try again.",
                    variant: "destructive",
                  })
            return
          }
        } catch (apiError: any) {
          console.error('💥 SalesAPI.create threw an error:', apiError)
          console.error('💥 Error details:', {
            message: apiError?.message,
            status: apiError?.response?.status,
            statusText: apiError?.response?.statusText,
            data: apiError?.response?.data
          })
          
          // Show error toast to user
                  toast({
            title: "Sale Creation Failed",
            description: apiError?.response?.data?.error || apiError?.message || "Failed to create sale. Please try again.",
                    variant: "destructive",
                  })
          
          // Don't proceed with receipt or form reset if backend fails
          return
        }
      } catch (error) {
        console.error('❌ Error creating sale in backend:', error)
        
        // Show error toast to user
            toast({
          title: "Sale Creation Failed",
          description: "Failed to create sale. Please try again.",
              variant: "destructive",
            })
        
        // Don't proceed with receipt or form reset if backend fails
        return
      }
      

      // Reset form
      resetForm()
    } catch (error: any) {
      console.error('❌ Checkout failed:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      let errorMessage = "An error occurred during checkout"
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast({
        title: "Checkout Failed",
        description: errorMessage,
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
    setIsGlobalDiscountActive(false)
    setIsValueDiscountActive(false)
    setCashAmount(0)
    setCardAmount(0)
    setOnlineAmount(0)
    setRemarks("")
    setConfirmUnpaid(false)
    setShowTipModal(false)
    setTempTipAmount(0)
  }

  // Tip modal handlers
  const handleTipClick = () => {
    setTempTipAmount(tip)
    setShowTipModal(true)
  }

  const handleTipCancel = () => {
    setShowTipModal(false)
    setTempTipAmount(0)
  }

  const handleTipOk = () => {
    if (tempTipAmount > 0) {
      setTip(tempTipAmount)
    } else {
      setTip(0)
    }
    setShowTipModal(false)
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
        {/* Simple HTML Modal for New Customer */}
        {showNewCustomerDialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setShowNewCustomerDialog(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 border-4 border-blue-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Create New Customer</h2>
                <button 
                  onClick={() => setShowNewCustomerDialog(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">Add a new customer to your salon database.</p>
              <div className="space-y-4">
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
                    <Label className="text-sm font-medium text-gray-700">Last Name</Label>
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
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewCustomerDialog(false)} 
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveNewCustomer} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Customer
                </Button>
              </div>
            </div>
          </div>
        )}

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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-white/80 backdrop-blur-sm pr-96">
        <div className="p-8 space-y-8 max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Quick Sale
              </h2>
              <p className="text-muted-foreground">Create and process sales quickly and efficiently</p>
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
              <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
                <div className="grid grid-cols-[2fr_3fr_120px_100px_100px_100px_40px] gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 font-semibold text-sm text-gray-700 border-b sticky top-0 bg-white z-10">
                  <div>Service *</div>
                  <div>Staff *</div>
                  <div>Qty</div>
                  <div>Price (₹)</div>
                  <div>Disc. (%)</div>
                  <div>Total (₹)</div>
                  <div></div>
                </div>

                <div style={{ overflow: 'visible' }}>
                  {serviceItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_3fr_120px_100px_100px_100px_40px] gap-4 p-4 border-b last:border-b-0 items-center hover:bg-gray-50/50 transition-all duration-200"
                  >
                    <div className="relative">
                      {item.serviceId ? (
                        <div className="flex items-center justify-between h-8 px-3 py-1 bg-muted rounded-md text-sm">
                          <span className="truncate">
                            {services.find(s => (s._id || s.id) === item.serviceId)?.name || 'Unknown Service'}
                          </span>
                          <button
                            onClick={() => updateServiceItem(item.id, "serviceId", "")}
                            className="ml-2 h-4 w-4 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Search services..."
                            value={serviceDropdownSearch}
                            onChange={(e) => setServiceDropdownSearch(e.target.value)}
                            className="h-8 pl-7 pr-8 text-sm"
                            onFocus={(e) => e.target.select()}
                          />
                          {serviceDropdownSearch && (
                            <button
                              onClick={() => setServiceDropdownSearch("")}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                      {serviceDropdownSearch && (
                        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white border border-gray-200 rounded-md shadow-lg" style={{ maxHeight: 'none', overflow: 'visible' }}>
                          {loadingServices ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">Loading services...</div>
                          ) : (
                            <>
                              {filteredServicesForDropdown.length === 0 ? (
                                <div className="p-2 text-center text-sm text-muted-foreground">
                                  No services found matching "{serviceDropdownSearch}"
                                </div>
                              ) : (
                                filteredServicesForDropdown.map((service) => (
                                  <div
                                    key={service._id || service.id}
                                    className="p-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                                    onClick={() => {
                                      updateServiceItem(item.id, "serviceId", service._id || service.id)
                                      setServiceDropdownSearch("")
                                    }}
                                  >
                                    <div className="font-medium">{service.name}</div>
                                    <div className="text-xs text-muted-foreground">{service.duration} min - {formatCurrency(service.price)}</div>
                                  </div>
                                ))
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <MultiStaffSelector
                      key={`service-${item.id}-staff`}
                      staffList={staff}
                      serviceTotal={item.total}
                      onStaffContributionsChange={(contributions) => {
                        console.log('=== MULTI STAFF SELECTOR CALLBACK (SERVICE) ===')
                        console.log('Item ID:', item.id)
                        console.log('Contributions:', contributions)
                        updateServiceItem(item.id, "staffContributions", contributions)
                        // Also update staffId for backward compatibility (use first staff member)
                        if (contributions.length > 0) {
                          console.log('Setting staffId to:', contributions[0].staffId)
                          updateServiceItem(item.id, "staffId", contributions[0].staffId)
                        } else {
                          console.log('Clearing staffId')
                          updateServiceItem(item.id, "staffId", "")
                        }
                      }}
                      initialContributions={item.staffContributions || []}
                      disabled={loadingStaff}
                    />

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
                      value={isGlobalDiscountActive ? discountPercentage : item.discount}
                      onChange={(e) => updateServiceItem(item.id, "discount", Number(e.target.value))}
                      className={`h-8 ${(isGlobalDiscountActive || isValueDiscountActive) ? 'bg-amber-50 border-amber-200' : ''}`}
                      disabled={isGlobalDiscountActive || isValueDiscountActive}
                      placeholder={(isGlobalDiscountActive || isValueDiscountActive) ? "Global discount" : "0"}
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
              <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
                <div className="grid grid-cols-[2fr_3fr_120px_100px_100px_100px_40px] gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 font-semibold text-sm text-gray-700 border-b sticky top-0 bg-white z-10">
                  <div>Product *</div>
                  <div>Staff *</div>
                  <div>Qty</div>
                  <div>Price (₹)</div>
                  <div>Disc. (%)</div>
                  <div>Total (₹)</div>
                  <div></div>
                </div>

                <div style={{ overflow: 'visible' }}>
                  {productItems.map((item) => {
                  console.log('=== RENDERING PRODUCT ITEM ===')
                  console.log('Product item ID:', item.id)
                  console.log('Product item staffId:', item.staffId)
                  return (
                  <div key={item.id} className="space-y-2">
                    <div className="grid grid-cols-[2fr_3fr_120px_100px_100px_100px_40px] gap-4 p-4 border-b last:border-b-0 items-center hover:bg-emerald-50/30 transition-all duration-200">
                      <div className="relative">
                        {item.productId ? (
                          <div className="flex items-center justify-between h-8 px-3 py-1 bg-muted rounded-md text-sm">
                            <span className="truncate">
                              {products.find(p => (p._id || p.id) === item.productId)?.name || 'Unknown Product'}
                            </span>
                            <button
                              onClick={() => updateProductItem(item.id, "productId", "")}
                              className="ml-2 h-4 w-4 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              placeholder="Search products..."
                              value={productDropdownSearch}
                              onChange={(e) => setProductDropdownSearch(e.target.value)}
                              className="h-8 pl-7 pr-8 text-sm"
                              onFocus={(e) => e.target.select()}
                            />
                            {productDropdownSearch && (
                              <button
                                onClick={() => setProductDropdownSearch("")}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground hover:text-foreground"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )}
                        {productDropdownSearch && (
                          <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white border border-gray-200 rounded-md shadow-lg" style={{ maxHeight: 'none', overflow: 'visible' }}>
                            {loadingProducts ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">Loading products...</div>
                            ) : (
                              <>
                                {filteredProductsForDropdown.length === 0 ? (
                                  <div className="p-2 text-center text-sm text-muted-foreground">
                                    No products found matching "{productDropdownSearch}"
                                  </div>
                                ) : (
                                  filteredProductsForDropdown.map((product) => (
                                    <div
                                      key={product._id || product.id}
                                      className="p-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                                      onClick={() => {
                                        updateProductItem(item.id, "productId", product._id || product.id)
                                        setProductDropdownSearch("")
                                      }}
                                    >
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-xs text-muted-foreground">Stock: {product.stock} - {formatCurrency(product.price)}</div>
                                    </div>
                                  ))
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <Select
                        key={`product-${item.id}-staff`}
                        value={item.staffId}
                        onValueChange={(value) => {
                          console.log('=== PRODUCT STAFF SELECTION ===')
                          console.log('Product ID:', item.id)
                          console.log('Selected Staff ID:', value)
                          console.log('Available Staff:', staff.map(s => ({ id: s._id || s.id, name: s.name })))
                          console.log('Current Product Items Before Update:', productItems.map(p => ({ id: p.id, staffId: p.staffId })))
                          updateProductItem(item.id, "staffId", value)
                          console.log('Product staff selection completed for:', item.id)
                        }}
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
                                    {member.name}
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
                        value={isGlobalDiscountActive ? discountPercentage : item.discount}
                        onChange={(e) => updateProductItem(item.id, "discount", Number(e.target.value))}
                        className={`h-8 ${(isGlobalDiscountActive || isValueDiscountActive) ? 'bg-amber-50 border-amber-200' : ''}`}
                        disabled={isGlobalDiscountActive || isValueDiscountActive}
                        placeholder={(isGlobalDiscountActive || isValueDiscountActive) ? "Global discount" : "0"}
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
                  )})}
                </div>
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
            <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Discounts & Offers</h3>
              {(isGlobalDiscountActive || isValueDiscountActive) && (
                <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  ⚠️ {isValueDiscountActive ? 'Value discount active' : 'Global discount active'} - Individual discounts disabled
                </div>
              )}
            </div>
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
                    className={`pr-8 ${isValueDiscountActive ? 'bg-amber-50 border-amber-200' : ''}`}
                    placeholder="0"
                    disabled={isValueDiscountActive}
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

      {/* Billing Summary Sidebar - Fixed Position */}
      <div className="w-96 bg-white border-l border-gray-100 shadow-xl h-[calc(100vh-5rem)] flex flex-col fixed right-0 top-20 z-50">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 bg-white flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Billing Summary</h3>
          <p className="text-sm text-gray-500 mt-1">Review and complete the sale</p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="px-6 py-4 space-y-2 flex-1">
            {/* Order Summary - Modern */}
            <div className="bg-gray-50/50 rounded-xl p-2 space-y-1 border border-gray-200">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">Sub Total</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotalExcludingTax)}</span>
              </div>
              
              {/* Service Tax Breakdown */}
              {serviceTax > 0 && (
                <>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">CGST</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(serviceCGST)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">SGST</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(serviceSGST)}</span>
                  </div>
                </>
              )}
              
              {/* Product Tax Breakdown */}
              {productTax > 0 && (
                <>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">CGST</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(productCGST)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">SGST</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(productSGST)}</span>
                  </div>
                </>
              )}
              
              {(discountValue > 0 || discountPercentage > 0) && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="text-sm font-medium text-red-500">-{formatCurrency(discountValue + (subtotal * discountPercentage / 100))}</span>
                </div>
              )}
              
              {Math.abs(roundOff) > 0.01 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Round Off</span>
                  <span className="font-medium text-gray-700">{formatCurrency(roundOff)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Grand Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(roundedTotal)}</span>
                </div>
              </div>
            </div>

            {/* Tip - Modern Style */}
            <div className="flex items-center justify-between py-2">
              <button
                onClick={handleTipClick}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition-colors"
              >
                Add Tip
              </button>
              {tip > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{formatCurrency(tip)}</span>
                  <button
                    onClick={handleTipClick}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    title="Edit tip amount"
                  >
                    <Pencil className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
              )}
            </div>

            {/* Change Display - Modern */}
            <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-700">Change</span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(change)}</span>
              </div>
            </div>

            {/* Remarks - Modern */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks..."
                className="h-12 text-sm resize-none rounded-lg border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>

            {/* Payment Section - Modern */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-base font-semibold text-gray-900">Payable Amount</span>
                <span className="text-xl font-bold text-indigo-600">{formatCurrency(roundedTotal)}</span>
              </div>

              {/* Payment Methods - Modern Grid */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Payment Methods</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Cash */}
                  <div className="flex flex-col items-center gap-1 p-2 bg-green-50/50 rounded-xl border border-green-200 hover:bg-green-50 transition-colors">
                    <span className="text-sm font-medium text-green-700">Cash</span>
                    <Input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(Number(e.target.value))}
                      className="w-full h-8 text-sm border-green-300 text-center rounded-lg focus:border-green-400 focus:ring-green-200"
                      placeholder="0"
                    />
                  </div>

                  {/* Card */}
                  <div className="flex flex-col items-center gap-1 p-2 bg-blue-50/50 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors">
                    <span className="text-sm font-medium text-blue-700">Card</span>
                    <Input
                      type="number"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(Number(e.target.value))}
                      className="w-full h-8 text-sm border-blue-300 text-center rounded-lg focus:border-blue-400 focus:ring-blue-200"
                      placeholder="0"
                    />
                  </div>

                  {/* Online */}
                  <div className="flex flex-col items-center gap-1 p-2 bg-purple-50/50 rounded-xl border border-purple-200 hover:bg-purple-50 transition-colors">
                    <span className="text-sm font-medium text-purple-700">Online</span>
                    <Input
                      type="number"
                      value={onlineAmount}
                      onChange={(e) => setOnlineAmount(Number(e.target.value))}
                      className="w-full h-8 text-sm border-purple-300 text-center rounded-lg focus:border-purple-400 focus:ring-purple-200"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Processing Fees - Modern */}
              {paymentSettings?.enableProcessingFees && (cardAmount > 0 || onlineAmount > 0) && (
                <div className="p-2 bg-amber-50/50 rounded-xl border border-amber-200">
                  <div className="text-sm font-semibold text-amber-800 mb-1">Processing Fees</div>
                  {cardAmount > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-amber-700">Card ({paymentSettings?.processingFee || 2.9}%)</span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency((cardAmount * (paymentSettings?.processingFee || 2.9)) / 100)}
                      </span>
                    </div>
                  )}
                  {onlineAmount > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-amber-700">Online ({paymentSettings?.processingFee || 2.9}%)</span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency((onlineAmount * (paymentSettings?.processingFee || 2.9)) / 100)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Paid - Modern */}
              <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-emerald-700">Total Paid</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Modern */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                console.log('🔍 Checkout button clicked!')
                console.log('🔍 roundedTotal:', roundedTotal)
                console.log('🔍 totalPaid:', totalPaid)
                console.log('🔍 isProcessing:', isProcessing)
                
                if (isProcessing) {
                  console.log('❌ Already processing, ignoring click')
                  return
                }
                
                if (roundedTotal <= 0) {
                  toast({
                    title: "Invalid Amount",
                    description: "Total amount must be greater than 0",
                    variant: "destructive",
                  })
                  return
                }
                
                if (totalPaid < roundedTotal) {
                  console.log('💰 Opening payment modal for partial/unpaid bill')
                  setShowPaymentModal(true)
                } else {
                  console.log('✅ Full payment, proceeding with checkout')
                  handleCheckout()
                }
              }} 
              disabled={isProcessing || roundedTotal <= 0} 
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Checkout
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={resetForm} 
              className="flex-1 h-10 text-sm font-medium rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-indigo-600" />
              Add Tip
            </DialogTitle>
            <DialogDescription>
              Enter the tip amount for this transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tip-amount" className="text-sm font-medium">
                Tip Amount
              </Label>
              <Input
                id="tip-amount"
                type="number"
                value={tempTipAmount}
                onChange={(e) => setTempTipAmount(Number(e.target.value))}
                placeholder="0"
                className="text-lg"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleTipCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTipOk}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Customer Modal */}
      {showNewCustomerDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Header with Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#8b5cf6',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  👤
                </div>
                <div>
                  <h2 style={{
                    color: '#111827',
                    fontSize: '28px',
                    fontWeight: '700',
                    margin: 0,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Create New Customer
                  </h2>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    margin: '4px 0 0 0',
                    fontWeight: '500'
                  }}>
                    Add a new customer to your salon database
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewCustomerDialog(false)}
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '12px',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontWeight: 'bold'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.backgroundColor = '#ef4444'
                  target.style.color = 'white'
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.backgroundColor = '#f9fafb'
                  target.style.color = '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Form Fields */}
            <div style={{marginBottom: '28px'}}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    placeholder="Enter first name"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '15px',
                      backgroundColor: '#fafafa',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b5cf6'
                      e.target.style.backgroundColor = 'white'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.backgroundColor = '#fafafa'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    placeholder="Enter last name"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '15px',
                      backgroundColor: '#fafafa',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b5cf6'
                      e.target.style.backgroundColor = 'white'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.backgroundColor = '#fafafa'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Enter phone number"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#8b5cf6'
                    e.target.style.backgroundColor = 'white'
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.backgroundColor = '#fafafa'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#8b5cf6'
                    e.target.style.backgroundColor = 'white'
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.backgroundColor = '#fafafa'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '16px',
              paddingTop: '20px',
              borderTop: '2px solid #f3f4f6'
            }}>
              <button 
                onClick={() => setShowNewCustomerDialog(false)}
                style={{
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '100px'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.backgroundColor = '#f9fafb'
                  target.style.borderColor = '#d1d5db'
                  target.style.color = '#374151'
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.backgroundColor = 'white'
                  target.style.borderColor = '#e5e7eb'
                  target.style.color = '#6b7280'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNewCustomer}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '140px',
                  boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.25)'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'translateY(-2px)'
                  target.style.boxShadow = '0 8px 25px 0 rgba(139, 92, 246, 0.35)'
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'translateY(0)'
                  target.style.boxShadow = '0 4px 14px 0 rgba(139, 92, 246, 0.25)'
                }}
              >
                ✨ Create Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-5 w-5 text-orange-600">⚠️</div>
              Payment Confirmation Required
            </DialogTitle>
            <DialogDescription>
              Please review the payment details before proceeding with checkout.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bill Total:</span>
                  <span className="font-medium">₹{roundedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium text-green-600">₹{totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-semibold">Remaining:</span>
                  <span className="font-bold text-red-600">₹{(roundedTotal - totalPaid).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 text-orange-600">⚠️</div>
                <span className="font-medium text-orange-800">Important Notice</span>
              </div>
              <p className="text-sm text-orange-700">
                {totalPaid === 0 ? 
                  `This will create an UNPAID bill. Customer owes ₹${roundedTotal.toFixed(2)}` :
                  `This will create a PARTIALLY PAID bill. Customer owes ₹${(roundedTotal - totalPaid).toFixed(2)} more`
                }
              </p>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="confirmUnpaid" 
                checked={confirmUnpaid} 
                onChange={(e) => setConfirmUnpaid(e.target.checked)}
                className="rounded border-orange-300"
              />
              <label htmlFor="confirmUnpaid" className="text-sm text-orange-700 cursor-pointer">
                I confirm this {totalPaid === 0 ? 'unpaid' : 'partially paid'} bill
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('🔍 Modal button clicked!')
                console.log('🔍 confirmUnpaid:', confirmUnpaid)
                console.log('🔍 roundedTotal:', roundedTotal)
                console.log('🔍 totalPaid:', totalPaid)
                console.log('🔍 isProcessing:', isProcessing)
                
                if (isProcessing) {
                  console.log('❌ Already processing, ignoring click')
                  return
                }
                
                if (confirmUnpaid) {
                  console.log('✅ Checkbox confirmed, proceeding with checkout...')
                  setShowPaymentModal(false)
                  console.log('🔍 Calling handleCheckout...')
                  handleCheckout()
                } else {
                  console.log('❌ Checkbox not confirmed')
                  toast({
                    title: "Confirmation Required",
                    description: "Please confirm the unpaid/partial payment bill",
                    variant: "destructive",
                  })
                }
              }}
              disabled={!confirmUnpaid || isProcessing}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
