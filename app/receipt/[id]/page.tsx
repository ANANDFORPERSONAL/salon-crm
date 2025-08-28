"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Receipt } from "@/lib/data"
import { getReceiptById, getReceiptByNumber, getAllReceipts } from "@/lib/data"
import { ReceiptPreview } from "@/components/receipts/receipt-preview"
import { Button } from "@/components/ui/button"
import { Printer, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ReceiptPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReceipt = () => {
      try {
        const receiptId = params.id as string
        const receiptNumber = searchParams.get('receiptNumber')
        
        console.log('🎯 Receipt Page Debug:')
        console.log('Receipt ID:', receiptId)
        console.log('Receipt Number:', receiptNumber)
        
        // Debug: Show all available receipts
        const allReceipts = getAllReceipts()
        console.log('📋 All available receipts:', allReceipts)
        console.log('📊 Total receipts in store:', allReceipts.length)
        
        // Try to find receipt by ID first, then by receipt number
        let foundReceipt: Receipt | undefined
        
        if (receiptId) {
          // First try to find by ID
          foundReceipt = getReceiptById(receiptId)
          
          // If not found by ID, try by receipt number
          if (!foundReceipt && receiptNumber) {
            foundReceipt = getReceiptByNumber(receiptNumber)
          }
        }
        
        if (foundReceipt) {
          console.log('✅ Receipt found in store:', foundReceipt)
          setReceipt(foundReceipt)
        } else {
          console.log('❌ Receipt not found in store')
          
          // Try to get receipt data from URL parameters
          const receiptDataParam = searchParams.get('data')
          if (receiptDataParam) {
            try {
              const receiptData = JSON.parse(decodeURIComponent(receiptDataParam))
              console.log('🔄 Receipt data from URL params:', receiptData)
              
              // Validate the receipt data structure
              if (receiptData.id && receiptData.receiptNumber && receiptData.clientName) {
                console.log('✅ Using receipt data from URL parameters')
                setReceipt(receiptData as Receipt)
              } else {
                console.log('❌ Invalid receipt data structure from URL')
                setError('Invalid receipt data')
              }
            } catch (parseError) {
              console.error('❌ Error parsing receipt data from URL:', parseError)
              setError('Failed to parse receipt data')
            }
          } else {
            // Fallback: Create a receipt object from URL parameters for debugging
            if (receiptNumber) {
              const fallbackReceipt: Receipt = {
                id: receiptId || 'fallback',
                receiptNumber: receiptNumber,
                clientId: 'unknown',
                clientName: 'Unknown Client',
                clientPhone: 'Unknown',
                date: new Date().toISOString(),
                time: new Date().toLocaleTimeString(),
                items: [],
                subtotal: 0,
                tip: 0,
                discount: 0,
                tax: 0,
                total: 0,
                payments: [],
                staffId: 'unknown',
                staffName: 'Unknown Staff',
                notes: 'Receipt created from URL parameters (fallback)'
              }
              
              console.log('🔄 Using fallback receipt:', fallbackReceipt)
              setReceipt(fallbackReceipt)
            } else {
              setError('Receipt not found')
            }
          }
        }
      } catch (err) {
        console.error('Error loading receipt:', err)
        setError('Failed to load receipt')
      } finally {
        setIsLoading(false)
      }
    }

    loadReceipt()
  }, [params.id, searchParams])

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
          <Link href="/quick-sale">
            <Button variant="outline" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Sale
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
            <h1 className="text-2xl font-bold text-gray-900">Receipt #{receipt.receiptNumber}</h1>
            <p className="text-gray-600">
              {receipt.clientName} • {new Date(receipt.date).toLocaleDateString()} • {receipt.time}
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
            <Link href="/quick-sale">
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
          <ReceiptPreview receipt={receipt} />
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
