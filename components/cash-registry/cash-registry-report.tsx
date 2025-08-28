"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Download, Filter, TrendingUp, DollarSign, Users, MoreHorizontal, Eye, Pencil, Trash2, Banknote, Calendar, Clock, CreditCard, Receipt, RefreshCw, CheckCircle, Clock as ClockIcon } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { CashRegistryAPI, ExpensesAPI, SalesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { CashRegistryModal } from "./cash-registry-modal"
import { VerificationModal } from "./verification-modal"

interface CashRegistryEntry {
  id: string
  date: string
  shiftType: "opening" | "closing"
  createdBy: string
  openingBalance: number
  closingBalance: number
  totalBalance: number
  denominations: Array<{
    value: number
    count: number
    total: number
  }>
  closingDenominations?: Array<{
    value: number
    count: number
    total: number
  }>
  onlineCash: number
  posCash: number
  balanceDifference: number
  onlinePosDifference: number
  status: "active" | "closed" | "verified"
  isVerified: boolean
  createdAt: string
}

type DatePeriod = "today" | "yesterday" | "last7days" | "last30days" | "currentMonth" | "all"

interface CashRegistryReportProps {
  isVerificationModalOpen: boolean
  onVerificationModalChange: (open: boolean) => void
}

export function CashRegistryReport({ isVerificationModalOpen, onVerificationModalChange }: CashRegistryReportProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("today")
  const [shiftFilter, setShiftFilter] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("activity")
  const [cashRegistryData, setCashRegistryData] = useState<CashRegistryEntry[]>([])
  const [expensesData, setExpensesData] = useState<{ [date: string]: number }>({})
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<CashRegistryEntry | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDenominationsModalOpen, setIsDenominationsModalOpen] = useState(false)
  const [selectedDenominationsEntry, setSelectedDenominationsEntry] = useState<CashRegistryEntry | null>(null)
  const [selectedDenominationsType, setSelectedDenominationsType] = useState<"opening" | "closing">("opening")
  const [isDeletingDailySummary, setIsDeletingDailySummary] = useState(false)
  const [selectedSummaryDate, setSelectedSummaryDate] = useState<string | null>(null)

  // State for daily summaries (populated when "Verified and Close" is clicked)
  const [dailySummaries, setDailySummaries] = useState<Array<{
    date: string
    openingBalance: number
    cashCollected: number
    expense: number
    cashBalance: number
    closingBalance: number
    cashDifference: number
    cashDifferenceReason?: string
    totalOnlineSales: number
    cashInPos: number
    onlineCashDifference: number
    onlineCashDifferenceReason?: string
    isVerified: boolean
    verifiedAt: string
    verifiedBy: string
  }>>([])

  // Generate daily summaries from existing cash registry data
  const generateDailySummaries = useCallback(() => {
    console.log("🔄 generateDailySummaries called with:", {
      cashRegistryDataLength: cashRegistryData.length,
      salesDataLength: salesData.length,
      expensesDataKeys: Object.keys(expensesData)
    })
    
    console.log("📊 Sample cashRegistryData:", cashRegistryData.slice(0, 2))
    console.log("📊 Sample salesData:", salesData.slice(0, 2))
    console.log("📊 Sample expensesData:", Object.entries(expensesData).slice(0, 2))
    
    if (!cashRegistryData.length || !salesData.length) {
      console.log("❌ Cannot generate summaries - missing data")
      return
    }
    
    // Group entries by date
    const entriesByDate: { [date: string]: { opening?: any; closing?: any } } = {}
    
    cashRegistryData.forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0]
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = {}
      }
      
      if (entry.shiftType === 'opening') {
        entriesByDate[dateKey].opening = entry
      } else if (entry.shiftType === 'closing') {
        entriesByDate[dateKey].closing = entry
      }
    })

    // Generate summaries for each date
    const summaries = Object.entries(entriesByDate).map(([dateKey, entries]) => {
      const openingEntry = entries.opening
      const closingEntry = entries.closing
      
      // Get sales data for this date
      const dateSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0]
        return saleDate === dateKey
      })
      
      console.log(`🔍 Date ${dateKey}: Found ${dateSales.length} sales`, dateSales)
      
      const cashSales = dateSales
        .filter(sale => {
          if (sale.payments && sale.payments.length > 0) {
            // New split payment structure
            const hasCashPayment = sale.payments.some((payment: any) => 
              payment.mode?.toLowerCase() === 'cash' || payment.mode === 'Cash'
            )
            console.log(`💰 Sale ${sale._id}: payments=${JSON.stringify(sale.payments)}, hasCashPayment=${hasCashPayment}`)
            return hasCashPayment
          } else {
            // Legacy single payment mode
            const isCashPayment = sale.paymentMode?.toLowerCase() === 'cash' || sale.paymentMode === 'Cash'
            console.log(`💰 Sale ${sale._id}: paymentMode=${sale.paymentMode}, isCashPayment=${isCashPayment}`)
            return isCashPayment
          }
        })
        .reduce((sum, sale) => {
          if (sale.payments && sale.payments.length > 0) {
            // Get cash amount from split payments
            const cashAmount = sale.payments
              .filter((payment: any) => 
                payment.mode?.toLowerCase() === 'cash' || payment.mode === 'Cash'
              )
              .reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0)
            console.log(`💵 Sale ${sale._id}: cashAmount=${cashAmount}`)
            return sum + cashAmount
          } else {
            // Legacy single payment mode
            const cashAmount = sale.netTotal || 0
            console.log(`💵 Sale ${sale._id}: cashAmount=${cashAmount}`)
            return sum + cashAmount
          }
        }, 0)
      
      console.log(`💵 Total cashSales for ${dateKey}: ${cashSales}`)
      
      const openingBalance = openingEntry?.openingBalance || 0
      const closingBalance = closingEntry?.closingBalance || 0
      
      // Use real-time values directly from stats cards for consistency
      const cashCollected = getRealTimeCashSales() // This gives us ₹1800.00
      const expense = getRealTimeExpenses() // This gives us ₹200.00
      const cashBalance = openingBalance + cashCollected - expense
      const cashDifference = closingBalance - cashBalance
      const cashInPos = closingEntry?.posCash || 0
      const onlineSales = getRealTimeOnlineSales() // This gives us ₹1400.00
      const onlineCashDifference = cashInPos - onlineSales
      
      const summary = {
        date: dateKey,
        openingBalance,
        cashCollected,
        expense,
        cashBalance,
        closingBalance,
        cashDifference,
        cashDifferenceReason: closingEntry?.balanceDifferenceReason || '',
        totalOnlineSales: onlineSales,
        cashInPos,
        onlineCashDifference,
        onlineCashDifferenceReason: closingEntry?.onlineCashDifferenceReason || '',
        isVerified: closingEntry?.isVerified || false,
        verifiedAt: closingEntry?.verifiedAt || '',
        verifiedBy: closingEntry?.verifiedBy || ''
      }
      
      console.log(`📊 Summary for ${dateKey}:`, summary)
      return summary
    })

    console.log("📊 Generated daily summaries:", summaries)
    console.log("📊 Summary count:", summaries.length)
    console.log("📊 Setting dailySummaries state...")
    setDailySummaries(summaries)
    console.log("✅ Daily summaries state updated")
  }, [cashRegistryData, salesData, expensesData])

  // Get today's closing entry for verification
  const todayClosingEntry = cashRegistryData.find(entry => {
    const today = new Date()
    const entryDate = new Date(entry.date)
    return entry.shiftType === "closing" && 
           entryDate.getDate() === today.getDate() &&
           entryDate.getMonth() === today.getMonth() &&
           entryDate.getFullYear() === today.getFullYear()
  })

  // Handle verification
  const handleVerification = async (data: { entryId: string; balanceDifferenceReason?: string; onlinePosDifferenceReason?: string }) => {
    try {
      const response = await CashRegistryAPI.verify(data.entryId, {
        verificationNotes: data.balanceDifferenceReason || data.onlinePosDifferenceReason ? 
          `Cash Difference: ${data.balanceDifferenceReason || 'None'}, Online Difference: ${data.onlinePosDifferenceReason || 'None'}` : 
          'Registry verified with no differences',
        balanceDifferenceReason: data.balanceDifferenceReason,
        onlineCashDifferenceReason: data.onlinePosDifferenceReason,
      })

      if (response.success) {
        // Create daily summary from the verified entry
        if (todayClosingEntry) {
          const today = new Date()
          const dateKey = today.toISOString().split('T')[0] // YYYY-MM-DD format
          
          // Get today's opening entry
          const todayOpeningEntry = cashRegistryData.find(entry => {
            const entryDate = new Date(entry.date)
            return entry.shiftType === "opening" && 
                   entryDate.getDate() === today.getDate() &&
                   entryDate.getMonth() === today.getMonth() &&
                   entryDate.getFullYear() === today.getFullYear()
          })

          // Calculate values for the summary using real-time data
          const openingBalance = todayOpeningEntry?.openingBalance || 0
          const closingBalance = todayClosingEntry.closingBalance || 0
          const cashCollected = getRealTimeCashSales() // Use real-time function
          const expense = getRealTimeExpenses() // Use real-time function
          const cashBalance = openingBalance + cashCollected - expense
          const cashDifference = closingBalance - cashBalance
          const onlineSalesForSummary = getRealTimeOnlineSales() // Use real-time function
          const cashInPos = todayClosingEntry.posCash || 0
          const onlineCashDifference = cashInPos - onlineSalesForSummary

          // Create or update daily summary
          const newSummary = {
            date: dateKey,
            openingBalance,
            cashCollected,
            expense,
            cashBalance,
            closingBalance,
            cashDifference,
            cashDifferenceReason: data.balanceDifferenceReason,
            totalOnlineSales: onlineSalesForSummary,
            cashInPos,
            onlineCashDifference,
            onlineCashDifferenceReason: data.onlinePosDifferenceReason,
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            verifiedBy: todayClosingEntry.createdBy
          }

          setDailySummaries(prev => {
            const existingIndex = prev.findIndex(summary => summary.date === dateKey)
            if (existingIndex >= 0) {
              // Update existing summary
              const updated = [...prev]
              updated[existingIndex] = newSummary
              return updated
            } else {
              // Add new summary
              return [...prev, newSummary]
            }
          })
        }

        toast({
          title: "Success",
          description: "Cash registry has been verified and closed successfully. Summary by Day has been updated.",
        })
        // Refresh data after successful verification
        await fetchCashRegistryData()
        // Regenerate daily summaries with updated data
        setTimeout(() => {
          generateDailySummaries()
        }, 100)
        onVerificationModalChange(false)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to verify cash registry.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error verifying cash registry:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while verifying the cash registry.",
        variant: "destructive"
      })
    }
  }

  // Fetch cash registry data and set default date range
  useEffect(() => {
    const initializeData = async () => {
      await fetchCashRegistryData()
      await fetchExpensesData()
      await fetchSalesData()
    }
    
    // Set default date range to today
    const today = new Date()
    const todayRange: DateRange = {
      from: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
    }
    setDateRange(todayRange)
    console.log("Default date range set to:", todayRange)

    // Listen for cash registry save events from top navigation
    const handleCashRegistrySaved = () => {
      console.log("Cash registry saved event received, refreshing data...")
      initializeData()
    }

    window.addEventListener('cash-registry-saved', handleCashRegistrySaved)

    // Initialize data
    initializeData()
    
    // Also trigger daily summaries generation after a short delay
    setTimeout(() => {
      if (cashRegistryData.length > 0 && salesData.length > 0) {
        console.log("🔄 Manual trigger for generateDailySummaries...")
        generateDailySummaries()
      }
    }, 1000)

    return () => {
      window.removeEventListener('cash-registry-saved', handleCashRegistrySaved)
    }
  }, [])

  // Generate daily summaries when data changes
  useEffect(() => {
    console.log("🔄 useEffect triggered for daily summaries generation:", {
      cashRegistryDataLength: cashRegistryData.length,
      salesDataLength: salesData.length,
      expensesDataKeys: Object.keys(expensesData)
    })
    
    if (cashRegistryData.length > 0 && salesData.length > 0) {
      console.log("✅ Conditions met, calling generateDailySummaries...")
      generateDailySummaries()
    } else {
      console.log("❌ Conditions not met for generating daily summaries")
    }
  }, [cashRegistryData, salesData, expensesData, generateDailySummaries])



  const fetchCashRegistryData = async () => {
    setLoading(true)
    try {
      console.log("Fetching cash registry data...")
      const response = await CashRegistryAPI.getAll()
      console.log("API Response:", response)
      
      console.log("Response structure:", {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataLength: response.data?.length,
        firstEntry: response.data?.[0]
      })
      
      if (response.data && Array.isArray(response.data)) {
        const mapped = response.data.map((entry: any) => ({
          id: entry._id,
          date: entry.date,
          shiftType: entry.shiftType,
          createdBy: entry.createdBy,
          openingBalance: entry.openingBalance || 0,
          closingBalance: entry.closingBalance || 0,
          totalBalance: entry.shiftType === "opening" ? entry.openingBalance : entry.closingBalance,
          denominations: entry.denominations || [],
          closingDenominations: entry.closingDenominations || [],
          onlineCash: entry.onlineCash || 0,
          posCash: entry.posCash || 0,
          balanceDifference: entry.balanceDifference || 0,
          onlinePosDifference: entry.onlinePosDifference || 0,
          status: entry.status || "active",
          isVerified: entry.isVerified || false,
          createdAt: entry.createdAt
        }))
        // Sort by date (latest first) and then by shift type (opening first, then closing)
        const sorted = mapped.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          
          if (dateA !== dateB) {
            return dateB - dateA // Latest date first
          }
          
          // If same date, opening comes before closing
          if (a.shiftType === 'opening' && b.shiftType === 'closing') return -1
          if (a.shiftType === 'closing' && b.shiftType === 'opening') return 1
          
          return 0
        })
        
        console.log("Sorted data:", sorted)
        setCashRegistryData(sorted)
      } else {
        console.log("No data or unsuccessful response")
        setCashRegistryData([])
      }
    } catch (error) {
      console.error("Error fetching cash registry data:", error)
      setCashRegistryData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchExpensesData = async () => {
    try {
      console.log("🔄 Fetching real-time expenses data...")
      console.log("Current dateRange:", dateRange)
      
      // Fetch all expenses with a high limit to get all data
      const response = await ExpensesAPI.getAll({ 
        page: 1, 
        limit: 1000 // High limit to get all expenses
      })
      console.log("📊 Expenses API Response:", response)
      
      if (response.success && response.data) {
        console.log("✅ Expenses API successful, data length:", response.data.length)
        console.log("📄 Pagination info:", response.pagination)
        
        // Group expenses by date
        const expensesMap: { [date: string]: number } = {}
        
        response.data.forEach((expense: any, index: number) => {
          console.log(`📝 Processing expense ${index + 1}:`, {
            originalDate: expense.date,
            amount: expense.amount,
            type: typeof expense.date
          })
          
          const expenseDate = new Date(expense.date).toISOString().split('T')[0]
          if (!expensesMap[expenseDate]) {
            expensesMap[expenseDate] = 0
          }
          expensesMap[expenseDate] += expense.amount || 0
          
          console.log(`📅 Normalized expense date: ${expenseDate}, running total: ${expensesMap[expenseDate]}`)
        })
        
        console.log("🎯 Final expenses map:", expensesMap)
        console.log("📊 All expenses data loaded:", response.data.length, "expenses across", Object.keys(expensesMap).length, "dates")
        console.log("📅 Available expense dates:", Object.keys(expensesMap))
        setExpensesData(expensesMap)
      } else {
        console.log("❌ No expenses data found or API unsuccessful")
        console.log("Response success:", response.success)
        console.log("Response data:", response.data)
        setExpensesData({})
      }
    } catch (error) {
      console.error("💥 Error fetching expenses data:", error)
      setExpensesData({})
    }
  }

  const fetchSalesData = async () => {
    try {
      console.log("Fetching real-time sales data...")
      const response = await SalesAPI.getAll()
      console.log("Sales API Response:", response)
      
      if (response.success && response.data) {
        console.log("Sales data loaded:", response.data.length, "sales")
        setSalesData(response.data)
      } else {
        console.log("No sales data found")
        setSalesData([])
      }
    } catch (error) {
      console.error("Failed to fetch sales:", error)
      setSalesData([])
    }
  }

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
        return {
          from: new Date(0), // Start of epoch
          to: new Date() // Current date
        }
    }
  }

  const handleDatePeriodChange = (period: DatePeriod) => {
    setDatePeriod(period)
    const range = getDateRangeFromPeriod(period)
    setDateRange(range)
    
    // Fetch expenses for the new date range
    setTimeout(() => {
      fetchExpensesData()
    }, 100)
  }

  // Filter data for stats calculations (ALWAYS use unfiltered data, only affected by date range)
  const statsFilteredData = cashRegistryData.filter(entry => {
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      (new Date(entry.date) >= dateRange.from && new Date(entry.date) <= dateRange.to)
    
    return matchesDateRange
  })

  // Filter data for table display (affected by search, shift filter, and report type)
  const filteredData = cashRegistryData.filter(entry => {
    const matchesSearch = searchTerm === "" || 
      entry.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.date.includes(searchTerm) ||
      entry.shiftType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesShift = shiftFilter === "all" || entry.shiftType === shiftFilter
    
    // Report type filtering
    let matchesReportType = true
    if (reportType === "summary") {
      // For summary report, don't filter by entry type since generateDailySummaries handles pairing
      matchesReportType = true
    } else {
      // For activity report, show all entries
      matchesReportType = true
    }
    
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      (new Date(entry.date) >= dateRange.from && new Date(entry.date) <= dateRange.to)
    
    return matchesSearch && matchesShift && matchesReportType && matchesDateRange
  })

  // Calculate real-time stats from sales and expenses data
  const getRealTimeCashSales = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    
    return salesData.reduce((sum: number, sale: any) => {
      const saleDate = new Date(sale.date)
      if (saleDate >= dateRange.from! && saleDate <= dateRange.to!) {
        if (sale.payments && sale.payments.length > 0) {
          // Split payment structure
          return sum + sale.payments
            .filter((payment: any) => payment.mode === "Cash")
            .reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0)
        } else {
          // Legacy single payment mode
          return sum + (sale.paymentMode === "Cash" ? sale.netTotal : 0)
        }
      }
      return sum
    }, 0)
  }

  const getRealTimeOnlineSales = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    
    return salesData.reduce((sum: number, sale: any) => {
      const saleDate = new Date(sale.date)
      if (saleDate >= dateRange.from! && saleDate <= dateRange.to!) {
        if (sale.payments && sale.payments.length > 0) {
          // Split payment structure
          return sum + sale.payments
            .filter((payment: any) => payment.mode === "Card" || payment.mode === "Online")
            .reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0)
        } else {
          // Legacy single payment mode
          return sum + ((sale.paymentMode === "Card" || sale.paymentMode === "Online") ? sale.netTotal : 0)
        }
      }
      return sum
    }, 0)
  }

  const getRealTimeExpenses = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    
    return Object.entries(expensesData).reduce((sum: number, [date, amount]) => {
      const expenseDate = new Date(date)
      if (expenseDate >= dateRange.from! && expenseDate <= dateRange.to!) {
        return sum + amount
      }
      return sum
    }, 0)
  }

  // Use real-time data for stats
  const totalCashSales = getRealTimeCashSales()
  const totalOnlineSales = getRealTimeOnlineSales()
  const totalExpenses = getRealTimeExpenses()

  // Log real-time stats for debugging
  console.log("🔄 Real-time stats calculated:", {
    dateRange: dateRange,
    totalCashSales,
    totalOnlineSales,
    totalExpenses,
    salesDataCount: salesData.length,
    expensesDataCount: Object.keys(expensesData).length
  })

  // Helper functions to get real-time data for each entry
  const getEntryCashSales = (entryDate: string) => {
    // Normalize entry date to YYYY-MM-DD format
    const normalizedEntryDate = new Date(entryDate).toISOString().split('T')[0]
    
    const result = salesData.reduce((sum: number, sale: any) => {
      // Normalize sale date to YYYY-MM-DD format
      const saleDate = new Date(sale.date).toISOString().split('T')[0]
      
      if (saleDate === normalizedEntryDate) {
        if (sale.payments && sale.payments.length > 0) {
          return sum + sale.payments
            .filter((payment: any) => payment.mode === "Cash")
            .reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0)
        } else {
          return sum + (sale.paymentMode === "Cash" ? sale.netTotal : 0)
        }
      }
      return sum
    }, 0)
    
    console.log(`💰 Cash sales for ${entryDate} (normalized: ${normalizedEntryDate}):`, {
      totalSales: salesData.length,
      availableSaleDates: salesData.map(sale => new Date(sale.date).toISOString().split('T')[0]),
      normalizedEntryDate,
      matchingSales: salesData.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0]
        return saleDate === normalizedEntryDate
      }),
      result
    })
    
    return result
  }



  const getEntryOnlineSales = (entryDate: string) => {
    // Normalize entry date to YYYY-MM-DD format
    const normalizedEntryDate = new Date(entryDate).toISOString().split('T')[0]
    
    const result = salesData.reduce((sum: number, sale: any) => {
      // Normalize sale date to YYYY-MM-DD format
      const saleDate = new Date(sale.date).toISOString().split('T')[0]
      
      if (saleDate === normalizedEntryDate) {
        if (sale.payments && sale.payments.length > 0) {
          return sum + sale.payments
            .filter((payment: any) => payment.mode === "Card" || payment.mode === "Online")
            .reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0)
        } else {
          return sum + ((sale.paymentMode === "Card" || sale.paymentMode === "Online") ? sale.netTotal : 0)
        }
      }
      return sum
    }, 0)
    
    console.log(`💳 Online sales for ${entryDate} (normalized: ${normalizedEntryDate}):`, {
      totalSales: salesData.length,
      availableSaleDates: salesData.map(sale => new Date(sale.date).toISOString().split('T')[0]),
      normalizedEntryDate,
      matchingSales: salesData.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0]
        return saleDate === normalizedEntryDate
      }),
      result
    })
    
    return result
  }

  const getEntryExpenses = (entryDate: string) => {
    // Use the same logic as stats cards - calculate expenses from the expensesData
    // This ensures consistency between stats and table columns
    const normalizedEntryDate = new Date(entryDate).toISOString().split('T')[0]
    
    console.log(`🔍 DEBUG: Looking for expenses on ${entryDate}`)
    console.log(`📅 DEBUG: Normalized entry date: ${normalizedEntryDate}`)
    console.log(`📊 DEBUG: Available expense dates:`, Object.keys(expensesData))
    console.log(`💰 DEBUG: All expenses data:`, expensesData)
    
    // Calculate expenses for this specific date using the same approach as getRealTimeExpenses
    const result = Object.entries(expensesData).reduce((sum: number, [date, amount]) => {
      const expenseDate = new Date(date).toISOString().split('T')[0]
      console.log(`🔍 DEBUG: Comparing expense date ${expenseDate} with entry date ${normalizedEntryDate}`)
      if (expenseDate === normalizedEntryDate) {
        console.log(`✅ DEBUG: Match found! Adding amount ${amount}`)
        return sum + amount
      }
      return sum
    }, 0)
    
    console.log(`📊 DEBUG: Final result for ${entryDate}:`, result)
    
    return result
  }
  
  const totalOpeningBalance = statsFilteredData
    .filter(entry => entry.shiftType === "opening")
    .reduce((sum, entry) => sum + entry.openingBalance, 0)
  
  const totalClosingBalance = statsFilteredData
    .filter(entry => entry.shiftType === "closing")
    .reduce((sum, entry) => sum + (entry.closingBalance || 0), 0)

  // Calculate total online cash collected during closing shifts (Cash in POS Machine values)
  const totalOnlineCashCollected = statsFilteredData
    .filter(entry => entry.shiftType === "closing")
    .reduce((sum, entry) => sum + (entry.posCash || 0), 0)
  
  // Debug the online cash collected calculation
  console.log("💳 Online Cash Collected Calculation:", {
    closingEntries: statsFilteredData.filter(entry => entry.shiftType === "closing"),
    posCashValues: statsFilteredData
      .filter(entry => entry.shiftType === "closing")
      .map(entry => ({ date: entry.date, posCash: entry.posCash || 0 })),
    totalOnlineCashCollected
  })
  
  // Debug the online cash difference calculation
  console.log("💳 Online Cash Difference Calculation:", {
    totalOnlineCashCollected,
    totalOnlineSales,
    calculation: `${totalOnlineCashCollected} - ${totalOnlineSales}`,
    result: totalOnlineCashCollected - totalOnlineSales
  })
  
  // Debug the data filtering separation
  console.log("🔍 Data Filtering Debug:", {
    reportType,
    totalCashRegistryEntries: cashRegistryData.length,
    statsFilteredEntries: statsFilteredData.length,
    tableFilteredEntries: filteredData.length,
    statsFilteredOpening: statsFilteredData.filter(entry => entry.shiftType === "opening").length,
    statsFilteredClosing: statsFilteredData.filter(entry => entry.shiftType === "closing").length,
    tableFilteredOpening: filteredData.filter(entry => entry.shiftType === "opening").length,
    tableFilteredClosing: filteredData.filter(entry => entry.shiftType === "closing").length
  })

  // Calculate Cash Difference using the formula: ((Total Opening Balance + Total Cash Sales) - Total Expenses) - Total Closing Balance
  // This represents the variance between expected and actual cash at closing
  const cashDifference =   totalClosingBalance - ((totalOpeningBalance + totalCashSales) - totalExpenses)
  
  // Debug the cash difference calculation
  console.log("💰 Cash Difference Calculation:", {
    totalOpeningBalance,
    totalCashSales,
    totalExpenses,
    totalClosingBalance,
    calculation: `${totalClosingBalance} - ((${totalOpeningBalance} + ${totalCashSales}) - ${totalExpenses})`,
    result: cashDifference
  })
  
  // Calculate Online Cash Difference using the formula: Online Cash Collected - Total Online Sales
  // This represents the variance between collected online cash and actual online sales
  const onlineCashDifference = totalOnlineCashCollected - totalOnlineSales

  console.log("Stats calculation:", {
    filteredData: filteredData.length,
    openingEntries: filteredData.filter(entry => entry.shiftType === "opening"),
    totalOpeningBalance,
    totalClosingBalance,
    totalOnlineCashCollected,
    totalCashSales,
    totalOnlineSales,
    totalExpenses,
    cashDifference: totalClosingBalance - ((totalOpeningBalance + totalCashSales) - totalExpenses),
    onlineCashDifference: totalOnlineCashCollected - totalOnlineSales
  })

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export",
      description: "Export functionality coming soon!",
    })
  }

  const handleViewEntry = (entry: CashRegistryEntry) => {
    setSelectedEntry(entry)
    setIsViewDialogOpen(true)
  }

  const handleViewDenominations = (entry: CashRegistryEntry, type: "opening" | "closing") => {
    setSelectedDenominationsEntry(entry)
    setSelectedDenominationsType(type)
    setIsDenominationsModalOpen(true)
  }

  const handleEditEntry = (entry: CashRegistryEntry) => {
    setSelectedEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleDeleteEntry = (entry: CashRegistryEntry) => {
    // Check if this is a closing shift and if there's also opening data
    const hasOpeningData = entry.openingBalance > 0
    const hasClosingData = entry.closingBalance > 0
    
    if (hasOpeningData && hasClosingData) {
      // This record has both opening and closing data
      // We need to ask user which part to delete
      setSelectedEntry(entry)
      setIsDeleteDialogOpen(true)
    } else {
      // This record only has one type of data, safe to delete entirely
      setSelectedEntry(entry)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleDeleteDailySummary = (summary: any) => {
    // For daily summaries, we need to find and delete the underlying cash registry entries
    const summaryDate = summary.date
    
    // Find all cash registry entries for this date
    const entriesForDate = cashRegistryData.filter(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0]
      return entryDate === summaryDate
    })
    
    if (entriesForDate.length === 0) {
      toast({
        title: "No Entries Found",
        description: "No cash registry entries found for this date to delete.",
        variant: "destructive"
      })
      return
    }
    
    // Verification check removed for now - will implement proper audit controls later
    
    // Set state for daily summary deletion
    setSelectedSummaryDate(summaryDate)
    setIsDeletingDailySummary(true)
    setSelectedEntry(entriesForDate[0])
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedEntry) return
    
    setIsDeleting(true)
    try {
      let response
      
      if (isDeletingDailySummary && selectedSummaryDate) {
        // Delete all entries for the selected date (daily summary deletion)
        console.log("Deleting daily summary for date:", selectedSummaryDate)
        
        // Find all entries for this date
        const entriesForDate = cashRegistryData.filter(entry => {
          const entryDate = new Date(entry.date).toISOString().split('T')[0]
          return entryDate === selectedSummaryDate
        })
        
        // Delete each entry
        const deletePromises = entriesForDate.map(entry => CashRegistryAPI.delete(entry.id))
        const deleteResults = await Promise.all(deletePromises)
        
        // Check if all deletions were successful
        const allSuccessful = deleteResults.every(result => 
          result.message && result.message.includes('deleted successfully')
        )
        
        if (allSuccessful) {
          toast({
            title: "Success",
            description: `Successfully deleted daily summary for ${selectedSummaryDate}`,
          })
          // Refresh data after successful deletion
          await fetchCashRegistryData()
          // Regenerate daily summaries
          setTimeout(() => {
            generateDailySummaries()
          }, 100)
        } else {
          throw new Error("Some entries could not be deleted")
        }
      } else {
        // Regular single entry deletion
        // Determine which shift to delete based on the current context
        let shiftTypeToDelete = null
        
        // Check if this is a row-specific deletion (we need to determine from the row context)
        if (selectedEntry.openingBalance > 0 && selectedEntry.closingBalance > 0) {
          // This record has both opening and closing data
          // We need to determine which shift the user wants to delete
          // For now, we'll delete the entire record and let them recreate what they need
          shiftTypeToDelete = null
        } else if (selectedEntry.openingBalance > 0) {
          shiftTypeToDelete = 'opening'
        } else if (selectedEntry.closingBalance > 0) {
          shiftTypeToDelete = 'closing'
        }
        
        console.log("Deleting entry:", {
          id: selectedEntry.id,
          date: selectedEntry.date,
          shiftType: selectedEntry.shiftType,
          shiftTypeToDelete,
          createdBy: selectedEntry.createdBy
        })
        
        // Check if we have an auth token
        const token = localStorage.getItem('salon-auth-token')
        console.log("Auth token present:", !!token)
        
        // Call delete API (shiftType parameter removed for now)
        response = await CashRegistryAPI.delete(selectedEntry.id)
        
        console.log("Delete response:", response)
        
        // Check if the response has a success message (backend returns { message: '...' })
        if (response.message && response.message.includes('deleted successfully')) {
          toast({
            title: "Success",
            description: response.message,
          })
          // Refresh data after successful deletion
          await fetchCashRegistryData()
        } else {
          throw new Error(response.message || "Failed to delete entry")
        }
      }
      
      // Common cleanup
      setIsDeleteDialogOpen(false)
      setSelectedEntry(null)
      setIsDeletingDailySummary(false)
      setSelectedSummaryDate(null)
      
    } catch (error: any) {
      console.error("Delete error:", error)
      
      // Handle different types of errors
      let errorMessage = "Failed to delete entry"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (isVerified) {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
          ✅ Verified
        </Badge>
      )
    }
    
    switch (status) {
      case "active":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
            🔄 Active
          </Badge>
        )
      case "closed":
        return (
          <Badge className="bg-gradient-to-r from-slate-500 to-gray-600 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
            🔒 Closed
          </Badge>
        )
      case "verified":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
            ✅ Verified
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-slate-400 to-gray-500 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
            {status}
          </Badge>
        )
    }
  }

  const getShiftBadge = (shiftType: string) => {
    switch (shiftType) {
      case "opening":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
            🌅 Opening
          </Badge>
        )
      case "closing":
        return (
          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
            🌆 Closing
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-slate-400 to-gray-500 text-white border-0 shadow-md px-3 py-1 rounded-full font-medium">
            {shiftType}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-700">Loading Cash Registry...</h3>
            <p className="text-slate-500">Fetching your financial data</p>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full">
      {/* Enhanced Stats Cards - Full Width Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-green-800">Total Cash Sales</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-green-700">₹{totalCashSales.toFixed(2)}</div>
            <p className="text-xs text-green-600 font-medium">Real-time cash transactions</p>
            <div className="w-full bg-green-200 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full" style={{width: '75%'}}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Online Sales</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-blue-700">₹{totalOnlineSales.toFixed(2)}</div>
            <p className="text-xs text-blue-600 font-medium">Real-time online payments</p>
            <div className="w-full bg-blue-200 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full" style={{width: '60%'}}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-orange-800">Total Expenses</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-md">
              <Receipt className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-orange-700">₹{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-orange-600 font-medium">Real-time business expenses</p>
            <div className="w-full bg-orange-200 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 h-1.5 rounded-full" style={{width: '45%'}}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-purple-800">Cash Difference</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-3xl font-bold ${
              cashDifference > 0 ? 'text-green-600' : 
              cashDifference < 0 ? 'text-red-600' : 
              'text-purple-700'
            }`}>
              ₹{cashDifference.toFixed(2)}
            </div>
            <p className="text-xs text-purple-600 font-medium">
              Closing - (Opening + Sales - Expenses)
            </p>
            {cashDifference !== 0 && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                cashDifference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {cashDifference > 0 ? '💰 Surplus' : '⚠️ Shortage'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-cyan-800">Online Cash Diff.</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-md">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-3xl font-bold ${
              onlineCashDifference > 0 ? 'text-green-600' : 
              onlineCashDifference < 0 ? 'text-red-600' : 
              'text-cyan-700'
            }`}>
              ₹{onlineCashDifference.toFixed(2)}
            </div>
            <p className="text-xs text-cyan-600 font-medium">
              Online Cash - Online Sales
            </p>
            {onlineCashDifference !== 0 && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                onlineCashDifference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {onlineCashDifference > 0 ? '💰 Surplus' : '⚠️ Shortage'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Balance Summary Cards - Full Width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-amber-800">Total Opening Balance</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-md">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-amber-700">₹{totalOpeningBalance.toFixed(2)}</div>
            <p className="text-xs text-amber-600 font-medium">From all opening shifts</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-600">Active tracking</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-rose-800">Total Closing Balance</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-md">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-rose-700">₹{totalClosingBalance.toFixed(2)}</div>
            <p className="text-xs text-rose-600 font-medium">From all closing shifts</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-rose-600">End of day totals</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-400/20 to-blue-400/20 rounded-full blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-sky-800">Online Cash Collected</CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-md">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-sky-700">₹{totalOnlineCashCollected.toFixed(2)}</div>
            <p className="text-xs text-sky-600 font-medium">From Cash in POS Machine during closing shifts</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-sky-600">Digital payments</span>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* All Filters and Actions in Single Row */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-lg">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-400/5 to-blue-400/5 rounded-full blur-2xl" />
        
        <div className="relative p-6">
          {/* Everything in Single Row */}
          <div className="flex items-center justify-between">
            {/* Left Side - Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
              
              <Select value={datePeriod} onValueChange={handleDatePeriodChange}>
                <SelectTrigger className="w-32">
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
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[220px] justify-start text-left font-normal"
                  >
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity">Activity Report</SelectItem>
                  <SelectItem value="summary">Summary By Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center space-x-2 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-xl px-4 py-2"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span className="font-medium">Export</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  console.log("🔄 Manual refresh of real-time data...")
                  await fetchSalesData()
                  await fetchExpensesData()
                  setTimeout(() => {
                    generateDailySummaries()
                  }, 100)
                  toast({
                    title: "Data Refreshed",
                    description: "Real-time sales and expenses data has been updated.",
                  })
                }}
                className="flex items-center space-x-2 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-xl px-4 py-2"
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
                <span className="font-medium">Refresh Data</span>
              </Button>
              
              <Button
                onClick={() => {
                  console.log("🔄 Manual trigger for generateDailySummaries...")
                  generateDailySummaries()
                  toast({
                    title: "Summaries Regenerated",
                    description: "Daily summaries have been recalculated with latest data.",
                  })
                }}
                variant="outline"
                className="flex items-center space-x-2 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-xl px-4 py-2"
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
                <span className="font-medium">Regenerate Summaries</span>
              </Button>
              
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl px-6 py-2"
              >
                <Banknote className="h-4 w-4" />
                <span className="font-semibold">Add Entry</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

            {/* Compact Cash Registry Table Header */}
            <div className="relative overflow-hidden border-0 bg-white rounded-2xl shadow-xl">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-2xl" />
              
              <div className="relative p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                    <Receipt className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {reportType === "summary" ? "Summary By Day Report" : "Activity Report"}
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {reportType === "summary" 
                        ? "Showing consolidated daily summaries with opening and closing balances"
                        : "Showing detailed activity entries for each shift"
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto p-6">
                <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100/50 hover:from-slate-100 hover:to-blue-100/50 border-0">
                    {reportType === "summary" ? (
                      <>
                        <TableHead className="font-semibold text-slate-700 py-4">Date</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Opening Balance</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Cash Collected</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Expense</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Cash Balance</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Closing Balance</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Cash Difference</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700 py-4">Reason for Cash Diff.</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Total Online Sales</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Cash in POS</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Online Cash Difference</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700 py-4">Reason for Online Diff.</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700 py-4">Status</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700 py-4">Actions</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="font-semibold text-slate-700 py-4">Date & Time</TableHead>
                        <TableHead className="font-semibold text-slate-700 py-4">Created By</TableHead>
                        <TableHead className="font-semibold text-slate-700 py-4">Shift Type</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 py-4">Total Amount</TableHead>
                        <TableHead className="font-semibold text-slate-700 py-4">Denominations</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700 py-4">Actions</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportType === "summary" ? dailySummaries.length === 0 : filteredData.length === 0) ? (
                    <TableRow className="border-0">
                      <TableCell colSpan={reportType === "summary" ? 14 : 6} className="text-center py-16 border-0">
                        <div className="flex flex-col items-center space-y-5">
                          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center">
                            <Receipt className="h-10 w-10 text-slate-400" />
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-slate-700">
                              {reportType === "summary" 
                                ? "No Daily Summaries Found"
                                : "No Cash Registry Entries Found"
                              }
                            </h3>
                            <p className="text-slate-500 max-w-md text-sm leading-relaxed">
                              {reportType === "summary" 
                                ? "Complete a verification to see daily summaries here. Summaries provide consolidated views of opening and closing balances."
                                : "Get started by adding your first cash registry entry. Track opening and closing balances for each shift."
                              }
                            </p>
                          </div>
                          {reportType === "summary" && (
                            <Button
                              onClick={() => setIsAddModalOpen(true)}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl px-6 py-2.5 text-sm"
                            >
                              <Banknote className="h-4 w-4 mr-2" />
                              Add First Entry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (reportType === "summary" ? dailySummaries : filteredData).map((entry) => {
                      if (reportType === "summary") {
                        // SUMMARY REPORT - Shows actual data from daily summaries
                        // Type guard to ensure this is a summary entry
                        if ('cashCollected' in entry) {
                          const date = entry.date
                          const openingBalance = entry.openingBalance
                          const cashCollected = entry.cashCollected
                          const expense = entry.expense
                          const cashBalance = entry.cashBalance
                          const closingBalance = entry.closingBalance
                          const cashDifference = entry.cashDifference
                          const cashDifferenceReason = entry.cashDifferenceReason
                          const totalOnlineSales = entry.totalOnlineSales
                          const cashInPos = entry.cashInPos
                          const onlineCashDifference = entry.onlineCashDifference
                          const onlineCashDifferenceReason = entry.onlineCashDifferenceReason
                          
                          return (
                            <TableRow key={entry.date} className="hover:bg-gray-50">
                              <TableCell className="font-medium min-w-[100px]">
                                {format(new Date(date), "dd MMM yyyy")}
                              </TableCell>
                              <TableCell className="text-right min-w-[120px]">₹{openingBalance.toFixed(2)}</TableCell>
                              <TableCell className="text-right min-w-[120px]">₹{cashCollected.toFixed(2)}</TableCell>
                              <TableCell className="text-right min-w-[100px]">₹{expense.toFixed(2)}</TableCell>
                              <TableCell className="text-right min-w-[120px]">₹{cashBalance.toFixed(2)}</TableCell>
                              <TableCell className="text-right min-w-[120px]">₹{closingBalance.toFixed(2)}</TableCell>
                              <TableCell className={`text-right font-medium min-w-[120px] ${
                                cashDifference > 0 ? 'text-green-600' : 
                                cashDifference < 0 ? 'text-red-600' : 
                                'text-gray-900'
                              }`}>
                                ₹{cashDifference.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center min-w-[140px]">
                                {cashDifference !== 0 ? (
                                  <div className="space-y-1">
                                    <Badge variant={cashDifference > 0 ? "default" : "destructive"}>
                                      {cashDifference > 0 ? 'Surplus' : 'Shortage'}
                                    </Badge>
                                    {cashDifferenceReason && (
                                      <div className="text-xs text-muted-foreground max-w-32 truncate" title={cashDifferenceReason}>
                                        {cashDifferenceReason}
                                    </div>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="secondary">Balanced</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right min-w-[140px]">₹{totalOnlineSales.toFixed(2)}</TableCell>
                              <TableCell className="text-right min-w-[120px]">₹{cashInPos.toFixed(2)}</TableCell>
                              <TableCell className={`text-right font-medium min-w-[120px] ${
                                onlineCashDifference > 0 ? 'text-green-600' : 
                                onlineCashDifference < 0 ? 'text-red-600' : 
                                'text-gray-900'
                              }`}>
                                ₹{onlineCashDifference.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center min-w-[140px]">
                                {onlineCashDifference !== 0 ? (
                                  <div className="space-y-1">
                                    <Badge variant={onlineCashDifference > 0 ? "default" : "destructive"}>
                                      {onlineCashDifference > 0 ? 'Surplus' : 'Shortage'}
                                    </Badge>
                                    {onlineCashDifferenceReason && (
                                      <div className="text-xs text-muted-foreground max-w-32 truncate" title={onlineCashDifferenceReason}>
                                        {onlineCashDifferenceReason}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="secondary">Balanced</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center min-w-[100px]">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="cursor-pointer hover:scale-105 transition-transform duration-200">
                                      {entry.isVerified ? (
                                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Verified
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
                                          <ClockIcon className="h-3 w-3" />
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-3">
                                    <div className="space-y-2">
                                      <div className="font-medium text-sm flex items-center gap-2">
                                        {entry.isVerified ? (
                                          <>
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            Verification Details
                                          </>
                                        ) : (
                                          <>
                                            <ClockIcon className="h-4 w-4 text-gray-600" />
                                            Status Information
                                          </>
                                        )}
                                      </div>
                                      {entry.isVerified ? (
                                        <>
                                          <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Verified by:</span> {entry.verifiedBy || 'Unknown'}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Verified at:</span> {entry.verifiedAt ? format(new Date(entry.verifiedAt), "dd MMM yyyy, HH:mm") : 'Unknown'}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-xs text-muted-foreground">
                                          This daily summary is pending verification. Click "Verify and Close" to complete the verification process.
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                                                              <TableCell className="text-center min-w-[80px]">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDailySummary(entry)}
                                    className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-red-50 transition-all duration-200 rounded-xl hover:shadow-md transform hover:scale-105"
                                    title="Delete daily summary"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        }
                        return null
                      } else {
                        // ACTIVITY REPORT - Show separate rows for opening and closing activities
                        // Type guard to ensure this is a CashRegistryEntry
                        if ('id' in entry) {
                          const rows = []
                          
                          // Add opening balance row if it exists
                          if (entry.openingBalance > 0) {
                            rows.push(
                              <TableRow key={`${entry.id}-opening`}>
                                <TableCell className="font-medium">
                                  {format(new Date(entry.date), "dd MMM yyyy, HH:mm")}
                                </TableCell>
                                <TableCell>{entry.createdBy}</TableCell>
                                <TableCell>
                                  <Badge variant="default">Opening Shift</Badge>
                                </TableCell>
                                <TableCell className="font-medium text-right">
                                  ₹{entry.openingBalance.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {entry.denominations && entry.denominations.length > 0 ? (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => handleViewDenominations(entry, "opening")}
                                      className="h-auto p-0 text-blue-600 hover:text-blue-800"
                                    >
                                      View
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEntry(entry)}
                                    className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-red-50 transition-all duration-200 rounded-xl hover:shadow-md transform hover:scale-105"
                                    title="Delete entry"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          }
                          
                          // Add closing balance row if it exists
                          if (entry.closingBalance > 0) {
                            rows.push(
                              <TableRow key={`${entry.id}-closing`}>
                                <TableCell className="font-medium">
                                  {format(new Date(entry.date), "dd MMM yyyy, HH:mm")}
                                </TableCell>
                                <TableCell>{entry.createdBy}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">Closing Shift</Badge>
                                </TableCell>
                                <TableCell className="font-medium text-right">
                                  ₹{entry.closingBalance.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {entry.closingDenominations && entry.closingDenominations.length > 0 ? (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => handleViewDenominations(entry, "closing")}
                                      className="h-auto p-0 text-blue-600 hover:text-blue-800"
                                    >
                                      View
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEntry(entry)}
                                    className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-red-50 transition-all duration-200 rounded-xl hover:shadow-md transform hover:scale-105"
                                    title="Delete entry"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          }
                          
                          return rows
                        }
                        return null
                      }
                    }).flat().filter(Boolean)
                  )}
                </TableBody>
              </Table>
                </div>
            </div>

      {/* Add Entry Modal */}
      <CashRegistryModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSaveSuccess={fetchCashRegistryData}
        onlineSalesAmount={totalOnlineSales}
        onPosCashChange={(amount) => {
          console.log("POS Cash amount changed:", amount)
          // This will be used to update the POS Cash column after saving
        }}
      />

      {/* Denominations Modal */}
      <Dialog open={isDenominationsModalOpen} onOpenChange={setIsDenominationsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Denominations Details</DialogTitle>
            <DialogDescription>
              {selectedDenominationsEntry && (
                <span>
                  {selectedDenominationsType === "opening" ? "Opening" : "Closing"} shift denominations for{" "}
                  {format(new Date(selectedDenominationsEntry.date), "dd MMM yyyy")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDenominationsEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 bg-muted/30 border rounded-lg overflow-hidden">
                <div className="px-3 py-2 font-semibold text-sm border-r">Value (₹)</div>
                <div className="px-3 py-2 font-semibold text-sm border-r">Count</div>
                <div className="px-3 py-2 font-semibold text-sm">Total (₹)</div>
              </div>
              
              {selectedDenominationsType === "opening" ? (
                selectedDenominationsEntry.denominations && selectedDenominationsEntry.denominations.length > 0 ? (
                  selectedDenominationsEntry.denominations.map((denom, index) => (
                    <div key={denom.value} className={`grid grid-cols-3 border-b last:border-b-0 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="px-3 py-2">₹{denom.value}</div>
                      <div className="px-3 py-2">{denom.count}</div>
                      <div className="px-3 py-2 font-medium">₹{denom.total.toFixed(2)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No denominations recorded</div>
                )
              ) : (
                selectedDenominationsEntry.closingDenominations && selectedDenominationsEntry.closingDenominations.length > 0 ? (
                  selectedDenominationsEntry.closingDenominations.map((denom, index) => (
                    <div key={denom.value} className={`grid grid-cols-3 border-b last:border-b-0 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="px-3 py-2">₹{denom.value}</div>
                      <div className="px-3 py-2">{denom.count}</div>
                      <div className="px-3 py-2 font-medium">₹{denom.total.toFixed(2)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No denominations recorded</div>
                )
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDenominationsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cash Registry Entry Details</DialogTitle>
            <DialogDescription>
              Detailed view of the cash registry entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEntry.date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Shift Type</Label>
                  <div className="mt-1">{getShiftBadge(selectedEntry.shiftType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <p className="text-sm text-muted-foreground">{selectedEntry.createdBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status, selectedEntry.isVerified)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Denominations</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-muted/30 border-b">
                    <div className="px-3 py-2 font-semibold text-sm">Value (₹)</div>
                    <div className="px-3 py-2 font-semibold text-sm">Count</div>
                    <div className="px-3 py-2 font-semibold text-sm">Total (₹)</div>
                  </div>
                  {selectedEntry.denominations.map((denom, index) => (
                    <div key={denom.value} className={`grid grid-cols-3 border-b last:border-b-0 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="px-3 py-2">₹{denom.value}</div>
                      <div className="px-3 py-2">{denom.count}</div>
                      <div className="px-3 py-2 font-medium">₹{denom.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Balance</Label>
                  <p className="text-lg font-bold text-primary">
                    ₹{selectedEntry.totalBalance.toFixed(2)}
                  </p>
                </div>
                {selectedEntry.shiftType === "closing" && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Online Cash</Label>
                      <p className="text-sm text-muted-foreground">
                        ₹{selectedEntry.onlineCash.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">POS Cash</Label>
                      <p className="text-sm text-muted-foreground">
                        ₹{selectedEntry.posCash.toFixed(2)}
                      </p>
                    </div>
                  </>
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
            <DialogTitle>
              {isDeletingDailySummary ? "Delete Daily Summary" : "Delete Cash Registry Entry"}
            </DialogTitle>
            <DialogDescription>
              {isDeletingDailySummary 
                ? `Are you sure you want to delete the daily summary for ${selectedSummaryDate ? format(new Date(selectedSummaryDate), "MMM dd, yyyy") : "this date"}? This will delete all cash registry entries for that date and cannot be undone.`
                : "Are you sure you want to delete this cash registry entry? This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              {isDeletingDailySummary ? (
                // Daily Summary Deletion Info
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      🗑️ Daily Summary Deletion
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      This will delete ALL cash registry entries (opening and closing shifts) for the selected date.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Date:</span>
                      <p className="text-muted-foreground">
                        {selectedSummaryDate ? format(new Date(selectedSummaryDate), "MMM dd, yyyy") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Entries to Delete:</span>
                      <p className="text-muted-foreground">
                        {selectedSummaryDate ? cashRegistryData.filter(entry => {
                          const entryDate = new Date(entry.date).toISOString().split('T')[0]
                          return entryDate === selectedSummaryDate
                        }).length : 0} entries
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular Entry Deletion Info
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Date:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(selectedEntry.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Created By:</span>
                      <p className="text-muted-foreground">{selectedEntry.createdBy}</p>
                    </div>
                    <div>
                      <span className="font-medium">Opening Balance:</span>
                      <p className="text-muted-foreground">
                        {selectedEntry.openingBalance > 0 ? `₹${selectedEntry.openingBalance.toFixed(2)}` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Closing Balance:</span>
                      <p className="text-muted-foreground">
                        {selectedEntry.closingBalance > 0 ? `₹${selectedEntry.closingBalance.toFixed(2)}` : "Not set"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Show deletion warning for records with both shifts */}
                  {selectedEntry.openingBalance > 0 && selectedEntry.closingBalance > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ This record contains both opening and closing data. 
                        Deleting will remove the entire record. Consider editing instead to modify specific shift data.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : (isDeletingDailySummary ? "Delete Daily Summary" : "Delete Entry")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Modal */}
      <VerificationModal 
        isOpen={isVerificationModalOpen}
        onClose={() => onVerificationModalChange(false)}
        onVerify={handleVerification}
        todayClosingEntry={todayClosingEntry || null}
        cashDifference={cashDifference}
        onlineCashDifference={onlineCashDifference}
      />
    </div>
  )
}
