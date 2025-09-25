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
  // In production, clients are managed by the API only
  const [clients, setClients] = useState<Client[]>(initialClients)

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
