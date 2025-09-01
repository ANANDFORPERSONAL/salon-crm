"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ReceiptPreview } from "@/components/receipts/receipt-preview"
import { Button } from "@/components/ui/button"
import { Printer, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { SettingsAPI } from "@/lib/api"
import { SalesAPI } from "@/lib/api"

interface ReceiptData {
  id: string
  billNo: string
  customerName: string
  customerPhone: string
  date: string
  time: string
  items: Array<{
    name: string
    type: string
    quantity: number
    price: number
    total: number
    staffName?: string
  }>
  netTotal: number
  taxAmount: number
  grossTotal: number
  paymentMode: string
  payments: Array<{
    type: string
    amount: number
  }>
  staffName: string
  status: string
}

export default function ReceiptPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load business settings
  useEffect(() => {
    const loadBusinessSettings = async () => {
      try {
        console.log('Loading business settings for receipt...')
        const response = await SettingsAPI.getBusinessSettings()
        console.log('Business settings response:', response)
        if (response.success) {
          setBusinessSettings(response.data)
          console.log('Business settings loaded:', response.data)
        }
      } catch (error) {
        console.error('Error loading business settings:', error)
      }
    }

    loadBusinessSettings()
  }, [])

  // Load receipt data by bill number
  useEffect(() => {
    const loadReceipt = async () => {
      try {
        const billNo = params.billNo as string
        
        console.log('🎯 Receipt Page Debug:')
        console.log('Bill Number:', billNo)
        
        if (!billNo) {
          setError('Bill number is required')
          setIsLoading(false)
          return
        }

        // Try to fetch sale data from the API using bill number
        try {
          const response = await SalesAPI.getByBillNo(billNo)
          if (response.success && response.data) {
            console.log('✅ Sale data found:', response.data)
            
            // Transform sale data to receipt format
            const saleData = response.data
            console.log('🔍 Raw sale data from API:', saleData)
            console.log('🔍 Sale payments array:', saleData.payments)
            console.log('🔍 Sale payment mode:', saleData.paymentMode)
            
            const receiptData: ReceiptData = {
              id: saleData._id || saleData.id,
              billNo: saleData.billNo,
              customerName: saleData.customerName,
              customerPhone: saleData.customerPhone || 'N/A',
              date: saleData.date,
              time: new Date(saleData.date).toLocaleTimeString(),
              items: saleData.items.map((item: any) => ({
                name: item.name,
                type: item.type,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                staffName: saleData.staffName
              })),
              netTotal: saleData.netTotal,
              taxAmount: saleData.taxAmount,
              grossTotal: saleData.grossTotal,
              paymentMode: saleData.paymentMode,
              payments: saleData.payments?.length > 0 ? saleData.payments.map((payment: any) => {
                // Handle both 'mode' field (from Sale model) and 'type' field (from receipt)
                const paymentType = payment.mode || payment.type
                console.log('🔍 Processing payment:', { payment, paymentType, mode: payment.mode, type: payment.type })
                return {
                  type: paymentType?.toLowerCase() || 'unknown',
                  amount: payment.amount || 0
                }
              }) : [{ type: (saleData.paymentMode?.toLowerCase() || 'unknown'), amount: saleData.grossTotal }],
              staffName: saleData.staffName,
              status: saleData.status
            }
            
            console.log('🔍 Final receipt data:', receiptData)
            console.log('🔍 Payments array:', receiptData.payments)
            setReceipt(receiptData)
          } else {
            console.log('❌ Sale not found for bill number:', billNo)
            setError('Receipt not found')
          }
        } catch (apiError) {
          console.error('❌ API error:', apiError)
          
          // Fallback: Try to use data from query parameters
          try {
            const dataParam = searchParams.get('data')
            if (dataParam) {
              console.log('🔄 Falling back to query parameter data...')
              const fallbackData = JSON.parse(decodeURIComponent(dataParam))
              console.log('📋 Fallback data:', fallbackData)
              console.log('📋 Fallback payments:', fallbackData.payments)
              console.log('📋 Fallback payment types:', fallbackData.payments?.map((p: any) => p.type))
              
              // Transform fallback data to receipt format
              const receiptData: ReceiptData = {
                id: fallbackData.id,
                billNo: fallbackData.receiptNumber,
                customerName: fallbackData.clientName,
                customerPhone: fallbackData.clientPhone || 'N/A',
                date: fallbackData.date,
                time: fallbackData.time,
                items: fallbackData.items.map((item: any) => ({
                  name: item.name,
                  type: item.type,
                  quantity: item.quantity,
                  price: item.price,
                  total: item.total,
                  staffName: fallbackData.staffName
                })),
                netTotal: fallbackData.subtotal,
                taxAmount: fallbackData.tax,
                grossTotal: fallbackData.total,
                paymentMode: fallbackData.payments?.[0]?.type || 'Cash',
                payments: fallbackData.payments || [{ type: 'Cash', amount: fallbackData.total }],
                staffName: fallbackData.staffName,
                status: 'completed'
              }
              
              console.log('🔍 Fallback receipt data:', receiptData)
              console.log('🔍 Fallback payments array:', receiptData.payments)
              setReceipt(receiptData)
              console.log('✅ Receipt loaded from fallback data')
              return
            }
          } catch (fallbackError) {
            console.error('❌ Fallback data parsing failed:', fallbackError)
          }
          
          setError('Failed to load receipt data')
        }
      } catch (err) {
        console.error('Error loading receipt:', err)
        setError('Failed to load receipt')
      } finally {
        setIsLoading(false)
      }
    }

    loadReceipt()
  }, [params.billNo])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert('PDF download functionality coming soon!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Receipt Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested receipt could not be found.'}</p>
          <Link href="/reports">
            <Button variant="outline" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Actions */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Receipt #{receipt.billNo}</h1>
            <p className="text-gray-600">
              {receipt.customerName} • {new Date(receipt.date).toLocaleDateString()} • {receipt.time}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ReceiptPreview 
            receipt={{
              id: receipt.id,
              receiptNumber: receipt.billNo,
              clientId: receipt.id,
              clientName: receipt.customerName,
              clientPhone: receipt.customerPhone,
              date: receipt.date,
              time: receipt.time,
              items: receipt.items?.map(item => ({
                id: item.name,
                name: item.name,
                type: item.type as "service" | "product",
                price: item.price,
                quantity: item.quantity,
                discount: 0,
                discountType: 'percentage' as const,
                staffId: receipt.id,
                staffName: item.staffName || receipt.staffName,
                total: item.total
              })) || [],
              subtotal: receipt.netTotal,
              tip: 0,
              discount: 0,
              tax: receipt.taxAmount,
              total: receipt.grossTotal,
              payments: receipt.payments?.map(payment => ({
                type: (payment?.type || 'unknown') as "cash" | "card" | "online",
                amount: payment?.amount || 0
              })) || [],
              staffId: receipt.id,
              staffName: receipt.staffName,
              notes: ''
            }} 
            businessSettings={businessSettings} 
          />
        </div>
      </div>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
