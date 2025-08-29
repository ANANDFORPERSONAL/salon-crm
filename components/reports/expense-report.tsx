"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, Receipt, DollarSign, TrendingUp, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExpensesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ExpenseRecord {
  id: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  date: string
  staffName?: string
  notes?: string
}

type DatePeriod = "today" | "yesterday" | "last7days" | "last30days" | "currentMonth" | "all"

export function ExpenseReport() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("today")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [expensesData, setExpensesData] = useState<ExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Mock data - replace with actual API call
  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true)
      try {
        const res = await ExpensesAPI.getAll()
        const apiData = res.data || []
        const mapped = apiData.map((expense: any) => ({
          id: expense._id,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          date: expense.date,
          staffName: expense.staffName,
          notes: expense.notes,
        }))
        setExpensesData(mapped)
      } catch (err) {
        setExpensesData([])
      }
      setLoading(false)
    }
    fetchExpenses()
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
  }

  // Filter expenses based on search and filters
  const filteredData = expensesData.filter((expense) => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    const matchesPaymentMethod = paymentMethodFilter === "all" || expense.paymentMethod === paymentMethodFilter
    
    // Date range filtering
    const expenseDate = new Date(expense.date)
    const dateRange = getDateRangeFromPeriod(datePeriod)
    const matchesDateRange = 
      (!dateRange.from || expenseDate >= dateRange.from) &&
      (!dateRange.to || expenseDate <= dateRange.to)
    
    return matchesSearch && matchesCategory && matchesPaymentMethod && matchesDateRange
  })

  // Calculate statistics
  const stats = {
    totalExpenses: filteredData.reduce((sum, expense) => sum + expense.amount, 0),
    totalCount: filteredData.length,
    averageExpense: filteredData.length > 0 ? filteredData.reduce((sum, expense) => sum + expense.amount, 0) / filteredData.length : 0
  }

  const handleExport = () => {
    // Implement export functionality
    console.log("Exporting expense data...")
  }

  const handleViewExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(expense)
    setIsViewDialogOpen(true)
  }

  const handleEditExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(expense)
    setIsEditDialogOpen(true)
  }

  const handleDeleteExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(expense)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedExpense) return
    
    try {
      console.log("Deleting expense:", selectedExpense.description)
      
      // Call the API to delete the expense from the database
      const response = await ExpensesAPI.delete(selectedExpense.id)
      
      if (response.success) {
        // Remove from local state only after successful API call
        setExpensesData(prev => prev.filter(expense => expense.id !== selectedExpense.id))
        setIsDeleteDialogOpen(false)
        setSelectedExpense(null)
        
        toast({
          title: "Expense Deleted",
          description: `Expense record for ${selectedExpense.description} has been successfully deleted.`,
        })
        
        console.log("Expense deleted successfully")
      } else {
        console.error("Failed to delete expense:", response.error)
        toast({
          title: "Error",
          description: "Failed to delete expense record. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense record. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatAmount = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium bg-slate-200 h-4 rounded"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-slate-200 h-8 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center py-16">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-slate-900 mb-2">Loading expenses...</h3>
              <p className="text-slate-500 text-sm">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-red-50 to-pink-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-300">
              <Receipt className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-red-900 mb-1">{formatAmount(stats.totalExpenses)}</div>
            <p className="text-xs text-red-600 font-medium">
              {datePeriod === "all" ? "All time" : `This ${datePeriod}`}
            </p>
            <div className="w-full bg-red-200 rounded-full h-1 mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 h-1 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: `${Math.min((stats.totalExpenses / 100) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="group transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-amber-800">Total Count</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-amber-900 mb-1">{stats.totalCount}</div>
            <p className="text-xs text-amber-600 font-medium">Expense records</p>
            <div className="w-full bg-amber-200 rounded-full h-1 mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-1 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: `${Math.min((stats.totalCount / 50) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="group transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-emerald-800">Average Expense</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-900 mb-1">{formatAmount(stats.averageExpense)}</div>
            <p className="text-xs text-emerald-600 font-medium">Per transaction</p>
            <div className="w-full bg-emerald-200 rounded-full h-1 mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: `${Math.min((stats.averageExpense / 100) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              {/* Date Period Dropdown */}
              <Select value={datePeriod} onValueChange={handleDatePeriodChange}>
                <SelectTrigger className="w-40 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
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
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Payment Method Filter */}
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-40 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleExport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Expense Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">Expenses</h3>
              <p className="text-slate-600 text-sm mt-1">
                Detailed view of all expenses with filtering and search capabilities
              </p>
            </div>
          </div>
          
          {filteredData.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  <Receipt className="h-10 w-10 text-slate-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No expenses found</h3>
                  <p className="text-slate-500 text-sm">Try adjusting your filters or search terms</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-red-50 hover:bg-gradient-to-r hover:from-slate-100 hover:to-red-100">
                    <TableHead className="py-4 text-slate-700 font-semibold">Category</TableHead>
                    <TableHead className="py-4 text-slate-700 font-semibold">Description</TableHead>
                    <TableHead className="py-4 text-slate-700 font-semibold">Amount</TableHead>
                    <TableHead className="py-4 text-slate-700 font-semibold">Payment Method</TableHead>
                    <TableHead className="py-4 text-slate-700 font-semibold">Date</TableHead>
                    <TableHead className="py-4 text-slate-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-red-50 transition-all duration-200 border-b border-slate-100">
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 max-w-[200px] truncate text-slate-800" title={expense.description}>
                        {expense.description}
                      </TableCell>
                      <TableCell className="py-4 font-mono font-semibold text-red-700">{formatAmount(expense.amount)}</TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.paymentMethod}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-slate-600">{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4 text-slate-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-slate-700">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewExpense(expense)} className="hover:bg-blue-50">
                              <Eye className="mr-2 h-4 w-4 text-blue-600" />
                              <span className="text-slate-700">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditExpense(expense)} className="hover:bg-amber-50">
                              <Pencil className="mr-2 h-4 w-4 text-amber-600" />
                              <span className="text-slate-700">Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteExpense(expense)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* View Expense Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Detailed view of the expense information
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-lg font-semibold">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(selectedExpense.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="text-lg">{selectedExpense.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-lg">{format(new Date(selectedExpense.date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-lg">{selectedExpense.description}</p>
                </div>
                {selectedExpense.staffName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Staff</label>
                    <p className="text-lg">{selectedExpense.staffName}</p>
                  </div>
                )}
                {selectedExpense.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-lg">{selectedExpense.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the expense record for {selectedExpense?.description}? 
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
