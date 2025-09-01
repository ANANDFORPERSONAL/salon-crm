"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { SalesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Receipt, CreditCard, DollarSign, Clock, AlertCircle } from "lucide-react"

interface PaymentCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  sale: any
  onPaymentCollected: () => void
}

export function PaymentCollectionModal({ isOpen, onClose, sale, onPaymentCollected }: PaymentCollectionModalProps) {
  const { toast } = useToast()
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentSummary, setPaymentSummary] = useState<any>(null)

  useEffect(() => {
    if (sale && isOpen) {
      loadPaymentSummary()
      // Set default payment amount to remaining balance
      if (sale.paymentStatus?.remainingAmount) {
        setPaymentAmount(sale.paymentStatus.remainingAmount.toString())
      }
    }
  }, [sale, isOpen])

  const loadPaymentSummary = async () => {
    if (!sale?._id) return
    
    try {
      const response = await SalesAPI.getPaymentSummary(sale._id)
      if (response.success) {
        setPaymentSummary(response.data)
      }
    } catch (error) {
      console.error('Error loading payment summary:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paymentAmount || !paymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(paymentAmount)
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    if (amount > (sale.paymentStatus?.remainingAmount || sale.grossTotal)) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount cannot exceed remaining balance",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await SalesAPI.addPayment(sale._id, {
        amount,
        method: paymentMethod,
        notes,
        collectedBy: "Staff" // This could be enhanced to get actual staff name
      })

      if (response.success) {
        toast({
          title: "Payment Collected",
          description: response.message || `Payment of ₹${amount} collected successfully`,
        })
        
        // Reset form
        setPaymentAmount("")
        setPaymentMethod("")
        setNotes("")
        
        // Refresh payment summary
        await loadPaymentSummary()
        
        // Notify parent component
        onPaymentCollected()
        
        // Close modal if payment is complete (full payment or no remaining amount)
        const paymentSummary = (response as any).paymentSummary;
        if (paymentSummary?.remainingAmount === 0 || amount >= sale.paymentStatus?.remainingAmount) {
          onClose()
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to collect payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error collecting payment:', error)
      toast({
        title: "Error",
        description: "Failed to collect payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case "partial":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Partial</Badge>
      case "unpaid":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Unpaid</Badge>
      case "overdue":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Overdue</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'online':
        return <Receipt className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  if (!sale) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Collect Payment - {sale.billNo}
          </DialogTitle>
          <DialogDescription>
            Collect payment for {sale.customerName}'s bill
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bill Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Bill Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Customer:</span>
                <span className="ml-2 font-medium">{sale.customerName}</span>
              </div>
              <div>
                <span className="text-slate-600">Date:</span>
                <span className="ml-2 font-medium">{new Date(sale.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-600">Total Amount:</span>
                <span className="ml-2 font-medium text-green-700">₹{sale.grossTotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div>
                <span className="text-slate-600">Status:</span>
                <span className="ml-2">{getStatusBadge(sale.status)}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {paymentSummary && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Payment Status
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    ₹{paymentSummary.totalAmount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-blue-600 text-xs">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    ₹{paymentSummary.paidAmount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-green-600 text-xs">Paid Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-700">
                    ₹{paymentSummary.remainingAmount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-red-600 text-xs">Remaining</div>
                </div>
              </div>
              {paymentSummary.isOverdue && (
                <div className="mt-3 flex items-center gap-2 text-orange-700 bg-orange-100 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Payment is overdue</span>
                </div>
              )}
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={sale.paymentStatus?.remainingAmount || sale.grossTotal}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full"
                />
                <div className="text-xs text-slate-500">
                  Max: ₹{sale.paymentStatus?.remainingAmount?.toFixed(2) || sale.grossTotal?.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="Card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Card
                      </div>
                    </SelectItem>
                    <SelectItem value="Online">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Online
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows={3}
              />
            </div>
          </form>

          {/* Payment History */}
          {sale.paymentHistory && sale.paymentHistory.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Payment History</h3>
              <div className="space-y-2">
                {sale.paymentHistory.map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center gap-3">
                      {getPaymentMethodIcon(payment.method)}
                      <div>
                        <div className="font-medium text-slate-800">
                          ₹{payment.amount?.toFixed(2)} via {payment.method}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(payment.date).toLocaleDateString()} - {payment.collectedBy}
                        </div>
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="text-xs text-slate-600 max-w-32 truncate" title={payment.notes}>
                        {payment.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !paymentAmount || !paymentMethod}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Collecting..." : "Collect Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
