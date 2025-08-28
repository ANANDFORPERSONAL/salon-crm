"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, TrendingUp, DollarSign, Users, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SalesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SalesRecord {
  id: string
  billNo: string
  customerName: string
  date: string
  paymentMode: string // Legacy support
  payments?: Array<{
    mode: string
    amount: number
  }>
  netTotal: number
  taxAmount: number
  grossTotal: number
  status: "completed" | "pending" | "cancelled"
  staffName: string
}

type DatePeriod = "today" | "yesterday" | "last7days" | "last30days" | "currentMonth" | "all"

export function SalesReport() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("today")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [salesData, setSalesData] = useState<SalesRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<SalesRecord | null>(null)
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<SalesRecord | null>(null)

  // Mock data - replace with actual API call
  useEffect(() => {
    // Set default date range to today
    const today = new Date()
    const todayRange = {
      from: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
    }
    setDateRange(todayRange)
    
    async function fetchSales() {
      setLoading(true)
      try {
        const res = await SalesAPI.getAll()
        const apiData = res.data || []
        console.log('🔍 Raw API data received:', apiData)
        const mapped = apiData.map((sale: any) => {
          const mappedSale = {
            id: sale._id,
            billNo: sale.billNo,
            customerName: sale.customerName,
            date: sale.date,
            paymentMode: sale.paymentMode, // Legacy support
            payments: sale.payments || [], // New split payment structure
            netTotal: sale.netTotal,
            taxAmount: sale.taxAmount,
            grossTotal: sale.grossTotal,
            status: sale.status,
            staffName: sale.staffName,
            items: sale.items || [],
          }
          console.log(`📋 Mapped sale ${sale.billNo}:`, {
            paymentMode: mappedSale.paymentMode,
            payments: mappedSale.payments,
            hasPayments: !!mappedSale.payments.length
          })
          return mappedSale
        })
        setSalesData(mapped)
      } catch (err) {
        setSalesData([])
      }
      setLoading(false)
    }
    fetchSales()
  }, [])

  // Function to get date range based on selected period
  const getDateRangeFromPeriod = (period: DatePeriod) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (period) {
      case "today":
        return {
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        return {
          from: yesterday,
          to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case "last7days":
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return {
          from: last7Days,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case "last30days":
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        return {
          from: last30Days,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case "currentMonth":
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return {
          from: firstDayOfMonth,
          to: new Date(lastDayOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case "all":
      default:
        return { from: undefined, to: undefined }
    }
  }

  // Handle date period change
  const handleDatePeriodChange = (period: DatePeriod) => {
    setDatePeriod(period)
    if (period !== "all") {
      const newDateRange = getDateRangeFromPeriod(period)
      setDateRange(newDateRange)
    } else {
      setDateRange({})
    }
  }

  // Enhanced filtering for split payments
  const filteredSales = salesData.filter((sale) => {
    const matchesSearch = 
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Enhanced payment filtering for split payments
    let matchesPayment = true
    if (paymentFilter !== "all") {
      if (sale.payments && sale.payments.length > 0) {
        // Check if any payment matches the filter
        matchesPayment = sale.payments.some(payment => payment.mode === paymentFilter)
        if (matchesPayment) {
          console.log(`✅ Bill ${sale.billNo} matches ${paymentFilter} filter:`, {
            payments: sale.payments,
            matchingPayment: sale.payments.find(p => p.mode === paymentFilter)
          })
        }
      } else {
        // Legacy single payment mode
        matchesPayment = sale.paymentMode === paymentFilter
        if (matchesPayment) {
          console.log(`✅ Bill ${sale.billNo} matches ${paymentFilter} filter (legacy):`, sale.paymentMode)
        }
      }
    }
    
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter
    
    // Date range filtering
    const saleDate = new Date(sale.date)
    const matchesDateRange = 
      (!dateRange.from || saleDate >= dateRange.from) &&
      (!dateRange.to || saleDate <= dateRange.to)
    
    return matchesSearch && matchesPayment && matchesStatus && matchesDateRange
  })

  console.log(`🔍 Payment filter "${paymentFilter}" applied:`, {
    totalSales: salesData.length,
    filteredSales: filteredSales.length,
    filterType: paymentFilter
  })

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.grossTotal, 0)
  const completedSales = filteredSales.filter(sale => sale.status === "completed").length
  const pendingSales = filteredSales.filter(sale => sale.status === "pending").length
  
  // Calculate cash and online collections (supporting both legacy and split payments)
  const cashCollected = filteredSales.reduce((sum, sale) => {
    if (sale.payments && sale.payments.length > 0) {
      // New split payment structure
      return sum + sale.payments
        .filter(payment => payment.mode === "Cash")
        .reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
    } else {
      // Legacy single payment mode
      return sum + (sale.paymentMode === "Cash" ? sale.netTotal : 0)
    }
  }, 0)
  
  const onlineCashCollected = filteredSales.reduce((sum, sale) => {
    if (sale.payments && sale.payments.length > 0) {
      // New split payment structure
      return sum + sale.payments
        .filter(payment => payment.mode === "Card" || payment.mode === "Online")
        .reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
    } else {
      // Legacy single payment mode
      return sum + ((sale.paymentMode === "Card" || sale.paymentMode === "Online") ? sale.netTotal : 0)
    }
  }, 0)

  const handleExport = () => {
    // Implement export functionality
    console.log("Exporting sales data...")
  }

  const handleViewBill = (sale: SalesRecord) => {
    setSelectedBill(sale)
    setIsBillDialogOpen(true)
  }

  const handleEditSale = (sale: SalesRecord) => {
    setSelectedSale(sale)
    setIsEditDialogOpen(true)
  }

  const handleDeleteSale = (sale: SalesRecord) => {
    setSelectedSale(sale)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedSale) return
    
    try {
      console.log("Deleting sale:", selectedSale.billNo)
      
      // Call the API to delete the sale from the database
      const response = await SalesAPI.delete(selectedSale.id)
      
      if (response.success) {
        // Remove from local state only after successful API call
        setSalesData(prev => prev.filter(sale => sale.id !== selectedSale.id))
        setIsDeleteDialogOpen(false)
        setSelectedSale(null)
        
        toast({
          title: "Sale Deleted",
          description: `Sale record for ${selectedSale.customerName} has been successfully deleted.`,
        })
        
        console.log("Sale deleted successfully")
      } else {
        console.error("Failed to delete sale:", response.error)
        toast({
          title: "Error",
          description: "Failed to delete sale record. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete sale:", error)
      toast({
        title: "Error",
        description: "Failed to delete sale record. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentModeDisplay = (sale: SalesRecord) => {
    console.log(`🔍 Processing payment display for ${sale.billNo}:`, {
      paymentMode: sale.paymentMode,
      payments: sale.payments,
      hasPayments: !!sale.payments?.length
    })
    
    if (sale.payments && sale.payments.length > 0) {
      // New split payment structure
      const paymentModes = sale.payments.map(payment => payment.mode)
      const uniqueModes = [...new Set(paymentModes)]
      const display = uniqueModes.join(", ")
      console.log(`✅ Split payment for ${sale.billNo}:`, { payments: sale.payments, display })
      return display
    } else if (sale.paymentMode && sale.paymentMode.includes(',')) {
      // Backend combined payment mode (e.g., "Cash, Card")
      console.log(`✅ Combined payment mode for ${sale.billNo}:`, sale.paymentMode)
      return sale.paymentMode
    } else {
      // Legacy single payment mode
      console.log(`✅ Single payment mode for ${sale.billNo}:`, sale.paymentMode)
      return sale.paymentMode
    }
  }

  // Get filtered amount based on payment filter
  const getFilteredAmount = (sale: SalesRecord) => {
    if (paymentFilter === "all") {
      return sale.netTotal
    }
    
    if (sale.payments && sale.payments.length > 0) {
      // Get amount for the selected payment type
      const filteredPayment = sale.payments.find(payment => payment.mode === paymentFilter)
      return filteredPayment ? filteredPayment.amount : 0
    } else {
      // Legacy single payment mode
      return sale.paymentMode === paymentFilter ? sale.netTotal : 0
    }
  }

  // Get filtered gross total based on payment filter
  const getFilteredGrossTotal = (sale: SalesRecord) => {
    if (paymentFilter === "all") {
      return sale.grossTotal
    }
    
    if (sale.payments && sale.payments.length > 0) {
      // Get amount for the selected payment type
      const filteredPayment = sale.payments.find(payment => payment.mode === paymentFilter)
      if (filteredPayment) {
        // Calculate proportional tax and gross total
        const ratio = filteredPayment.amount / sale.netTotal
        return filteredPayment.amount + (sale.taxAmount * ratio)
      }
      return 0
    } else {
      // Legacy single payment mode
      return sale.paymentMode === paymentFilter ? sale.grossTotal : 0
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {filteredSales.length} sales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSales}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSales}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{cashCollected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {paymentFilter === "all" ? "Cash payments only" : 
               paymentFilter === "Cash" ? "Filtered: Cash only" : "All cash payments"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Cash Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{onlineCashCollected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {paymentFilter === "all" ? "Card + Online/Paytm" : 
               paymentFilter === "Card" ? "Filtered: Card only" : 
               paymentFilter === "Online" ? "Filtered: Online only" : "All online payments"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          {/* Date Period Dropdown - ADDED */}
          <Select value={datePeriod} onValueChange={handleDatePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Quick periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="currentMonth">Current month</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Date Range Picker - EXISTING */}
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[280px] justify-start text-left font-normal"
                >
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>
            {paymentFilter === "all" 
              ? "Detailed view of all sales transactions" 
              : `Showing only ${paymentFilter} payments - amounts reflect ${paymentFilter} portion only`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No.</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>
                  Net Total
                  {paymentFilter !== "all" && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {paymentFilter} only
                    </Badge>
                  )}
                </TableHead>
                <TableHead>Tax Amount</TableHead>
                <TableHead>
                  Gross Total
                  {paymentFilter !== "all" && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {paymentFilter} only
                    </Badge>
                  )}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No sales records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                        onClick={() => handleViewBill(sale)}
                      >
                        {sale.billNo}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{sale.customerName}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getPaymentModeDisplay(sale)}</TableCell>
                    <TableCell>₹{getFilteredAmount(sale).toFixed(2)}</TableCell>
                    <TableCell>₹{sale.taxAmount.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">₹{getFilteredGrossTotal(sale).toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewBill(sale)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Bill
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSale(sale)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bill View Dialog */}
      <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details - {selectedBill?.billNo}</DialogTitle>
            <DialogDescription>
              Detailed view of the bill information
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bill No.</label>
                  <p className="text-lg font-semibold">{selectedBill.billNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-lg">{new Date(selectedBill.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                  <p className="text-lg font-semibold">{selectedBill.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Mode</label>
                  <p className="text-lg">{getPaymentModeDisplay(selectedBill)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Net Total</label>
                  <p className="text-lg">₹{selectedBill.netTotal.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax Amount</label>
                  <p className="text-lg">₹{selectedBill.taxAmount.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Gross Total</label>
                  <p className="text-2xl font-bold text-green-600">₹{selectedBill.grossTotal.toFixed(2)}</p>
                </div>
              </div>
              {selectedBill.payments && selectedBill.payments.length > 0 && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground">Payment Breakdown</label>
                  <div className="space-y-2 mt-2">
                    {selectedBill.payments.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center bg-muted/30 p-2 rounded">
                        <span className="font-medium">{payment.mode}</span>
                        <span className="text-green-600 font-semibold">₹{payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-muted-foreground">Staff</label>
                <p className="text-lg">{selectedBill.staffName}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBillDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsBillDialogOpen(false)
              // Here you could add print functionality
              console.log("Printing bill:", selectedBill?.billNo)
            }}>
              Print Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the sale record for {selectedSale?.customerName}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}