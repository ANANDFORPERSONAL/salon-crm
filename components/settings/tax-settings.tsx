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
import { Receipt } from "lucide-react"

const TAX_TYPES = [
  { value: "single", label: "Single Tax Rate" },
  { value: "gst", label: "GST (Goods & Services Tax)" },
  { value: "vat", label: "VAT (Value Added Tax)" },
  { value: "sales", label: "Sales Tax" },
]

const GST_RATES = [
  { value: "0", label: "0% - Exempt" },
  { value: "5", label: "5% - Essential Goods" },
  { value: "12", label: "12% - Standard" },
  { value: "18", label: "18% - Standard" },
  { value: "28", label: "28% - Luxury Goods" },
]

const PRODUCT_CATEGORIES = [
  { value: "essential", label: "Essential Products (5% GST)", rate: "5" },
  { value: "intermediate", label: "Intermediate Products (12% GST)", rate: "12" },
  { value: "standard", label: "Standard Products (18% GST)", rate: "18" },
  { value: "luxury", label: "Luxury Products (28% GST)", rate: "28" },
  { value: "exempt", label: "Exempt Products (0% GST)", rate: "0" },
]

export function TaxSettings() {
  const [settings, setSettings] = useState({
    enableTax: true,
    taxType: "single",
    taxRate: "18",
    cgstRate: "9",
    sgstRate: "9",
    igstRate: "18",
    serviceTaxRate: "5",
    productTaxRate: "18",
    // Product category tax rates
    essentialProductRate: "5",
    intermediateProductRate: "12",
    standardProductRate: "18",
    luxuryProductRate: "28",
    exemptProductRate: "0",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load tax settings on component mount
  useEffect(() => {
    loadTaxSettings()
  }, [])

  const loadTaxSettings = async () => {
    setIsLoading(true)
    try {
      const response = await SettingsAPI.getPaymentSettings()
      if (response.success) {
        setSettings({
          enableTax: response.data.enableTax !== false,
          taxType: response.data.taxType || "single",
          taxRate: response.data.taxRate?.toString() || "18",
          cgstRate: response.data.cgstRate?.toString() || "9",
          sgstRate: response.data.sgstRate?.toString() || "9",
          igstRate: response.data.igstRate?.toString() || "18",
          serviceTaxRate: response.data.serviceTaxRate?.toString() || "5",
          productTaxRate: response.data.productTaxRate?.toString() || "18",
          essentialProductRate: response.data.essentialProductRate?.toString() || "5",
          intermediateProductRate: response.data.intermediateProductRate?.toString() || "12",
          standardProductRate: response.data.standardProductRate?.toString() || "18",
          luxuryProductRate: response.data.luxuryProductRate?.toString() || "28",
          exemptProductRate: response.data.exemptProductRate?.toString() || "0",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tax settings. Please try again.",
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
        enableTax: settings.enableTax,
        taxType: settings.taxType,
        taxRate: parseFloat(settings.taxRate),
        cgstRate: parseFloat(settings.cgstRate),
        sgstRate: parseFloat(settings.sgstRate),
        igstRate: parseFloat(settings.igstRate),
        serviceTaxRate: parseFloat(settings.serviceTaxRate),
        productTaxRate: parseFloat(settings.productTaxRate),
        essentialProductRate: parseFloat(settings.essentialProductRate),
        intermediateProductRate: parseFloat(settings.intermediateProductRate),
        standardProductRate: parseFloat(settings.standardProductRate),
        luxuryProductRate: parseFloat(settings.luxuryProductRate),
        exemptProductRate: parseFloat(settings.exemptProductRate),
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Tax settings updated successfully!",
        })
      } else {
        throw new Error(response.error || "Failed to update tax settings")
      }
    } catch (error) {
      console.error("Error updating tax settings:", error)
      toast({
        title: "Error",
        description: "Failed to update tax settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading tax settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
              <Receipt className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Tax Settings</h3>
              <p className="text-slate-600 text-sm">Configure tax rates and calculation methods</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-slate-700">Enable Tax</Label>
                <p className="text-sm text-slate-600">Apply tax calculations to bills and invoices</p>
              </div>
              <Switch
                checked={settings.enableTax}
                onCheckedChange={(checked) => setSettings({ ...settings, enableTax: checked })}
              />
            </div>
            
            {settings.enableTax && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="taxType" className="text-sm font-medium text-slate-700">
                    Tax Type
                  </Label>
                  <Select
                    value={settings.taxType}
                    onValueChange={(value) => setSettings({ ...settings, taxType: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {settings.taxType === "single" && (
                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-sm font-medium text-slate-700">
                      Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                      placeholder="Enter tax rate"
                    />
                  </div>
                )}

                {settings.taxType === "gst" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cgstRate" className="text-sm font-medium text-slate-700">
                          CGST Rate (%)
                        </Label>
                        <Input
                          id="cgstRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.cgstRate}
                          onChange={(e) => setSettings({ ...settings, cgstRate: e.target.value })}
                          placeholder="Central GST"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sgstRate" className="text-sm font-medium text-slate-700">
                          SGST Rate (%)
                        </Label>
                        <Input
                          id="sgstRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.sgstRate}
                          onChange={(e) => setSettings({ ...settings, sgstRate: e.target.value })}
                          placeholder="State GST"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="igstRate" className="text-sm font-medium text-slate-700">
                        IGST Rate (%) - Inter-state transactions
                      </Label>
                      <Input
                        id="igstRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={settings.igstRate}
                        onChange={(e) => setSettings({ ...settings, igstRate: e.target.value })}
                        placeholder="Integrated GST"
                      />
                    </div>
                  </div>
                )}

                {settings.taxType === "vat" && (
                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-sm font-medium text-slate-700">
                      VAT Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                      placeholder="Enter VAT rate"
                    />
                  </div>
                )}

                {settings.taxType === "sales" && (
                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-sm font-medium text-slate-700">
                      Sales Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                      placeholder="Enter sales tax rate"
                    />
                  </div>
                )}

                {/* Service and Product specific tax rates */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-4">Item-Specific Tax Rates</h4>
                  
                  {/* Service Tax Rate */}
                  <div className="mb-6">
                    <Label htmlFor="serviceTaxRate" className="text-sm font-medium text-slate-700">
                      Service Tax Rate (%)
                    </Label>
                    <Input
                      id="serviceTaxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.serviceTaxRate}
                      onChange={(e) => setSettings({ ...settings, serviceTaxRate: e.target.value })}
                      placeholder="Service tax rate"
                      className="mt-2"
                    />
                    <p className="text-sm text-slate-500 mt-1">Applied to all salon services (haircuts, styling, treatments)</p>
                  </div>

                  {/* Product Category Tax Rates */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium text-slate-700">Product Category Tax Rates</h5>
                    <p className="text-sm text-slate-500">Different GST rates for different product categories as per Indian tax law</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="essentialProductRate" className="text-sm font-medium text-slate-700">
                          Essential Products (5% GST)
                        </Label>
                        <Input
                          id="essentialProductRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.essentialProductRate}
                          onChange={(e) => setSettings({ ...settings, essentialProductRate: e.target.value })}
                          placeholder="5"
                        />
                        <p className="text-xs text-slate-500">Basic hair care products, soaps, etc.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="intermediateProductRate" className="text-sm font-medium text-slate-700">
                          Intermediate Products (12% GST)
                        </Label>
                        <Input
                          id="intermediateProductRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.intermediateProductRate}
                          onChange={(e) => setSettings({ ...settings, intermediateProductRate: e.target.value })}
                          placeholder="12"
                        />
                        <p className="text-xs text-slate-500">Mid-range hair care products</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="standardProductRate" className="text-sm font-medium text-slate-700">
                          Standard Products (18% GST)
                        </Label>
                        <Input
                          id="standardProductRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.standardProductRate}
                          onChange={(e) => setSettings({ ...settings, standardProductRate: e.target.value })}
                          placeholder="18"
                        />
                        <p className="text-xs text-slate-500">Styling products, conditioners, etc.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="luxuryProductRate" className="text-sm font-medium text-slate-700">
                          Luxury Products (28% GST)
                        </Label>
                        <Input
                          id="luxuryProductRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.luxuryProductRate}
                          onChange={(e) => setSettings({ ...settings, luxuryProductRate: e.target.value })}
                          placeholder="28"
                        />
                        <p className="text-xs text-slate-500">Premium brands, luxury hair care</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="exemptProductRate" className="text-sm font-medium text-slate-700">
                          Exempt Products (0% GST)
                        </Label>
                        <Input
                          id="exemptProductRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.exemptProductRate}
                          onChange={(e) => setSettings({ ...settings, exemptProductRate: e.target.value })}
                          placeholder="0"
                        />
                        <p className="text-xs text-slate-500">Medical products, basic necessities</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-8"
        >
          {isSaving ? "Saving..." : "Save Tax Settings"}
        </Button>
      </div>
    </div>
  )
}
