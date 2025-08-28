"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Receipt, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SettingsAPI } from "@/lib/api"

export function POSSettings() {
  const [invoicePrefix, setInvoicePrefix] = useState("INV")
  const [autoReset, setAutoReset] = useState(false)
  const [currentReceiptNumber, setCurrentReceiptNumber] = useState(1)
  const [isResetting, setIsResetting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load POS settings on component mount
  useEffect(() => {
    loadPOSSettings()
  }, [])

  const loadPOSSettings = async () => {
    try {
      const response = await SettingsAPI.getPOSSettings()
      if (response.success) {
        setInvoicePrefix(response.data.invoicePrefix || "INV")
        setAutoReset(response.data.autoResetReceipt || false)
        setCurrentReceiptNumber(response.data.receiptNumber || 1)
      }
    } catch (error) {
      console.error('Error loading POS settings:', error)
      toast({
        title: "Error",
        description: "Failed to load POS settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSequence = async () => {
    setIsResetting(true)
    try {
      const response = await SettingsAPI.resetReceiptSequence()
      if (response.success) {
        setCurrentReceiptNumber(1)
        toast({
          title: "Success",
          description: "Invoice sequence has been reset to 1.",
        })
      } else {
        throw new Error(response.error || 'Failed to reset sequence')
      }
    } catch (error: any) {
      console.error('Error resetting sequence:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to reset invoice sequence. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleSavePrefix = async () => {
    setIsSaving(true)
    try {
      const response = await SettingsAPI.updatePOSSettings({
        invoicePrefix,
        autoResetReceipt: autoReset
      })
      
      if (response.success) {
        toast({
          title: "Success",
          description: "POS settings have been saved successfully.",
        })
      } else {
        throw new Error(response.error || 'Failed to save settings')
      }
    } catch (error: any) {
      console.error('Error saving POS settings:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save POS settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAutoResetChange = async (checked: boolean) => {
    setAutoReset(checked)
    try {
      const response = await SettingsAPI.updatePOSSettings({
        invoicePrefix,
        autoResetReceipt: checked
      })
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Auto reset has been ${checked ? "enabled" : "disabled"}.`,
        })
      } else {
        throw new Error(response.error || 'Failed to update auto reset')
      }
    } catch (error: any) {
      console.error('Error updating auto reset:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update auto reset setting. Please try again.",
        variant: "destructive",
      })
      // Revert the change if API call fails
      setAutoReset(!checked)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">POS Settings</h1>
          <p className="text-muted-foreground">Loading POS settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">POS Settings</h1>
        <p className="text-muted-foreground">Configure point of sale settings and invoice management</p>
      </div>

      {/* Invoice Sequence Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice Sequence
          </CardTitle>
          <CardDescription>Configure invoice sequence number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Receipt Number */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">Current receipt number</h3>
              <p className="text-sm text-muted-foreground">
                Next receipt will be: {invoicePrefix}-{currentReceiptNumber.toString().padStart(6, '0')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Reset Invoice Sequence Instantly */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">Reset invoice sequence instantly</h3>
              <p className="text-sm text-muted-foreground">
                Instantly reset the invoice sequence number to 1.
              </p>
            </div>
            <Button 
              onClick={handleResetSequence}
              disabled={isResetting}
              variant="default"
            >
              {isResetting ? "Resetting..." : "Reset Now"}
            </Button>
          </div>

          <Separator />

          {/* Reset Invoice Sequence Automatically */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">Reset invoice sequence automatically</h3>
              <p className="text-sm text-muted-foreground">
                Automatically reset the invoice sequence number to 1 at the beginning of each month or year.
              </p>
            </div>
            <Switch
              checked={autoReset}
              onCheckedChange={handleAutoResetChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Prefix Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Prefix
          </CardTitle>
          <CardDescription>Configure custom prefix on the invoice number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix">Invoice prefix</Label>
            <Input
              id="invoice-prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="Enter invoice prefix"
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Example: Using "{invoicePrefix}" as the prefix will display as "{invoicePrefix}-000001" for the first receipt.
            </p>
          </div>
          <Button onClick={handleSavePrefix} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 