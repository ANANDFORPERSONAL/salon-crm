"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, Search, Users, UserCheck, UserX, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientsTable } from "@/components/clients/clients-table"
import { SideNav } from "@/components/side-nav"
import { TopNav } from "@/components/top-nav"
import { clientStore, type Client } from "@/lib/client-store"
import { SalesAPI } from "@/lib/api"

export function ClientsListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>(clientStore.getClients())
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Subscribe to client store changes
  useEffect(() => {
    const unsubscribe = clientStore.subscribe(() => {
      const updatedClients = clientStore.getClients()
      console.log('ClientsListPage: Store updated, new client count:', updatedClients.length)
      setClients(updatedClients)
    })
    return unsubscribe
  }, [])

  // Calculate stats whenever clients change
  useEffect(() => {
    const calculateStats = async () => {
      if (clients.length === 0) {
        setStats({ totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0 })
        setIsLoadingStats(false)
        return
      }

      setIsLoadingStats(true)
      
      try {
        const now = new Date()
        const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, now.getDate())
        
        const totalCustomers = clients.length
        const activeCustomers = clients.filter(client => client.status === 'active').length
        
        // Check recent bill activity for each customer
        let inactiveCustomers = 0
        
        for (const client of clients) {
          try {
            // Get recent sales for this customer
            const salesResponse = await SalesAPI.getByClient(client.name)
            
            if (salesResponse.success && salesResponse.data && salesResponse.data.length > 0) {
              // Find the most recent sale
              const recentSales = salesResponse.data
                .filter((sale: any) => sale.date) // Filter out sales without dates
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              
              if (recentSales.length > 0) {
                const mostRecentSale = recentSales[0]
                const lastSaleDate = new Date(mostRecentSale.date)
                
                // If the most recent sale is older than 4 months, customer is inactive
                if (lastSaleDate < fourMonthsAgo) {
                  inactiveCustomers++
                }
              } else {
                // No sales with dates, consider inactive
                inactiveCustomers++
              }
            } else {
              // No sales found, consider inactive
              inactiveCustomers++
            }
          } catch (error) {
            console.error(`Error checking sales for client ${client.name}:`, error)
            // If we can't check sales, consider inactive
            inactiveCustomers++
          }
        }

        setStats({
          totalCustomers,
          activeCustomers,
          inactiveCustomers
        })
      } catch (error) {
        console.error('Error calculating stats:', error)
        // Fallback to basic stats
        setStats({
          totalCustomers: clients.length,
          activeCustomers: clients.filter(client => client.status === 'active').length,
          inactiveCustomers: 0
        })
      } finally {
        setIsLoadingStats(false)
      }
    }

    calculateStats()
  }, [clients])

  // Update filtered clients when search query or clients change
  useEffect(() => {
    const updateFilteredClients = async () => {
      if (!searchQuery.trim()) {
        setFilteredClients(clients)
        return
      }

      const searchResults = await clientStore.searchClients(searchQuery)
      setFilteredClients(searchResults)
    }

    updateFilteredClients()
  }, [searchQuery, clients])

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <SideNav />
        <main className="flex-1 p-6 md:p-8">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
              <Button asChild>
                <Link href="/clients/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Client
                </Link>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="group transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Customers</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-blue-900 mb-1">
                    {isLoadingStats ? (
                      <div className="w-8 h-8 bg-blue-200 rounded animate-pulse" />
                    ) : (
                      stats.totalCustomers
                    )}
                  </div>
                  <p className="text-xs text-blue-600 font-medium">All registered clients</p>
                  <div className="w-full bg-blue-200 rounded-full h-1 mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: `${Math.min((stats.totalCustomers / 100) * 100, 100)}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="group transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-green-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-emerald-800">Active Customers</CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-emerald-900 mb-1">
                    {isLoadingStats ? (
                      <div className="w-8 h-8 bg-emerald-200 rounded animate-pulse" />
                    ) : (
                      stats.activeCustomers
                    )}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">Currently active</p>
                  <div className="w-full bg-emerald-200 rounded-full h-1 mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-1 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: `${stats.totalCustomers > 0 ? (stats.activeCustomers / stats.totalCustomers) * 100 : 0}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="group transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-amber-800">Inactive Customers</CardTitle>
                  <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
                    <UserX className="h-4 w-4 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-amber-900 mb-1">
                    {isLoadingStats ? (
                      <div className="w-8 h-8 bg-amber-200 rounded animate-pulse" />
                    ) : (
                      stats.inactiveCustomers
                    )}
                  </div>
                  <p className="text-xs text-amber-600 font-medium">No visits in 4+ months</p>
                  <div className="w-full bg-amber-200 rounded-full h-1 mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-1 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: `${stats.totalCustomers > 0 ? (stats.inactiveCustomers / stats.totalCustomers) * 100 : 0}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loading Indicator */}
            {isLoadingStats && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">
                  Calculating customer statistics from recent bill activity...
                </p>
              </div>
            )}

            {/* Enhanced Search Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    placeholder="Search clients by name, phone, or email..."
                    className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-300 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {filteredClients.length} results
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                    className="h-12 px-6 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200"
                    disabled={!searchQuery}
                  >
                    Clear Search
                  </Button>
                  <div className="text-sm text-gray-500">
                    {clients.length} total clients
                  </div>
                </div>
              </div>
              
              {/* Search Tips */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  💡 Search tips: Use name, phone number, or email address to find clients quickly
                </p>
              </div>
            </div>
            <ClientsTable clients={filteredClients} />
          </div>
        </main>
      </div>
    </div>
  )
}
