"use client"

import type { Receipt } from "@/lib/data"
import { formatCurrency, getCurrencySymbol } from "@/lib/currency"

interface ReceiptGeneratorProps {
  receipt: Receipt
  businessSettings?: any
}

export function ReceiptGenerator({ receipt, businessSettings }: ReceiptGeneratorProps) {
  const generateReceiptHTML = () => {
    if (!businessSettings) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .loading { font-size: 18px; color: #666; }
          </style>
        </head>
        <body>
          <div class="loading">Loading receipt...</div>
        </body>
        </html>
      `
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${receipt.receiptNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            max-width: 300px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .salon-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .salon-info {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .receipt-info {
            margin-bottom: 15px;
          }
          .receipt-info div {
            margin-bottom: 3px;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin-bottom: 10px;
          }
          .item {
            margin-bottom: 8px;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .item-details {
            font-size: 10px;
            color: #666;
            margin-left: 10px;
          }
          .totals {
            margin-bottom: 15px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .total-line.grand-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 8px;
          }
          .payments {
            margin-bottom: 15px;
          }
          .payment-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .footer {
            text-align: center;
            border-top: 1px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="salon-name">${businessSettings.name}</div>
          <div class="salon-info">${businessSettings.address}, ${businessSettings.city}, ${businessSettings.state} ${businessSettings.zipCode}</div>
          <div class="salon-info">Phone: ${businessSettings.phone}</div>
          <div class="salon-info">Email: ${businessSettings.email}</div>
        </div>

        <div class="receipt-info">
          <div><strong>Receipt #:</strong> ${receipt.receiptNumber}</div>
          <div><strong>Date:</strong> ${new Date(receipt.date).toLocaleDateString()}</div>
          <div><strong>Time:</strong> ${receipt.time}</div>
          <div><strong>Client:</strong> ${receipt.clientName}</div>
          <div><strong>Phone:</strong> ${receipt.clientPhone}</div>
          <div><strong>Staff:</strong> ${receipt.staffName}</div>
        </div>

        <div class="items">
          ${receipt.items
            .map(
              (item) => `
            <div class="item">
              <div class="item-header">
                <span>${item.name}</span>
                <span>${formatCurrency(item.total, businessSettings)}</span>
              </div>
              <div class="item-details">
                ${item.quantity} x ${formatCurrency(item.price, businessSettings)}
                ${item.discount > 0 ? ` (${item.discountType === "percentage" ? item.discount + "%" : "$" + item.discount} off)` : ""}
                ${item.staffName ? ` - ${item.staffName}` : ""}
              </div>
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${formatCurrency(receipt.subtotal, businessSettings)}</span>
          </div>
          ${
            receipt.discount > 0
              ? `
            <div class="total-line">
              <span>Discount:</span>
              <span>-${formatCurrency(receipt.discount, businessSettings)}</span>
            </div>
          `
              : ""
          }
          <div class="total-line">
            <span>Tax:</span>
            <span>${formatCurrency(receipt.tax, businessSettings)}</span>
          </div>
          ${
            receipt.tip > 0
              ? `
            <div class="total-line">
              <span>Tip:</span>
              <span>${formatCurrency(receipt.tip, businessSettings)}</span>
            </div>
          `
              : ""
          }
          <div class="total-line grand-total">
            <span>TOTAL:</span>
            <span>${formatCurrency(receipt.total, businessSettings)}</span>
          </div>
        </div>

        <div class="payments">
          <div style="font-weight: bold; margin-bottom: 5px;">Payment Method(s):</div>
          ${receipt.payments
            .map(
              (payment) => {
                // Safely handle payment types with null/undefined checks
                if (!payment || !payment.type) {
                  return `
            <div class="payment-line">
              <span>Unknown:</span>
              <span>${formatCurrency(payment?.amount || 0, businessSettings)}</span>
            </div>
          `
                }
                
                // Map payment types to display names
                let displayName = 'Unknown'
                if (payment.type === 'cash') displayName = 'Cash'
                if (payment.type === 'card') displayName = 'Card'
                if (payment.type === 'online') displayName = 'Online'
                if (payment.type === 'unknown') displayName = 'Unknown'
                
                return `
            <div class="payment-line">
              <span>${displayName}:</span>
              <span>${formatCurrency(payment.amount, businessSettings)}</span>
            </div>
          `
              }
            )
            .join("")}
        </div>

        <div class="footer">
          <div>Thank you for visiting!</div>
          <div>We appreciate your business</div>
          <div style="margin-top: 10px;">
            Follow us on social media<br>
            ${businessSettings.socialMedia}
          </div>
        </div>
      </body>
      </html>
    `
  }

  const printReceipt = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML())
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const downloadReceipt = () => {
    const html = generateReceiptHTML()
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${receipt.receiptNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    generateReceiptHTML,
    printReceipt,
    downloadReceipt,
  }
}
