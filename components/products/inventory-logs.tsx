"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { InventoryAPI } from "@/lib/api"
import { 
  Search, 
  Filter, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  Package,
  Calendar,
  User,
  FileText,
  RefreshCw
} from "lucide-react"

interface InventoryTransaction {
  _id: string;
  productId: string;
  productName: string;
  transactionType: 'sale' | 'return' | 'adjustment' | 'restock' | 'damage' | 'expiry' | 'service_usage' | 'theft' | 'purchase';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalValue: number;
  referenceType: 'sale' | 'return' | 'adjustment' | 'purchase' | 'other';
  referenceId: string;
  referenceNumber: string;
  processedBy: string;
  location?: string;
  reason?: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export function InventoryLogs() {
  const { toast } = useToast()
  const { formatAmount } = useCurrency()
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  // Fetch inventory transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: 1,
        limit: 100
      }
      
      if (typeFilter && typeFilter !== "all") params.transactionType = typeFilter
      if (dateFilter) {
        const today = new Date()
        
        if (dateFilter === 'today') {
          // Today: Start and end of today
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
          params.dateFrom = startOfDay.toISOString()
          params.dateTo = endOfDay.toISOString()
        } else if (dateFilter === 'yesterday') {
          // Yesterday: Start and end of yesterday
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
          const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
          const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
          params.dateFrom = startOfYesterday.toISOString()
          params.dateTo = endOfYesterday.toISOString()
        } else if (dateFilter === 'week') {
          // Last 7 days: From 7 days ago to end of today
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          const startOfWeek = new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate())
          const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
          params.dateFrom = startOfWeek.toISOString()
          params.dateTo = endOfToday.toISOString()
        } else if (dateFilter === 'month') {
          // Last 30 days: From 30 days ago to end of today
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          const startOfMonth = new Date(monthAgo.getFullYear(), monthAgo.getMonth(), monthAgo.getDate())
          const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
          params.dateFrom = startOfMonth.toISOString()
          params.dateTo = endOfToday.toISOString()
        } else if (dateFilter === 'custom') {
          // Custom date range
          if (customDateFrom && customDateTo) {
            const startDate = new Date(customDateFrom)
            const endDate = new Date(customDateTo)
            const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
            const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
            params.dateFrom = startOfDay.toISOString()
            params.dateTo = endOfDay.toISOString()
          }
        }
      }

      console.log('🔍 Inventory Logs - Fetching with params:', params)
      const response = await InventoryAPI.getTransactions(params)
      console.log('🔍 Inventory Logs - Response:', response)
      setTransactions(response.data || [])
    } catch (error) {
      console.error('Error fetching inventory transactions:', error)
      toast({
        title: "Error",
        description: "Failed to fetch inventory transactions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [typeFilter, dateFilter])

  // Auto-refresh when custom dates change
  useEffect(() => {
    if (dateFilter === 'custom' && customDateFrom && customDateTo) {
      fetchTransactions()
    }
  }, [customDateFrom, customDateTo, dateFilter])

  // Handle date filter change
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    if (value === 'custom') {
      setShowCustomDatePicker(true)
    } else {
      setShowCustomDatePicker(false)
      // Auto-fetch for non-custom filters immediately
      fetchTransactions()
    }
  }

  // Listen for new transactions
  useEffect(() => {
    const handleTransactionCreated = () => {
      fetchTransactions()
    }

    window.addEventListener('inventoryTransactionCreated', handleTransactionCreated)
    return () => {
      window.removeEventListener('inventoryTransactionCreated', handleTransactionCreated)
    }
  }, [])

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.processedBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get transaction type badge
  const getTransactionTypeBadge = (type: string, quantity: number) => {
    const isIncrease = quantity > 0
    const baseClasses = "text-xs font-medium px-2 py-1 rounded-full"
    
    switch (type) {
      case 'purchase':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}>Purchase</Badge>
      case 'return':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200`}>Return</Badge>
      case 'restock':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200`}>Restock</Badge>
      case 'adjustment':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`}>Adjustment</Badge>
      case 'service_usage':
        return <Badge className={`${baseClasses} bg-purple-100 text-purple-800 border-purple-200`}>Service Usage</Badge>
      case 'damage':
        return <Badge className={`${baseClasses} bg-orange-100 text-orange-800 border-orange-200`}>Damage</Badge>
      case 'expiry':
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}>Expiry</Badge>
      case 'theft':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200`}>Theft</Badge>
      case 'sale':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200`}>Sale</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}>{type}</Badge>
    }
  }

  // Get quantity display with color
  const getQuantityDisplay = (quantity: number) => {
    const isIncrease = quantity > 0
    const colorClass = isIncrease ? 'text-green-600' : 'text-red-600'
    const icon = isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
    
    return (
      <span className={`flex items-center gap-1 font-medium ${colorClass}`}>
        {icon}
        {isIncrease ? '+' : ''}{quantity}
      </span>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Inventory Logs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Transaction Logs
          </DialogTitle>
          <DialogDescription>
            Track all inventory movements including sales, returns, and adjustments
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary Stats */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredTransactions
                      .filter(t => t.quantity < 0)
                      .reduce((sum, t) => sum + Math.abs(t.quantity), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Items Deducted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredTransactions
                      .filter(t => t.quantity > 0)
                      .reduce((sum, t) => sum + t.quantity, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Items Added</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredTransactions.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatAmount(
                      filteredTransactions.reduce((sum, t) => sum + t.totalValue, 0)
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by product, bill number, or staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="type">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="service_usage">Service Usage</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="expiry">Expiry</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Custom Date Range Picker */}
            {showCustomDatePicker && (
              <div className="flex gap-2 items-end">
                <div className="w-40">
                  <Label htmlFor="customFrom">From Date</Label>
                  <Input
                    id="customFrom"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => {
                      setCustomDateFrom(e.target.value)
                      // Auto-refresh if both dates are selected
                      if (e.target.value && customDateTo) {
                        setTimeout(() => fetchTransactions(), 100)
                      }
                    }}
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor="customTo">To Date</Label>
                  <Input
                    id="customTo"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => {
                      setCustomDateTo(e.target.value)
                      // Auto-refresh if both dates are selected
                      if (customDateFrom && e.target.value) {
                        setTimeout(() => fetchTransactions(), 100)
                      }
                    }}
                  />
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (customDateFrom && customDateTo) {
                      fetchTransactions()
                    }
                  }}
                  disabled={!customDateFrom || !customDateTo}
                >
                  Apply
                </Button>
              </div>
            )}
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={fetchTransactions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading transactions...
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Stock Change</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Processed By</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {new Date(transaction.transactionDate).toLocaleDateString()}
                              </div>
                              <div className="text-gray-500">
                                {new Date(transaction.transactionDate).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{transaction.productName}</div>
                            {transaction.reason && (
                              <div className="text-sm text-gray-500">{transaction.reason}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getTransactionTypeBadge(transaction.transactionType, transaction.quantity)}
                          </TableCell>
                          <TableCell>
                            {getQuantityDisplay(transaction.quantity)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-gray-500">
                                {transaction.previousStock} → {transaction.newStock}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{transaction.referenceNumber}</div>
                              <div className="text-gray-500 capitalize">{transaction.referenceType}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{transaction.processedBy}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {formatAmount(transaction.totalValue)}
                            </div>
                            <div className="text-xs text-gray-500">
                              @ {formatAmount(transaction.unitCost)}/unit
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No inventory transactions found</p>
                      <p className="text-sm">Try adjusting your filters or check back later</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  )
}
