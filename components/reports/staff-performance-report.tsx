"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, TrendingUp, DollarSign, Users, MoreHorizontal, Eye, Calendar, Target, Award, BarChart3, ChevronDown, Receipt, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UsersAPI, SalesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

interface StaffMember {
  _id: string
  id?: string
  firstName: string
  lastName: string
  name: string
  email: string
  mobile: string
  role: string
  isActive: boolean
  hasLoginAccess: boolean
  allowAppointmentScheduling: boolean
  specialties: string[]
  commissionRate?: number
  serviceCommissionRate?: number
  productCommissionRate?: number
}

interface StaffPerformanceData {
  staffId: string
  staffName: string
  totalRevenue: number
  serviceCount: number
  productCount: number
  totalTransactions: number
  averageTransactionValue: number
  commissionEarned: number
  customerCount: number
  repeatCustomers: number
  lastActivity: string
  performanceScore: number
}

interface SalesRecord {
  id: string
  billNo: string
  customerName: string
  date: string
  netTotal: number
  taxAmount: number
  grossTotal: number
  staffName: string
  items: Array<{
    name: string
    type: string
    quantity: number
    price: number
    total: number
    staffName: string
  }>
}

type DatePeriod = "today" | "yesterday" | "last7days" | "last30days" | "currentMonth" | "all"

export function StaffPerformanceReport() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("today")
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [performanceData, setPerformanceData] = useState<StaffPerformanceData[]>([])
  const [salesData, setSalesData] = useState<SalesRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [selectedStaffForCommission, setSelectedStaffForCommission] = useState<StaffMember | null>(null)
  const [commissionRates, setCommissionRates] = useState({
    serviceRate: 0,
    productRate: 0
  })

  // Load staff members
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await UsersAPI.getAll()
        if (response.success) {
          setStaffMembers(response.data)
        }
      } catch (error) {
        console.error("Error loading staff:", error)
        toast({
          title: "Error",
          description: "Failed to load staff members",
          variant: "destructive"
        })
      }
    }
    loadStaff()
  }, [toast])

  // Load performance data
  useEffect(() => {
    const loadPerformanceData = async () => {
      setIsLoading(true)
      try {
        // Calculate date range based on period
        const now = new Date()
        let startDate: Date
        let endDate: Date = now

        switch (datePeriod) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case "yesterday":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case "last7days":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case "last30days":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case "currentMonth":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0) // All time
        }

        // Use custom date range if set
        if (dateRange.from && dateRange.to) {
          startDate = dateRange.from
          endDate = dateRange.to
        }

        // Fetch sales data
        const salesResponse = await SalesAPI.getAll()
        if (salesResponse.success) {
          const allSales = salesResponse.data
          
          // Filter sales by date range
          const filteredSales = allSales.filter((sale: any) => {
            const saleDate = new Date(sale.date)
            return saleDate >= startDate && saleDate <= endDate
          })

          setSalesData(filteredSales)

          // Calculate performance data for each staff member
          const performanceMap = new Map<string, StaffPerformanceData>()

          // Initialize performance data for all staff
          staffMembers.forEach(staff => {
            const staffId = staff._id || staff.id
            performanceMap.set(staffId, {
              staffId,
              staffName: staff.name,
              totalRevenue: 0,
              serviceCount: 0,
              productCount: 0,
              totalTransactions: 0,
              averageTransactionValue: 0,
              commissionEarned: 0,
              customerCount: 0,
              repeatCustomers: 0,
              lastActivity: "",
              performanceScore: 0
            })
          })

          // Process sales data
          const customerStaffMap = new Map<string, Set<string>>() // customer -> staff set
          const staffCustomers = new Map<string, Set<string>>() // staff -> customer set

          filteredSales.forEach((sale: any) => {
            const staffId = sale.staffId || sale.staffName
            const staffData = performanceMap.get(staffId)
            
            if (staffData) {
              // Update revenue and transaction count
              staffData.totalRevenue += sale.grossTotal || sale.netTotal || 0
              staffData.totalTransactions += 1
              staffData.lastActivity = sale.date

              // Count services and products
              if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach((item: any) => {
                  if (item.type === "service") {
                    staffData.serviceCount += item.quantity || 1
                  } else if (item.type === "product") {
                    staffData.productCount += item.quantity || 1
                  }
                })
              }

              // Track customers
              const customerId = sale.customerId || sale.customerName
              if (customerId) {
                if (!staffCustomers.has(staffId)) {
                  staffCustomers.set(staffId, new Set())
                }
                staffCustomers.get(staffId)!.add(customerId)

                if (!customerStaffMap.has(customerId)) {
                  customerStaffMap.set(customerId, new Set())
                }
                customerStaffMap.get(customerId)!.add(staffId)
              }
            }
          })

          // Calculate additional metrics
          performanceMap.forEach((data, staffId) => {
            // Calculate average transaction value
            if (data.totalTransactions > 0) {
              data.averageTransactionValue = data.totalRevenue / data.totalTransactions
            }

            // Calculate customer metrics
            const customers = staffCustomers.get(staffId) || new Set()
            data.customerCount = customers.size

            // Calculate repeat customers (customers who have multiple transactions with this staff)
            let repeatCustomers = 0
            customers.forEach(customerId => {
              const staffSet = customerStaffMap.get(customerId)
              if (staffSet && staffSet.size > 1) {
                repeatCustomers++
              }
            })
            data.repeatCustomers = repeatCustomers

            // Calculate performance score (simple scoring system)
            data.performanceScore = Math.min(100, 
              (data.totalRevenue / 1000) * 10 + // Revenue component
              (data.totalTransactions * 2) + // Transaction component
              (data.customerCount * 5) + // Customer component
              (data.repeatCustomers * 10) // Repeat customer component
            )

            // Calculate commission (simplified - 5% of revenue)
            data.commissionEarned = data.totalRevenue * 0.05
          })

          // Convert to array and sort by performance score
          const performanceArray = Array.from(performanceMap.values())
            .sort((a, b) => b.performanceScore - a.performanceScore)

          setPerformanceData(performanceArray)
        }
      } catch (error) {
        console.error("Error loading performance data:", error)
        toast({
          title: "Error",
          description: "Failed to load performance data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (staffMembers.length > 0) {
      loadPerformanceData()
    }
  }, [staffMembers, datePeriod, dateRange, toast])

  // Filter performance data based on search and staff selection
  const filteredPerformanceData = performanceData.filter(data => {
    const matchesSearch = data.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStaff = selectedStaff === "all" || data.staffId === selectedStaff
    return matchesSearch && matchesStaff
  })

  // Calculate summary statistics
  const totalRevenue = performanceData.reduce((sum, data) => sum + data.totalRevenue, 0)
  const totalTransactions = performanceData.reduce((sum, data) => sum + data.totalTransactions, 0)
  const totalCommission = performanceData.reduce((sum, data) => sum + data.commissionEarned, 0)
  const averagePerformanceScore = performanceData.length > 0 
    ? performanceData.reduce((sum, data) => sum + data.performanceScore, 0) / performanceData.length 
    : 0

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text("Staff Performance Report", 14, 22)
    
    // Date range
    doc.setFontSize(10)
    const dateRangeText = dateRange.from && dateRange.to 
      ? `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
      : `Period: ${datePeriod}`
    doc.text(dateRangeText, 14, 30)
    
    // Summary
    doc.setFontSize(12)
    doc.text("Summary", 14, 40)
    doc.setFontSize(10)
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, 50)
    doc.text(`Total Transactions: ${totalTransactions}`, 14, 58)
    doc.text(`Total Commission: $${totalCommission.toFixed(2)}`, 14, 66)
    doc.text(`Average Performance Score: ${averagePerformanceScore.toFixed(1)}`, 14, 74)
    
    // Table
    const tableData = filteredPerformanceData.map(data => [
      data.staffName,
      `$${data.totalRevenue.toFixed(2)}`,
      data.totalTransactions.toString(),
      data.serviceCount.toString(),
      data.productCount.toString(),
      `$${data.averageTransactionValue.toFixed(2)}`,
      `$${data.commissionEarned.toFixed(2)}`,
      data.performanceScore.toFixed(1)
    ])
    
    autoTable(doc, {
      head: [["Staff", "Revenue", "Transactions", "Services", "Products", "Avg. Transaction", "Commission", "Score"]],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`staff-performance-report-${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPerformanceData.map(data => ({
        "Staff Name": data.staffName,
        "Total Revenue": data.totalRevenue,
        "Total Transactions": data.totalTransactions,
        "Service Count": data.serviceCount,
        "Product Count": data.productCount,
        "Average Transaction Value": data.averageTransactionValue,
        "Commission Earned": data.commissionEarned,
        "Customer Count": data.customerCount,
        "Repeat Customers": data.repeatCustomers,
        "Performance Score": data.performanceScore,
        "Last Activity": data.lastActivity
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Performance")
    
    XLSX.writeFile(workbook, `staff-performance-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const handleSetCommission = (staff: StaffMember) => {
    setSelectedStaffForCommission(staff)
    setCommissionRates({
      serviceRate: staff.serviceCommissionRate || 0,
      productRate: staff.productCommissionRate || 0
    })
    setShowCommissionModal(true)
  }

  const handleSaveCommission = async () => {
    if (!selectedStaffForCommission) return

    try {
      // Update staff commission rates
      const updatedStaff = {
        ...selectedStaffForCommission,
        serviceCommissionRate: commissionRates.serviceRate,
        productCommissionRate: commissionRates.productRate
      }

      const response = await UsersAPI.update(selectedStaffForCommission._id, updatedStaff)
      if (response.success) {
        // Update local state
        setStaffMembers(prev => 
          prev.map(staff => 
            staff._id === selectedStaffForCommission._id ? updatedStaff : staff
          )
        )
        
        toast({
          title: "Success",
          description: "Commission rates updated successfully"
        })
        setShowCommissionModal(false)
      }
    } catch (error) {
      console.error("Error updating commission rates:", error)
      toast({
        title: "Error",
        description: "Failed to update commission rates",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across all staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Commission earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePerformanceScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Performance score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staffMembers.map((staff) => (
              <SelectItem key={staff._id || staff.id} value={staff._id || staff.id}>
                {staff.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={datePeriod} onValueChange={(value: DatePeriod) => setDatePeriod(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="currentMonth">Current Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Custom Range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance Details</CardTitle>
          <CardDescription>
            Detailed performance metrics for each staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Avg. Transaction</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerformanceData.map((data) => (
                  <TableRow key={data.staffId}>
                    <TableCell className="font-medium">{data.staffName}</TableCell>
                    <TableCell>${data.totalRevenue.toFixed(2)}</TableCell>
                    <TableCell>{data.totalTransactions}</TableCell>
                    <TableCell>{data.serviceCount}</TableCell>
                    <TableCell>{data.productCount}</TableCell>
                    <TableCell>${data.averageTransactionValue.toFixed(2)}</TableCell>
                    <TableCell>${data.commissionEarned.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{data.customerCount}</span>
                        <span className="text-xs text-gray-500">
                          {data.repeatCustomers} repeat
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, data.performanceScore)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {data.performanceScore.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleSetCommission(staffMembers.find(s => (s._id || s.id) === data.staffId)!)}>
                            <Award className="h-4 w-4 mr-2" />
                            Set Commission
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Commission Modal */}
      <Dialog open={showCommissionModal} onOpenChange={setShowCommissionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Commission Rates</DialogTitle>
            <DialogDescription>
              Set commission rates for {selectedStaffForCommission?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Service Commission Rate (%)</label>
              <Input
                type="number"
                value={commissionRates.serviceRate}
                onChange={(e) => setCommissionRates(prev => ({ ...prev, serviceRate: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter service commission rate"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Product Commission Rate (%)</label>
              <Input
                type="number"
                value={commissionRates.productRate}
                onChange={(e) => setCommissionRates(prev => ({ ...prev, productRate: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter product commission rate"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommissionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCommission}>
              Save Commission Rates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
