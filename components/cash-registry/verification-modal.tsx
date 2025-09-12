"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CashRegistryAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, XCircle, CreditCard } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface VerificationData {
  entryId: string
  balanceDifferenceReason?: string
  onlinePosDifferenceReason?: string
}

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (data: VerificationData) => Promise<void>
  closingEntry: CashRegistryEntry | null
  cashDifference: number
  onlineCashDifference: number
}

export function VerificationModal({ 
  isOpen, 
  onClose, 
  onVerify, 
  closingEntry, 
  cashDifference, 
  onlineCashDifference 
}: VerificationModalProps) {
  const [balanceDifferenceReason, setBalanceDifferenceReason] = useState("")
  const [onlinePosDifferenceReason, setOnlinePosDifferenceReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Check if there are any differences that need reasons
  const hasBalanceDifference = cashDifference !== 0
  const hasOnlinePosDifference = onlineCashDifference !== 0
  const hasAnyDifference = hasBalanceDifference || hasOnlinePosDifference

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBalanceDifferenceReason("")
      setOnlinePosDifferenceReason("")
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!closingEntry) {
      toast({
        title: "Error",
        description: "No closing entry found to verify.",
        variant: "destructive"
      })
      return
    }

    // Validate that reasons are provided for any differences
    if (hasBalanceDifference && !balanceDifferenceReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the Cash Difference.",
        variant: "destructive"
      })
      return
    }

    if (hasOnlinePosDifference && !onlinePosDifferenceReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the Online Cash Difference.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onVerify({
        entryId: closingEntry.id,
        balanceDifferenceReason: hasBalanceDifference ? balanceDifferenceReason.trim() : undefined,
        onlinePosDifferenceReason: hasOnlinePosDifference ? onlinePosDifferenceReason.trim() : undefined,
      })
      
      // Reset form and close modal
      setBalanceDifferenceReason("")
      setOnlinePosDifferenceReason("")
      onClose()
    } catch (error) {
      console.error("Verification failed:", error)
      toast({
        title: "Verification Failed",
        description: "An error occurred during verification. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If no differences, show success message but still allow verification
  if (!hasAnyDifference) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Perfect Balance!
            </DialogTitle>
            <DialogDescription>
              No cash differences detected. The registry is perfectly balanced and ready for verification.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!closingEntry) {
                  toast({
                    title: "Error",
                    description: "No closing entry found to verify.",
                    variant: "destructive"
                  })
                  return
                }
                
                setIsSubmitting(true)
                try {
                  await onVerify({
                    entryId: closingEntry.id,
                    balanceDifferenceReason: undefined,
                    onlinePosDifferenceReason: undefined,
                  })
                  
                  onClose()
                } catch (error) {
                  console.error("Verification failed:", error)
                  toast({
                    title: "Verification Failed",
                    description: "An error occurred during verification. Please try again.",
                    variant: "destructive"
                  })
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify and Close
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Cash Difference Verification Required
          </DialogTitle>
          <DialogDescription>
            Please provide reasons for the cash differences before verification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cash Difference Section */}
          {hasBalanceDifference && (
            <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">
                  Cash Difference: ₹{cashDifference.toFixed(2)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="balanceDifferenceReason" className="text-sm">
                  Reason for Cash Difference *
                </Label>
                <Textarea
                  id="balanceDifferenceReason"
                  value={balanceDifferenceReason}
                  onChange={(e) => setBalanceDifferenceReason(e.target.value)}
                  placeholder="Please explain the reason for the cash difference..."
                  className="min-h-[80px]"
                  required
                />
              </div>
            </div>
          )}

          {/* Online Cash Difference Section */}
          {hasOnlinePosDifference && (
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Online Cash Difference: ₹{onlineCashDifference.toFixed(2)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="onlinePosDifferenceReason" className="text-sm">
                  Reason for Online Cash Difference *
                </Label>
                <Textarea
                  id="onlinePosDifferenceReason"
                  value={onlinePosDifferenceReason}
                  onChange={(e) => setOnlinePosDifferenceReason(e.target.value)}
                  placeholder="Please explain the reason for the online cash difference..."
                  className="min-h-[80px]"
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify and Close
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
