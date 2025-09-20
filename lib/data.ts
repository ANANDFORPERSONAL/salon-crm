export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  createdAt: string
  totalVisits: number
  totalSpent: number
  lastVisit?: string
  status: "active" | "inactive"
}

export interface Service {
  id: string
  name: string
  category: string
  duration: number
  price: number
  description?: string
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  sku: string
  supplier?: string
  description?: string
  isActive: boolean
}

export interface Staff {
  id: string
  name: string
  role: "admin" | "manager" | "staff"
  email: string
  phone: string
  specialties: string[]
  hourlyRate: number
  commissionRate: number
  notes?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  serviceId: string
  serviceName: string
  staffId: string
  staffName: string
  date: string
  time: string
  duration: number
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  notes?: string
  price: number
}

export interface Receipt {
  id: string
  receiptNumber: string
  clientId: string
  clientName: string
  clientPhone: string
  date: string
  time: string
  items: ReceiptItem[]
  subtotal: number
  tip: number
  discount: number
  tax: number
  roundOff?: number
  total: number
  payments: PaymentMethod[]
  staffId: string
  staffName: string
  notes?: string
}

export interface ReceiptItem {
  id: string
  name: string
  type: "service" | "product"
  quantity: number
  price: number
  discount: number
  discountType: "percentage" | "fixed"
  staffId?: string
  staffName?: string
  total: number
}

export interface PaymentMethod {
  type: "cash" | "card" | "online" | "unknown"
  amount: number
}

// Sample data
export const clients: Client[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "555-0101",
    address: "123 Main St, City, State",
    notes: "Prefers organic products, allergic to certain fragrances",
    createdAt: "2024-01-15T10:00:00Z",
    totalVisits: 5,
    totalSpent: 450,
    lastVisit: "2024-03-20T14:30:00Z",
    status: "active"
  },
  {
    id: "2", 
    name: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "555-0102",
    address: "456 Oak Ave, City, State",
    notes: "Regular customer, likes detailed consultations",
    createdAt: "2024-02-01T09:00:00Z",
    totalVisits: 3,
    totalSpent: 280,
    lastVisit: "2024-03-18T16:00:00Z",
    status: "active"
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@email.com", 
    phone: "555-0103",
    address: "789 Pine Rd, City, State",
    notes: "New client, interested in hair treatments",
    createdAt: "2024-03-10T11:00:00Z",
    totalVisits: 1,
    totalSpent: 120,
    lastVisit: "2024-03-10T11:00:00Z",
    status: "active"
  }
]

export const services: Service[] = []

export const products: Product[] = []

export const staff: Staff[] = []

export const appointments: Appointment[] = []

// Receipt storage (in a real app, this would be in a database)
export const receipts: Receipt[] = []

// Load receipts from localStorage on initialization
const loadReceiptsFromStorage = () => {
  try {
    const storedReceipts = localStorage.getItem('salon-receipts')
    if (storedReceipts) {
      const parsedReceipts = JSON.parse(storedReceipts)
      receipts.push(...parsedReceipts)
      console.log('📝 Loaded receipts from localStorage:', receipts.length)
    }
  } catch (error) {
    console.error('❌ Failed to load receipts from localStorage:', error)
  }
}

// Initialize receipts from localStorage
loadReceiptsFromStorage()

export const addReceipt = (receipt: Receipt) => {
  console.log('📝 Adding receipt to store:', receipt)
  console.log('📝 Receipt ID:', receipt.id)
  console.log('📝 Receipt Number:', receipt.receiptNumber)
  console.log('📝 Current receipts count before:', receipts.length)
  
  receipts.push(receipt)
  
  console.log('📝 Receipt added successfully')
  console.log('📝 New receipts count:', receipts.length)
  console.log('📝 All receipts in store:', receipts)
  
  // Also store in localStorage for persistence
  try {
    localStorage.setItem('salon-receipts', JSON.stringify(receipts))
    console.log('📝 Receipts saved to localStorage')
  } catch (error) {
    console.error('❌ Failed to save receipts to localStorage:', error)
  }
}

export const getReceiptByNumber = (receiptNumber: string) => {
  return receipts.find((r) => r.receiptNumber === receiptNumber)
}

export const getReceiptById = (id: string) => {
  return receipts.find((r) => r.id === id)
}

export const getAllReceipts = () => {
  return receipts
}

export const getReceiptsByClient = (clientId: string) => {
  return receipts.filter((r) => r.clientId === clientId)
}
