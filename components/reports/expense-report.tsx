"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, TrendingUp, DollarSign, Receipt, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
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
import { ExpensesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { useCurrency } from "@/hooks/use-currency"

interface ExpenseRecord {
  id: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  date: string
  vendor?: string
  notes?: string
}

type DatePeriod = "today" | "yesterday" | "last7days" | "last30days" | "currentMonth" | "all"

export function ExpenseReport() {
  const { toast } = useToast()
  const { formatAmount, getSymbol } = useCurrency()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("today")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [expenseData, setExpenseData] = useState<ExpenseRecord[]>([])
  const [filteredData, setFilteredData] = useState<ExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Fetch expenses from API
  useEffect(() => {
    // Set default date range to today
    const today = new Date()
    const todayRange = {
      from: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
    }
    setDateRange(todayRange)
    
    const fetchExpenses = async () => {
      setLoading(true)
      try {
        const response = await ExpensesAPI.getAll()
        if (response.success && response.data) {
          const mappedData: ExpenseRecord[] = response.data.map((expense: any) => ({
            id: expense._id || expense.id,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            paymentMethod: expense.paymentMode || expense.paymentMethod,
            date: expense.date,
            vendor: expense.vendor,
            notes: expense.notes
          }))
          setExpenseData(mappedData)
          setFilteredData(mappedData)
        } else {
          setExpenseData([])
          setFilteredData([])
        }
      } catch (error) {
        console.error('Failed to fetch expenses:', error)
        setExpenseData([])
        setFilteredData([])
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  // Listen for new expense additions to refresh the list
  useEffect(() => {
    const handleExpenseAdded = () => {
      const fetchExpenses = async () => {
        try {
          const response = await ExpensesAPI.getAll()
          if (response.success && response.data) {
            const mappedData: ExpenseRecord[] = response.data.map((expense: any) => ({
              id: expense._id || expense.id,
              category: expense.category,
              description: expense.description,
              amount: expense.amount,
              paymentMethod: expense.paymentMode || expense.paymentMethod,
              date: expense.date,
              vendor: expense.vendor,
              notes: expense.notes
            }))
            setExpenseData(mappedData)
            setFilteredData(mappedData)
          }
        } catch (error) {
          console.error('Failed to refresh expenses:', error)
        }
      }
      fetchExpenses()
    }

    window.addEventListener('expense-added', handleExpenseAdded)
    return () => window.removeEventListener('expense-added', handleExpenseAdded)
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
        return {
          from: firstDayOfMonth,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      default:
        return {}
    }
  }

  // Handle date period change
  const handleDatePeriodChange = (period: DatePeriod) => {
    setDatePeriod(period)
    if (period === "all") {
      setDateRange({})
    } else {
      setDateRange(getDateRangeFromPeriod(period))
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...expenseData]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.vendor && expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date)
        if (dateRange.from && expenseDate < dateRange.from) return false
        if (dateRange.to && expenseDate > dateRange.to) return false
        return true
      })
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
    }

    // Payment method filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(expense => expense.paymentMethod === paymentFilter)
    }

    setFilteredData(filtered)
  }, [expenseData, searchTerm, dateRange, categoryFilter, paymentFilter])

  // Calculate stats
  const calculateStats = () => {
    const totalExpenses = filteredData.length
    const totalAmount = filteredData.reduce((sum, expense) => sum + expense.amount, 0)
    const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0

    return {
      totalExpenses,
      totalAmount,
      averageExpense
    }
  }

  const stats = calculateStats()

  // Handle export
  const handleExport = () => {
    const csvContent = [
      ['Category', 'Description', 'Amount', 'Payment Method', 'Date', 'Vendor', 'Notes'],
      ...filteredData.map(expense => [
        expense.category,
        expense.description,
        expense.amount.toString(),
        expense.paymentMethod,
        format(new Date(expense.date), 'yyyy-MM-dd'),
        expense.vendor || '',
        expense.notes || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Handle view expense
  const handleViewExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(expense)
    setIsViewDialogOpen(true)
  }

  // Handle edit expense
  const handleEditExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(expense)
    setIsEditDialogOpen(true)
  }

  // Handle delete expense
  const handleDeleteExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(expense)
    setIsDeleteDialogOpen(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedExpense) return

    try {
      const response = await ExpensesAPI.delete(selectedExpense.id)
      if (response.success) {
        setExpenseData(prev => prev.filter(exp => exp.id !== selectedExpense.id))
        setFilteredData(prev => prev.filter(exp => exp.id !== selectedExpense.id))
        toast({
          title: "Success",
          description: "Expense deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete expense",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedExpense(null)
    }
  }



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Expense Report</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">...</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center py-8">Loading expenses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expense Report</h1>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpenses}</div>
            <p className="text-xs text-muted-foreground">
              {datePeriod === "all" ? "All time" : `This ${datePeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                            <div className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {datePeriod === "all" ? "All time" : `This ${datePeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                            <div className="text-2xl font-bold">{formatAmount(stats.averageExpense)}</div>
            <p className="text-xs text-muted-foreground">
              {datePeriod === "all" ? "All time" : `This ${datePeriod}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Period */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Period</label>
              <Select value={datePeriod} onValueChange={(value: DatePeriod) => handleDatePeriodChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="currentMonth">Current Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                    onSelect={(range) => setDateRange(range || {})}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Professional Services">Professional Services</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Digital Wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {expenseData.length} expenses
        </p>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Detailed view of all expenses with filtering and search capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={expense.description}>
                      {expense.description}
                    </TableCell>
                    <TableCell className="font-mono">{formatAmount(expense.amount)}</TableCell>
                    <TableCell>{expense.paymentMethod}</TableCell>
                    <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewExpense(expense)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteExpense(expense)}
                            className="text-red-600"
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
          )}
        </CardContent>
      </Card>

      {/* View Expense Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              View detailed information about this expense
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-sm text-muted-foreground">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="text-sm font-mono">{formatAmount(selectedExpense.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <p className="text-sm text-muted-foreground">{selectedExpense.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedExpense.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                {selectedExpense.vendor && (
                  <div>
                    <label className="text-sm font-medium">Vendor</label>
                    <p className="text-sm text-muted-foreground">{selectedExpense.vendor}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedExpense.description}</p>
              </div>
              {selectedExpense.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedExpense.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense information below
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <ExpenseForm 
              expense={selectedExpense} 
              isEditMode={true}
              onClose={() => {
                setIsEditDialogOpen(false)
                setSelectedExpense(null)
                // Refresh the expenses list after edit
                const fetchExpenses = async () => {
                  try {
                    const response = await ExpensesAPI.getAll()
                    if (response.success && response.data) {
                      const mappedData: ExpenseRecord[] = response.data.map((expense: any) => ({
                        id: expense._id || expense.id,
                        category: expense.category,
                        description: expense.description,
                        amount: expense.amount,
                        paymentMethod: expense.paymentMode || expense.paymentMethod,
                        date: expense.date,
                        vendor: expense.vendor,
                        notes: expense.notes
                      }))
                      setExpenseData(mappedData)
                      setFilteredData(mappedData)
                    }
                  } catch (error) {
                    console.error('Failed to refresh expenses:', error)
                  }
                }
                fetchExpenses()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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