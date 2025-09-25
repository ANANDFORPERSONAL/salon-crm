// Updated client store with API integration and fallback
import { clients as initialClients } from "@/lib/data"
import { ClientsAPI } from "@/lib/api"

export interface Client {
  id: string
  _id?: string
  name: string
  email?: string
  phone: string
  lastVisit?: string
  status?: "active" | "inactive"
  totalVisits?: number
  totalSpent?: number
  createdAt?: string
  address?: string
  notes?: string
  gender?: "male" | "female" | "other"
  birthdate?: string
}

// Create a simple store with event listeners
class ClientStore {
  private clients: Client[] = [...initialClients]
  private listeners: (() => void)[] = []
  private isLoading = false

  constructor() {
    this.loadClients()
  }

  async loadClients() {
    if (this.isLoading) return
    
    this.isLoading = true
    try {
      // Try to load from API
      console.log('🔍 ClientStore: Loading clients from API...')
      const response = await ClientsAPI.getAll()
      console.log('📊 ClientStore: API response:', response)
      if (response.success) {
        console.log('✅ ClientStore: API call successful')
        console.log('📋 ClientStore: Clients data:', response.data)
        console.log('🔢 ClientStore: Number of clients:', response.data?.length || 0)
        if (response.data && response.data.length > 0) {
          console.log('🔑 ClientStore: First client ID (_id):', response.data[0]._id)
          console.log('🔑 ClientStore: First client ID (id):', response.data[0].id)
          console.log('🔑 ClientStore: First client object:', response.data[0])
        }
        this.clients = response.data
        this.notifyListeners()
      } else {
        console.error('❌ ClientStore: API call failed:', response.error)
      }
    } catch (error) {
      console.error('❌ ClientStore: Error loading clients:', error)
      console.warn("API not available, no fallback in production")
      // In production, don't use localStorage fallback
      this.clients = []
    } finally {
      this.isLoading = false
    }
  }

  getClients(): Client[] {
    return [...this.clients]
  }

  async addClient(client: Client): Promise<boolean> {
    try {
      // Try API first
      const response = await ClientsAPI.create(client)
      if (response.success) {
        this.clients.push(response.data)
        this.notifyListeners()
        return true
      }
      return false
    } catch {
      console.warn("API not available, using local storage fallback")
      
      // Fallback to local storage
      // Check if client with this ID already exists
      const existingIndex = this.clients.findIndex((c) => c.id === client.id)

      if (existingIndex >= 0) {
        // Update existing client
        this.clients[existingIndex] = client
      } else {
        // Add new client
        this.clients.push(client)
      }

      // In production, data is persisted via API only

      // Notify listeners
      this.notifyListeners()
      return true
    }
  }

  async updateClient(id: string, client: Client): Promise<boolean> {
    try {
      // Try API first
      const response = await ClientsAPI.update(id, client)
      if (response.success) {
        const index = this.clients.findIndex(c => c.id === id)
        if (index >= 0) {
          this.clients[index] = response.data
          this.notifyListeners()
        }
        return true
      }
      return false
    } catch {
      console.warn("API not available, using local storage fallback")
      
      // Fallback to local storage
      const index = this.clients.findIndex(c => c.id === id)
      if (index >= 0) {
        this.clients[index] = client
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("salon-clients", JSON.stringify(this.clients))
        }
        this.notifyListeners()
        return true
      }
      return false
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    console.log('ClientStore: Deleting client with ID:', id)
    console.log('ClientStore: Current clients before deletion:', this.clients.length)
    
    try {
      // Try API first
      const response = await ClientsAPI.delete(id)
      if (response.success) {
        // Remove client by matching either id or _id
        const beforeCount = this.clients.length
        this.clients = this.clients.filter(c => c.id !== id && c._id !== id)
        const afterCount = this.clients.length
        console.log('ClientStore: Clients before deletion:', beforeCount, 'after deletion:', afterCount)
        this.notifyListeners()
        return true
      }
      return false
    } catch {
      console.warn("API not available, using local storage fallback")
      
      // Fallback to local storage
      // Remove client by matching either id or _id
      const beforeCount = this.clients.length
      this.clients = this.clients.filter(c => c.id !== id && c._id !== id)
      const afterCount = this.clients.length
      console.log('ClientStore: Clients before deletion (fallback):', beforeCount, 'after deletion:', afterCount)
      
      // In production, data is persisted via API only
      this.notifyListeners()
      return true
    }
  }

  getClientById(id: string): Client | undefined {
    return this.clients.find((client) => client.id === id || client._id === id)
  }

  async searchClients(query: string): Promise<Client[]> {
    if (!query.trim()) return this.clients

    try {
      // Try API search first
      const response = await ClientsAPI.search(query)
      if (response.success) {
        return response.data
      }
      return []
    } catch {
      console.warn("API not available, using local search fallback")
      
      // Fallback to local search
      // Clean the query for phone number matching
      const cleanQuery = query.replace(/\D/g, "") // Remove non-digits

      return this.clients.filter((client) => {
        // Search by name
        const nameMatch = client.name.toLowerCase().includes(query.toLowerCase())

        // Search by email
        const emailMatch = client.email && client.email.toLowerCase().includes(query.toLowerCase())

        // Search by phone - try both original and cleaned versions
        const phoneMatch =
          client.phone.includes(query) ||
          client.phone.replace(/\D/g, "").includes(cleanQuery) ||
          client.phone.includes(cleanQuery)

        return nameMatch || emailMatch || phoneMatch
      })
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }
}

// Create a singleton instance
export const clientStore = new ClientStore()
