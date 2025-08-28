"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { clients as initialClients } from "@/lib/data"

export interface Client {
  id: string
  name: string
  email?: string
  phone: string
  lastVisit?: string
  status?: "active" | "inactive"
}

interface ClientContextType {
  clients: Client[]
  addClient: (client: Client) => void
  getClientById: (id: string) => Client | undefined
  searchClients: (query: string) => Client[]
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: ReactNode }) {
  // Use localStorage to persist clients if available
  const [clients, setClients] = useState<Client[]>(() => {
    // Initialize with data from localStorage if available, otherwise use initial data
    if (typeof window !== "undefined") {
      const savedClients = localStorage.getItem("salon-clients")
      return savedClients ? JSON.parse(savedClients) : initialClients
    }
    return initialClients
  })

  // Save to localStorage whenever clients change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("salon-clients", JSON.stringify(clients))
    }
  }, [clients])

  const addClient = (client: Client) => {
    setClients((prevClients) => {
      // Check if client with this ID already exists
      const existingIndex = prevClients.findIndex((c) => c.id === client.id)

      if (existingIndex >= 0) {
        // Update existing client
        const updatedClients = [...prevClients]
        updatedClients[existingIndex] = client
        return updatedClients
      } else {
        // Add new client
        return [...prevClients, client]
      }
    })
  }

  const getClientById = (id: string) => {
    return clients.find((client) => client.id === id)
  }

  const searchClients = (query: string) => {
    if (!query.trim()) return clients

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        client.phone.includes(query) ||
        (client.email && client.email.toLowerCase().includes(query.toLowerCase())),
    )
  }

  return (
    <ClientContext.Provider value={{ clients, addClient, getClientById, searchClients }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClients() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error("useClients must be used within a ClientProvider")
  }
  return context
}
