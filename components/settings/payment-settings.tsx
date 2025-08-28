"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SettingsAPI } from "@/lib/api"

export function PaymentSettings() {
  const [settings, setSettings] = useState({
    currency: "INR",
    taxRate: "8.25",
    processingFee: "2.9",
    enableCurrency: true,
    enableTax: true,
    enableProcessingFees: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load payment settings on component mount
  useEffect(() => {
    loadPaymentSettings()
  }, [])

  const loadPaymentSettings = async () => {
    setIsLoading(true)
    try {
      const response = await SettingsAPI.getPaymentSettings()
      if (response.success) {
        setSettings({
          currency: response.data.currency || "INR",
          taxRate: response.data.taxRate?.toString() || "8.25",
          processingFee: response.data.processingFee?.toString() || "2.9",
          enableCurrency: response.data.enableCurrency !== false,
          enableTax: response.data.enableTax !== false,
          enableProcessingFees: response.data.enableProcessingFees !== false,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payment settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await SettingsAPI.updatePaymentSettings({
        currency: settings.currency,
        taxRate: parseFloat(settings.taxRate),
        processingFee: parseFloat(settings.processingFee),
        enableCurrency: settings.enableCurrency,
        enableTax: settings.enableTax,
        enableProcessingFees: settings.enableProcessingFees,
      })
      
      if (response.success) {
        toast({
          title: "Payment settings saved",
          description: "Your payment configuration has been updated.",
        })
      } else {
        throw new Error(response.error || "Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Configuration</h2>
          <p className="text-muted-foreground">Configure payment methods, tax settings, and billing options</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading payment settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Configuration</h2>
        <p className="text-muted-foreground">Configure payment methods, tax settings, and billing options</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency & Tax</CardTitle>
            <CardDescription>Set your default currency and tax rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Currency</Label>
                <p className="text-sm text-muted-foreground">Show currency symbols and formatting</p>
              </div>
              <Switch
                checked={settings.enableCurrency}
                onCheckedChange={(checked) => setSettings({ ...settings, enableCurrency: checked })}
              />
            </div>
            {settings.enableCurrency && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => setSettings({ ...settings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Tax</Label>
                <p className="text-sm text-muted-foreground">Apply tax calculations to bills</p>
              </div>
              <Switch
                checked={settings.enableTax}
                onCheckedChange={(checked) => setSettings({ ...settings, enableTax: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Fees</CardTitle>
            <CardDescription>Configure payment processing settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Processing Fees</Label>
                <p className="text-sm text-muted-foreground">Apply processing fees to card transactions</p>
              </div>
              <Switch
                checked={settings.enableProcessingFees}
                onCheckedChange={(checked) => setSettings({ ...settings, enableProcessingFees: checked })}
              />
            </div>
            {settings.enableProcessingFees && (
              <div className="space-y-2">
                <Label htmlFor="processingFee">Processing Fee (%)</Label>
                <Input
                  id="processingFee"
                  type="number"
                  step="0.1"
                  value={settings.processingFee}
                  onChange={(e) => setSettings({ ...settings, processingFee: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Fee charged for card transactions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
