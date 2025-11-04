"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, User, Phone, Mail, Calendar, TrendingUp, Eye, Receipt, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { clientStore } from "@/lib/client-store"
import { SalesAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ClientImportModal } from "./client-import-modal"

interface Client {
  id?: string
  _id?: string
  name: string
  email?: string
  phone: string
  lastVisit?: string
  status?: "active" | "inactive"
  totalVisits?: number
  totalSpent?: number
  createdAt?: string
  // Real-time calculated fields
  realTotalVisits?: number
  realTotalSpent?: number
  realLastVisit?: string
}

interface ClientsTableProps {
  clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isBillActivityOpen, setIsBillActivityOpen] = useState(false)
  const [selectedClientBills, setSelectedClientBills] = useState<any[]>([])
  const [isLoadingBills, setIsLoadingBills] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [clientsWithStats, setClientsWithStats] = useState<Client[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Fetch real-time statistics for only the currently visible page (avoid thousands of requests)
  const fetchClientStats = async () => {
    if (!user || clients.length === 0) return

    setIsLoadingStats(true)
    const source = clientsWithStats.length > 0 ? clientsWithStats : clients
    const start = pageIndex * pageSize
    const end = Math.min(start + pageSize, source.length)
    const visible = source.slice(start, end)

    const concurrency = 10
    const batches: typeof visible[] = []
    for (let i = 0; i < visible.length; i += concurrency) {
      batches.push(visible.slice(i, i + concurrency))
    }

    const enriched: any[] = []
    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(async (client) => {
          try {
            const response = await SalesAPI.getByClient(client.name)
            if (response.success && response.data && response.data.length > 0) {
              const sales = response.data
              const totalVisits = sales.length
              const totalSpent = sales.reduce((sum: number, sale: any) => sum + (sale.grossTotal || 0), 0)
              const lastVisit = sales.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
              return { ...client, realTotalVisits: totalVisits, realTotalSpent: totalSpent, realLastVisit: lastVisit }
            }
            return { ...client, realTotalVisits: undefined, realTotalSpent: undefined, realLastVisit: undefined }
          } catch (error) {
            return { ...client, realTotalVisits: undefined, realTotalSpent: undefined, realLastVisit: undefined }
          }
        })
      )
      results.forEach((r, idx) => {
        enriched.push(r.status === 'fulfilled' ? r.value : batch[idx])
      })
    }

    // Merge back into full list for the current window
    const merged = source.map((c, idx) => (idx >= start && idx < end ? enriched[idx - start] : c))
    setClientsWithStats(merged)
    setIsLoadingStats(false)
  }

  // NOTE: This effect is declared later in the file after pageIndex/pageSize are defined

  const handleEditClient = (client: Client) => {
    const clientId = client._id || client.id
    if (clientId) {
      router.push(`/clients/${clientId}`)
    }
  }

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedClient) return

    try {
      const clientId = selectedClient._id || selectedClient.id
      console.log('Deleting client:', selectedClient.name, 'with ID:', clientId)
      
      if (!clientId) {
        toast({
          title: "Error",
          description: "Client ID not found.",
          variant: "destructive",
        })
        return
      }

      const success = await clientStore.deleteClient(clientId)
      console.log('Delete result:', success)
      
      if (success) {
        toast({
          title: "Client Deleted",
          description: "Client has been successfully deleted.",
        })
        setIsDeleteDialogOpen(false)
        setSelectedClient(null)
        console.log('Client deleted successfully from store')
      } else {
        toast({
          title: "Error",
          description: "Failed to delete client. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewBillActivity = async (client: Client) => {
    // if (!user) {
    //   toast({
    //     title: "Authentication Required",
    //     description: "Please log in to view bill activity.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    console.log('🎯 Bill Activity clicked for client:', client.name)
    console.log('🎯 Opening modal...')
    
    setSelectedClient(client)
    setIsLoadingBills(true)
    setIsBillActivityOpen(true)
    
    console.log('🎯 Modal should now be open')
    
    try {
      console.log('Fetching bills for client:', client.name)
      console.log('User authenticated:', !!user)
      console.log('Current user:', user)
      
      // Use SalesAPI instead of direct fetch
      const response = await SalesAPI.getByClient(client.name)
      console.log('SalesAPI response:', response)
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('Bills found:', response.data)
        setSelectedClientBills(response.data)
      } else {
        console.log('No bills found or empty response')
        console.log('Response success:', response.success)
        console.log('Response data:', response.data)
        console.log('Response data length:', response.data?.length)
        setSelectedClientBills([])
      }
    } catch (error) {
      console.error('Error fetching bills:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      })
      setSelectedClientBills([])
      // Show error toast
      toast({
        title: "Error",
        description: `Failed to fetch bill activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoadingBills(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return "Invalid Date"
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0"
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <Link 
                href={`/clients/${client._id || client.id}`} 
                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors duration-200"
              >
                {client.name}
              </Link>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    {client.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "realTotalVisits",
      header: "Visits",
      cell: ({ row }) => {
        const visits = (row.original.realTotalVisits ?? row.original.totalVisits ?? 0)
        return (
          <div className="text-center">
            {isLoadingStats ? (
              <div className="w-8 h-6 bg-gray-200 rounded animate-pulse mx-auto" />
            ) : (
              <>
                <div className="text-lg font-semibold text-gray-900">{visits}</div>
                <div className="text-xs text-gray-500">total visits</div>
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "realTotalSpent",
      header: "Revenue",
      cell: ({ row }) => {
        const spent = (row.original.realTotalSpent ?? row.original.totalSpent ?? 0)
        return (
          <div className="text-center">
            {isLoadingStats ? (
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse mx-auto" />
            ) : (
              <>
                <div className="text-lg font-semibold text-emerald-600">{formatCurrency(spent)}</div>
                <div className="text-xs text-gray-500">total spent</div>
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "realLastVisit",
      header: "Last Visit",
      cell: ({ row }) => {
        const lastVisit = row.original.realLastVisit ?? row.original.lastVisit
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {isLoadingStats ? (
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            ) : (
              <span className="text-sm text-gray-600">{formatDate(lastVisit)}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "active"
        const isActive = status === "active"
        return (
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={`px-3 py-1 text-xs font-medium ${
              isActive 
                ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                : "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "billActivity",
      header: "Bill Activity",
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="text-center">
            <button
              onClick={() => handleViewBillActivity(client)}
              className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors duration-200 text-sm"
            >
              View
            </button>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/clients/${client._id || client.id}`)}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-50">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditClient(client)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Client
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDeleteClient(client)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: clientsWithStats.length > 0 ? clientsWithStats : clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const pageSize = table.getState().pagination.pageSize
  const pageIndex = table.getState().pagination.pageIndex
  const totalRows = (clientsWithStats.length > 0 ? clientsWithStats : clients).length
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min(startRow + pageSize - 1, totalRows)

  // Fetch stats when data or pagination changes (now that pageIndex/pageSize exist)
  useEffect(() => {
    fetchClientStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, user, pageIndex, pageSize])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Client Directory</h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {startRow}-{endRow} of {totalRows} clients
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={(v)=>table.setPageSize(parseInt(v))}>
                <SelectTrigger className="h-8 w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="h-8 px-3 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
            >
              <Upload className="h-4 w-4 mr-2" /> Import Clients
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClientStats}
              disabled={isLoadingStats}
              className="h-8 px-3 border-gray-200 hover:border-gray-300"
            >
              {isLoadingStats ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                "🔄"
              )}
              <span className="ml-2">Refresh Stats</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50/50 hover:bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-6 py-4 text-left font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {isLoadingStats && (header.id === 'realTotalVisits' || header.id === 'realTotalSpent' || header.id === 'realLastVisit') && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow 
                  key={row.id} 
                  data-state={row.getIsSelected() && "selected"}
                  className={`hover:bg-gray-50/50 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">No clients found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {table.getPageCount() > 1 && (
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => table.previousPage()} 
                disabled={!table.getCanPreviousPage()}
                className="h-9 px-4 border-gray-200 hover:border-gray-300"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => table.nextPage()} 
                disabled={!table.getCanNextPage()}
                className="h-9 px-4 border-gray-200 hover:border-gray-300"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Client Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Delete Client</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete <strong>{selectedClient?.name}</strong>? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Activity Modal */}
      <Dialog open={isBillActivityOpen} onOpenChange={setIsBillActivityOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              Bill Activity - {selectedClient?.name || 'No Client Selected'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              View all invoices and transactions for this customer
            </DialogDescription>
          </DialogHeader>
          
          
          <div className="flex-1 overflow-hidden">
            {isLoadingBills ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-600">Loading bills...</p>
                </div>
              </div>
            ) : selectedClientBills.length > 0 ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedClientBills.map((bill, index) => (
                  <div
                    key={bill._id || index}
                    className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <Receipt className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Bill #{bill.billNo || bill._id?.slice(-6) || 'N/A'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {bill.date ? new Date(bill.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'Date not available'}
                            </p>
                          </div>
                        </div>
                        
                        {bill.items && bill.items.length > 0 && (
                          <div className="ml-12 mb-2">
                            <p className="text-sm text-gray-600">
                              {bill.items.length} item{bill.items.length !== 1 ? 's' : ''} • 
                              Total: <span className="font-semibold text-emerald-600">
                                ₹{bill.grossTotal ? bill.grossTotal.toLocaleString('en-IN') : '0'}
                              </span>
                            </p>
                            {/* Show some item details */}
                            <div className="mt-2 space-y-1">
                              {bill.items.slice(0, 3).map((item: any, itemIndex: number) => (
                                <div key={itemIndex} className="text-xs text-gray-500 flex items-center gap-2">
                                  <span>•</span>
                                  <span>{item.name}</span>
                                  <span className="text-gray-400">({item.type})</span>
                                  <span className="text-gray-400">x{item.quantity}</span>
                                </div>
                              ))}
                              {bill.items.length > 3 && (
                                <div className="text-xs text-gray-400">
                                  +{bill.items.length - 3} more items
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Payment information */}
                        <div className="ml-12 mt-2">
                          <p className="text-xs text-gray-500">
                            Payment: <span className="font-medium text-gray-700">{bill.paymentMode || 'N/A'}</span>
                            {bill.staffName && (
                              <span className="ml-4">
                                Staff: <span className="font-medium text-gray-700">{bill.staffName}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${
                            bill.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : bill.status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {bill.status || 'completed'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">No bills found</p>
                <p className="text-sm text-gray-500 text-center mb-4">
                  This customer hasn't made any purchases yet
                </p>
                
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBillActivityOpen(false)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Import Modal */}
      <ClientImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={() => {
          setIsImportOpen(false)
          // Page likely receives clients via props; trigger a soft refresh by dispatching event
          window.dispatchEvent(new Event('client-added'))
        }}
      />
    </div>
  )
}
