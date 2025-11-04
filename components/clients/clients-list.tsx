"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, Search, Users, UserCheck, UserX, TrendingUp, Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientsTable } from "@/components/clients/clients-table"
import { clientStore, type Client } from "@/lib/client-store"
import { SalesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { format } from "date-fns"

export function ClientsListPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Subscribe to client store changes and force reload on mount
  useEffect(() => {
    // Force reload clients from API
    clientStore.loadClients()
    
    const unsubscribe = clientStore.subscribe(() => {
      const updatedClients = clientStore.getClients()
      console.log('ClientsListPage: Store updated, new client count:', updatedClients.length)
      setClients(updatedClients)
      setFilteredClients(updatedClients)
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

  // Listen for client-added event (from import)
  useEffect(() => {
    const handleClientAdded = () => {
      console.log('ClientsListPage: client-added event received, reloading clients...')
      clientStore.loadClients()
    }
    window.addEventListener('client-added', handleClientAdded)
    return () => window.removeEventListener('client-added', handleClientAdded)
  }, [])

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text("Client Management Report", 14, 22)
      
      // Add generation date
      doc.setFontSize(12)
      doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy 'at' h:mm a")}`, 14, 32)
      
      // Add summary stats
      doc.setFontSize(14)
      doc.text("Summary", 14, 50)
      doc.setFontSize(10)
      doc.text(`Total Customers: ${stats.totalCustomers}`, 14, 60)
      doc.text(`Active Customers: ${stats.activeCustomers}`, 14, 70)
      doc.text(`Inactive Customers: ${stats.inactiveCustomers}`, 14, 80)
      doc.text(`Search Query: ${searchQuery || "All clients"}`, 14, 90)
      
      let yPosition = 110
      
      if (filteredClients.length === 0) {
        doc.setFontSize(14)
        doc.text("No client data available", 14, yPosition)
      } else {
        // Client table headers
        const headers = [
          "Name",
          "Phone",
          "Email",
          "Status",
          "Total Visits",
          "Total Spent",
          "Last Visit",
          "Created Date"
        ]
        
        const data = filteredClients.map(client => [
          client.name,
          client.phone || "N/A",
          client.email || "N/A",
          client.status || "active",
          client.totalVisits || 0,
          `₹${(client.totalSpent || 0).toFixed(2)}`,
          client.lastVisit ? format(new Date(client.lastVisit), "MMM dd, yyyy") : "N/A",
          client.createdAt ? format(new Date(client.createdAt), "MMM dd, yyyy") : "N/A"
        ])
        
        autoTable(doc, {
          head: [headers],
          body: data,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] }
        })
      }
      
      // Save the PDF
      const fileName = `clients-report-${format(new Date(), "yyyy-MM-dd")}.pdf`
      doc.save(fileName)
      
      toast({
        title: "Export Successful",
        description: `PDF exported as ${fileName}`,
      })
    } catch (error) {
      console.error("PDF export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleExportXLS = () => {
    try {
      const data = filteredClients.map(client => ({
        "Name": client.name,
        "Phone": client.phone || "",
        "Email": client.email || "",
        "Status": client.status || "active",
        "Total Visits": client.totalVisits || 0,
        "Total Spent": client.totalSpent || 0,
        "Last Visit": client.lastVisit ? format(new Date(client.lastVisit), "MMM dd, yyyy") : "",
        "Created Date": client.createdAt ? format(new Date(client.createdAt), "MMM dd, yyyy") : ""
      }))
      
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Clients Report")
      
      // Add summary sheet
      const summaryData = [
        { Metric: "Total Customers", Value: stats.totalCustomers },
        { Metric: "Active Customers", Value: stats.activeCustomers },
        { Metric: "Inactive Customers", Value: stats.inactiveCustomers },
        { Metric: "Search Query", Value: searchQuery || "All clients" },
        { Metric: "Generated Date", Value: format(new Date(), "MMM dd, yyyy 'at' h:mm a") }
      ]
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")
      
      // Save the file
      const fileName = `clients-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      toast({
        title: "Export Successful",
        description: `Excel file exported as ${fileName}`,
      })
    } catch (error) {
      console.error("XLS export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export Excel file. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex flex-col space-y-6">
            {/* Elegant Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header Background */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Users className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800 mb-1">
                        Client Management
                      </h1>
                      <p className="text-slate-600 text-base">
                        Manage your salon clients, track their preferences and history
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium border-slate-200"
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Export
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-2" />
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportXLS} className="cursor-pointer">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium">
                      <Link href="/clients/new">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        New Client
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Feature Highlights */}
              <div className="px-8 py-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-8 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Customer relationship management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span>Service history tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Preference management</span>
                  </div>
                </div>
              </div>
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
  )
}
