"use client"

import { useEffect } from "react"
import type { Receipt } from "@/lib/data"
import { Card, CardContent } from "@/components/ui/card"
import { useCurrency } from "@/hooks/use-currency"

interface ReceiptPreviewProps {
  receipt: Receipt
  businessSettings?: any
}

export function ReceiptPreview({ receipt, businessSettings }: ReceiptPreviewProps) {
  const { formatAmount } = useCurrency()
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 ReceiptPreview - receipt data:', receipt)
    console.log('🔍 ReceiptPreview - payments:', receipt.payments)
  }, [receipt])
  
  return (
    <Card className="max-w-sm mx-auto bg-white">
      <CardContent className="p-6 font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-lg font-bold mb-1">
            {businessSettings?.name || "GLAMOUR SALON & SPA"}
          </div>
          <div className="text-xs">
            {businessSettings 
              ? `${businessSettings.address}, ${businessSettings.city}, ${businessSettings.state} ${businessSettings.zipCode}`
              : "123 Beauty Street, City, ST 12345"
            }
          </div>
          <div className="text-xs">
            Phone: {businessSettings?.phone || "(555) 123-SALON"}
          </div>
          <div className="text-xs">
            Email: {businessSettings?.email || "info@glamoursalon.com"}
          </div>
        </div>

        {/* Receipt Info */}
        <div className="mb-4 space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold">Receipt #:</span>
            <span>{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{new Date(receipt.date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Time:</span>
            <span>{receipt.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Client:</span>
            <span>{receipt.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Phone:</span>
            <span>{receipt.clientPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Staff:</span>
            <span>{receipt.staffName}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-b border-dashed border-black py-3 mb-3">
          {receipt.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between font-semibold">
                <span>{item.name}</span>
                <span>{formatAmount(item.total)}</span>
              </div>
              <div className="text-xs text-gray-600 ml-2">
                {item.quantity} x {formatAmount(item.price)}
                {item.discount > 0 && (
                  <span> ({item.discountType === "percentage" ? `${item.discount}%` : `${formatAmount(item.discount)}`} off)</span>
                )}
                {item.staffName && <span> - {item.staffName}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatAmount(receipt.subtotal)}</span>
          </div>
          {receipt.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatAmount(receipt.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatAmount(receipt.tax)}</span>
          </div>
          {receipt.tip > 0 && (
            <div className="flex justify-between">
              <span>Tip:</span>
              <span>{formatAmount(receipt.tip)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-black pt-2 mt-2">
            <span>TOTAL:</span>
            <span>{formatAmount(receipt.total)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="mb-4">
          <div className="font-semibold mb-2">Payment Method(s):</div>
          {receipt.payments.map((payment, index) => {
            // Safely handle payment types with null/undefined checks
            if (!payment || !payment.type) {
              console.warn(`Payment at index ${index} is missing type:`, payment)
              return (
                <div key={index} className="flex justify-between">
                  <span>Unknown:</span>
                  <span>{formatAmount(payment?.amount || 0)}</span>
                </div>
              )
            }
            
            // Map payment types to display names
            let displayName = 'Unknown'
            if (payment.type === 'cash') displayName = 'Cash'
            if (payment.type === 'card') displayName = 'Card'
            if (payment.type === 'online') displayName = 'Online'
            if (payment.type === 'unknown') displayName = 'Unknown'
            
            return (
              <div key={index} className="flex justify-between">
                <span>{displayName}:</span>
                <span>{formatAmount(payment.amount)}</span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-dashed border-black pt-3 text-xs">
          <div>Thank you for visiting!</div>
          <div>We appreciate your business</div>
          <div className="mt-2">
            Follow us on social media
            <br />
            {businessSettings?.socialMedia || "@glamoursalon"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
