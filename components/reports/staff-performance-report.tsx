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
import type { DateRange } from "react-day-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UsersAPI, SalesAPI, StaffPerformanceAPI, SettingsAPI } from "@/lib/api"
import { CommissionCalculator, CommissionConfig, StaffCommissionSummary } from "@/lib/commission-calculator"
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
  serviceRevenue: number
  productRevenue: number
  serviceCount: number
  productCount: number
  totalTransactions: number
  serviceCommission: number
  productCommission: number
  totalCommission: number
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

type DatePeriod = "currentMonth" | "previousMonth" | "customRange"

// Utility function to format currency
const formatCurrency = (amount: number, symbol: string) => {
  return `${symbol}${amount.toFixed(2)}`
}

export function StaffPerformanceReport() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("currentMonth")
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [performanceData, setPerformanceData] = useState<StaffPerformanceData[]>([])
  const [commissionData, setCommissionData] = useState<StaffCommissionSummary[]>([])
  const [salesData, setSalesData] = useState<SalesRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [selectedStaffForCommission, setSelectedStaffForCommission] = useState<StaffMember | null>(null)
  const [commissionRates, setCommissionRates] = useState({
    serviceRate: 0,
    productRate: 0
  })
  const [defaultCommissionConfig, setDefaultCommissionConfig] = useState<CommissionConfig>(
    CommissionCalculator.getDefaultConfig()
  )
  const [paymentSettings, setPaymentSettings] = useState<any>(null)
  const [currencySymbol, setCurrencySymbol] = useState("$")

  // Load staff members and payment settings
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load staff members
        const staffResponse = await UsersAPI.getAll()
        if (staffResponse.success) {
          setStaffMembers(staffResponse.data)
        }

        // Load payment settings for currency
        const paymentResponse = await SettingsAPI.getPaymentSettings()
        if (paymentResponse.success) {
          setPaymentSettings(paymentResponse.data)
          setCurrencySymbol(paymentResponse.data.currencySymbol || "$")
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive"
        })
      }
    }
    loadInitialData()
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
          case "currentMonth":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of current month
            break
          case "previousMonth":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month
            break
          case "customRange":
            // Use custom date range if set, otherwise default to current month
            if (dateRange?.from && dateRange?.to) {
              startDate = dateRange.from
              endDate = dateRange.to
            } else {
              startDate = new Date(now.getFullYear(), now.getMonth(), 1)
              endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            }
            break
          default: // fallback to current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
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
            if (!staffId) return
            performanceMap.set(staffId, {
              staffId,
              staffName: staff.name,
              totalRevenue: 0,
              serviceRevenue: 0,
              productRevenue: 0,
              serviceCount: 0,
              productCount: 0,
              totalTransactions: 0,
              serviceCommission: 0,
              productCommission: 0,
              totalCommission: 0,
              customerCount: 0,
              repeatCustomers: 0,
              lastActivity: "",
              performanceScore: 0
            })
          })

          // Process sales data with proper staff attribution
          const customerStaffMap = new Map<string, Set<string>>() // customer -> staff set
          const staffCustomers = new Map<string, Set<string>>() // staff -> customer set
          const staffServiceRevenue = new Map<string, number>() // staff -> service revenue
          const staffProductRevenue = new Map<string, number>() // staff -> product revenue

          filteredSales.forEach((sale: any) => {
            // Process each item in the sale to get accurate staff attribution
            if (sale.items && Array.isArray(sale.items)) {
              sale.items.forEach((item: any) => {
                const itemStaffId = item.staffId || item.staffName || sale.staffId || sale.staffName
                const staffData = performanceMap.get(itemStaffId)
                
                if (staffData) {
                  // Update transaction count (only once per sale)
                  if (sale.items.indexOf(item) === 0) {
                    staffData.totalTransactions += 1
                    staffData.lastActivity = sale.date
                  }

                  // Update revenue and counts based on item type
                  if (item.type === "service") {
                    staffData.serviceCount += item.quantity || 1
                    const itemRevenue = item.total || (item.price * (item.quantity || 1))
                    staffData.totalRevenue += itemRevenue
                    
                    // Track service revenue separately
                    const currentServiceRevenue = staffServiceRevenue.get(itemStaffId) || 0
                    staffServiceRevenue.set(itemStaffId, currentServiceRevenue + itemRevenue)
                  } else if (item.type === "product") {
                    staffData.productCount += item.quantity || 1
                    const itemRevenue = item.total || (item.price * (item.quantity || 1))
                    staffData.totalRevenue += itemRevenue
                    
                    // Track product revenue separately
                    const currentProductRevenue = staffProductRevenue.get(itemStaffId) || 0
                    staffProductRevenue.set(itemStaffId, currentProductRevenue + itemRevenue)
                  }

                  // Track customers
                  const customerId = sale.customerId || sale.customerName
                  if (customerId) {
                    if (!staffCustomers.has(itemStaffId)) {
                      staffCustomers.set(itemStaffId, new Set())
                    }
                    staffCustomers.get(itemStaffId)!.add(customerId)

                    if (!customerStaffMap.has(customerId)) {
                      customerStaffMap.set(customerId, new Set())
                    }
                    customerStaffMap.get(customerId)!.add(itemStaffId)
                  }
                }
              })
            }
          })

          // Calculate additional metrics and commission
          performanceMap.forEach((data, staffId) => {
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

            // Calculate performance score (enhanced scoring system)
            data.performanceScore = Math.min(100, 
              (data.totalRevenue / 1000) * 10 + // Revenue component
              (data.totalTransactions * 2) + // Transaction component
              (data.customerCount * 5) + // Customer component
              (data.repeatCustomers * 10) + // Repeat customer component
              (data.serviceCount * 0.5) + // Service component
              (data.productCount * 0.3) // Product component
            )

            // Set service and product revenue
            data.serviceRevenue = staffServiceRevenue.get(staffId) || 0
            data.productRevenue = staffProductRevenue.get(staffId) || 0

            // Calculate commission based on actual service and product revenue
            if (data.totalRevenue > 0) {
              const staff = staffMembers.find(s => (s._id || s.id) === staffId)
              const serviceCommissionRate = staff?.serviceCommissionRate ?? defaultCommissionConfig.serviceCommissionRate
              const productCommissionRate = staff?.productCommissionRate ?? defaultCommissionConfig.productCommissionRate
              
              // Calculate commission separately for services and products
              data.serviceCommission = (data.serviceRevenue * serviceCommissionRate) / 100
              data.productCommission = (data.productRevenue * productCommissionRate) / 100
              data.totalCommission = data.serviceCommission + data.productCommission
            } else {
              data.serviceCommission = 0
              data.productCommission = 0
              data.totalCommission = 0
            }
          })

          // Convert to array and sort by performance score
          const performanceArray = Array.from(performanceMap.values())
            .sort((a, b) => b.performanceScore - a.performanceScore)

          setPerformanceData(performanceArray)

          // Calculate commission data using the new commission calculator
          const commissionSummaries = CommissionCalculator.calculateAllStaffCommissionSummary(
            filteredSales,
            staffMembers,
            defaultCommissionConfig
          )
          setCommissionData(commissionSummaries)
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
  const totalCommission = performanceData.reduce((sum, data) => sum + data.totalCommission, 0)
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
    const dateRangeText = dateRange?.from && dateRange?.to 
      ? `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
      : `Period: ${datePeriod}`
    doc.text(dateRangeText, 14, 30)
    
    // Summary
    doc.setFontSize(12)
    doc.text("Summary", 14, 40)
    doc.setFontSize(10)
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue, currencySymbol)}`, 14, 50)
    doc.text(`Total Transactions: ${totalTransactions}`, 14, 58)
    doc.text(`Total Commission: ${formatCurrency(totalCommission, currencySymbol)}`, 14, 66)
    doc.text(`Average Performance Score: ${averagePerformanceScore.toFixed(1)}`, 14, 74)
    
    // Table
    const tableData = filteredPerformanceData.map(data => [
      data.staffName,
      formatCurrency(data.totalRevenue, currencySymbol),
      formatCurrency(data.serviceRevenue, currencySymbol),
      formatCurrency(data.productRevenue, currencySymbol),
      data.totalTransactions.toString(),
      data.serviceCount.toString(),
      data.productCount.toString(),
      formatCurrency(data.serviceCommission, currencySymbol),
      formatCurrency(data.productCommission, currencySymbol),
      formatCurrency(data.totalCommission, currencySymbol),
      data.customerCount.toString(),
      data.performanceScore.toFixed(1)
    ])
    
    autoTable(doc, {
      head: [["Staff", "Total Revenue", "Service Revenue", "Product Revenue", "Transactions", "Services", "Products", "Service Commission", "Product Commission", "Total Commission", "Customers", "Score"]],
      body: tableData,
      startY: 85,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`staff-performance-report-${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPerformanceData.map(data => ({
        "Staff Name": data.staffName,
        "Total Revenue": data.totalRevenue,
        "Service Revenue": data.serviceRevenue,
        "Product Revenue": data.productRevenue,
        "Total Transactions": data.totalTransactions,
        "Service Count": data.serviceCount,
        "Product Count": data.productCount,
        "Service Commission": data.serviceCommission,
        "Product Commission": data.productCommission,
        "Total Commission": data.totalCommission,
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
      serviceRate: staff.serviceCommissionRate || defaultCommissionConfig.serviceCommissionRate,
      productRate: staff.productCommissionRate || defaultCommissionConfig.productCommissionRate
    })
    setShowCommissionModal(true)
  }

  const handleSaveCommission = async () => {
    if (!selectedStaffForCommission) return

    try {
      // Validate commission rates
      const config: CommissionConfig = {
        serviceCommissionRate: commissionRates.serviceRate,
        productCommissionRate: commissionRates.productRate
      }

      const validation = CommissionCalculator.validateConfig(config)
      if (!validation.isValid) {
        toast({
          title: "Invalid Commission Rates",
          description: validation.errors.join(", "),
          variant: "destructive"
        })
        return
      }

      // Update commission rates using the new API
      const staffId = selectedStaffForCommission._id || selectedStaffForCommission.id
      if (!staffId) {
        toast({
          title: "Error",
          description: "Staff ID not found",
          variant: "destructive"
        })
        return
      }

      const response = await StaffPerformanceAPI.updateCommissionRates(staffId, {
        serviceCommissionRate: commissionRates.serviceRate,
        productCommissionRate: commissionRates.productRate
      })

      if (response.success) {
        // Update local state
        const updatedStaff = {
          ...selectedStaffForCommission,
          serviceCommissionRate: commissionRates.serviceRate,
          productCommissionRate: commissionRates.productRate
        }

        setStaffMembers(prev => 
          prev.map(staff => 
            staff._id === selectedStaffForCommission._id ? updatedStaff : staff
          )
        )
        
        // Refresh performance data to reflect new commission rates
        const loadPerformanceData = async () => {
          // This will trigger a re-calculation with new commission rates
          // The useEffect will automatically reload when staffMembers changes
        }
        loadPerformanceData()
        
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
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currencySymbol)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(totalCommission, currencySymbol)}</div>
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
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search staff..."
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
              {staffMembers.map((staff) => {
                const staffId = staff._id || staff.id
                if (!staffId) return null
                return (
                  <SelectItem key={staffId} value={staffId}>
                    {staff.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Select value={datePeriod} onValueChange={(value: DatePeriod) => {
            setDatePeriod(value)
            if (value !== "customRange") {
              setDateRange(undefined) // Clear custom range when selecting other options
            }
          }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="currentMonth">Current Month</SelectItem>
              <SelectItem value="previousMonth">Previous Month</SelectItem>
              <SelectItem value="customRange">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {datePeriod === "customRange" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-48 justify-start text-left font-normal h-10"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={(date) => setDateRange(prev => ({ from: date, to: prev?.to }))}
                    disabled={(date) => date > new Date() || (dateRange?.to ? date > dateRange.to : false)}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-48 justify-start text-left font-normal h-10"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="single"
                    selected={dateRange?.to}
                    onSelect={(date) => setDateRange(prev => ({ from: prev?.from, to: date }))}
                    disabled={(date) => date > new Date() || (dateRange?.from ? date < dateRange.from : false)}
                  />
                </PopoverContent>
              </Popover>

              <Button 
                size="sm" 
                onClick={() => setDateRange(undefined)}
                variant="outline"
                className="h-10 px-4 w-full sm:w-auto"
              >
                Clear
              </Button>
            </>
          )}
        </div>

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
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Service Revenue</TableHead>
                  <TableHead>Product Revenue</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Service Commission</TableHead>
                  <TableHead>Product Commission</TableHead>
                  <TableHead>Total Commission</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerformanceData.map((data) => (
                  <TableRow key={data.staffId}>
                    <TableCell className="font-medium">{data.staffName}</TableCell>
                    <TableCell>{formatCurrency(data.totalRevenue, currencySymbol)}</TableCell>
                    <TableCell>{formatCurrency(data.serviceRevenue, currencySymbol)}</TableCell>
                    <TableCell>{formatCurrency(data.productRevenue, currencySymbol)}</TableCell>
                    <TableCell>{data.totalTransactions}</TableCell>
                    <TableCell>{data.serviceCount}</TableCell>
                    <TableCell>{data.productCount}</TableCell>
                    <TableCell>{formatCurrency(data.serviceCommission, currencySymbol)}</TableCell>
                    <TableCell>{formatCurrency(data.productCommission, currencySymbol)}</TableCell>
                    <TableCell>{formatCurrency(data.totalCommission, currencySymbol)}</TableCell>
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
