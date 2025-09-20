"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TaxCalculator, createTaxCalculator, type TaxSettings, type BillItem } from "@/lib/tax-calculator"
import { SettingsAPI } from "@/lib/api"

export function TaxTest() {
  const [taxCalculator, setTaxCalculator] = useState<TaxCalculator | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadTaxSettings()
  }, [])

  const loadTaxSettings = async () => {
    try {
      const response = await SettingsAPI.getPaymentSettings()
      if (response.success) {
        const taxSettingsData: TaxSettings = {
          enableTax: response.data.enableTax !== false,
          taxType: response.data.taxType || 'gst',
          serviceTaxRate: response.data.serviceTaxRate || 5,
          essentialProductRate: response.data.essentialProductRate || 5,
          intermediateProductRate: response.data.intermediateProductRate || 12,
          standardProductRate: response.data.standardProductRate || 18,
          luxuryProductRate: response.data.luxuryProductRate || 28,
          exemptProductRate: response.data.exemptProductRate || 0,
          cgstRate: response.data.cgstRate || 9,
          sgstRate: response.data.sgstRate || 9,
        }
        setTaxCalculator(createTaxCalculator(taxSettingsData))
      }
    } catch (error) {
      console.error('Failed to load tax settings:', error)
    }
  }

  const runTaxTests = () => {
    if (!taxCalculator) return

    setIsLoading(true)
    const results: any[] = []

    // Test 1: Service Tax
    const serviceItem: BillItem = {
      id: "1",
      name: "Haircut",
      type: "service",
      price: 500,
      quantity: 1
    }
    const serviceResult = taxCalculator.calculateItemTax(serviceItem)
    results.push({
      test: "Service Tax (5%)",
      item: serviceItem,
      result: serviceResult,
      expected: { taxRate: 5, cgst: 12.5, sgst: 12.5 }
    })

    // Test 2: Essential Product
    const essentialItem: BillItem = {
      id: "2",
      name: "Shampoo",
      type: "product",
      price: 200,
      quantity: 1,
      taxCategory: "essential"
    }
    const essentialResult = taxCalculator.calculateItemTax(essentialItem)
    results.push({
      test: "Essential Product (5%)",
      item: essentialItem,
      result: essentialResult,
      expected: { taxRate: 5, cgst: 5, sgst: 5 }
    })

    // Test 3: Standard Product
    const standardItem: BillItem = {
      id: "3",
      name: "Styling Gel",
      type: "product",
      price: 300,
      quantity: 1,
      taxCategory: "standard"
    }
    const standardResult = taxCalculator.calculateItemTax(standardItem)
    results.push({
      test: "Standard Product (18%)",
      item: standardItem,
      result: standardResult,
      expected: { taxRate: 18, cgst: 27, sgst: 27 }
    })

    // Test 4: Luxury Product
    const luxuryItem: BillItem = {
      id: "4",
      name: "Premium Serum",
      type: "product",
      price: 500,
      quantity: 1,
      taxCategory: "luxury"
    }
    const luxuryResult = taxCalculator.calculateItemTax(luxuryItem)
    results.push({
      test: "Luxury Product (28%)",
      item: luxuryItem,
      result: luxuryResult,
      expected: { taxRate: 28, cgst: 70, sgst: 70 }
    })

    // Test 5: Mixed Bill
    const mixedItems: BillItem[] = [
      serviceItem,
      essentialItem,
      standardItem,
      luxuryItem
    ]
    const mixedResult = taxCalculator.calculateBillTax(mixedItems)
    results.push({
      test: "Mixed Bill",
      items: mixedItems,
      result: mixedResult,
      expected: { totalTax: 229, totalCGST: 114.5, totalSGST: 114.5 }
    })

    setTestResults(results)
    setIsLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getTestStatus = (result: any, expected: any) => {
    if (result.taxRate !== expected.taxRate) return "❌"
    if (Math.abs(result.cgst - expected.cgst) > 0.01) return "❌"
    if (Math.abs(result.sgst - expected.sgst) > 0.01) return "❌"
    return "✅"
  }

  const getMixedTestStatus = (result: any, expected: any) => {
    if (Math.abs(result.summary.totalTaxAmount - expected.totalTax) > 0.01) return "❌"
    if (Math.abs(result.summary.totalCGST - expected.totalCGST) > 0.01) return "❌"
    if (Math.abs(result.summary.totalSGST - expected.totalSGST) > 0.01) return "❌"
    return "✅"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 GST Tax Calculator Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTaxTests} disabled={!taxCalculator || isLoading}>
            {isLoading ? "Running Tests..." : "Run Tax Tests"}
          </Button>
          {!taxCalculator && (
            <p className="text-sm text-gray-500 mt-2">
              Loading tax settings...
            </p>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {test.test}
                  {test.test === "Mixed Bill" ? 
                    getMixedTestStatus(test.result, test.expected) :
                    getTestStatus(test.result, test.expected)
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {test.test === "Mixed Bill" ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Items:</h4>
                        <div className="space-y-1">
                          {test.items.map((item: BillItem, i: number) => (
                            <div key={i} className="text-sm">
                              {item.name} - {formatCurrency(item.price)}
                              {item.taxCategory && (
                                <Badge variant="outline" className="ml-2">
                                  {item.taxCategory}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Tax Summary:</h4>
                        <div className="space-y-1 text-sm">
                          <div>Total Tax: {formatCurrency(test.result.summary.totalTaxAmount)}</div>
                          <div>CGST: {formatCurrency(test.result.summary.totalCGST)}</div>
                          <div>SGST: {formatCurrency(test.result.summary.totalSGST)}</div>
                          <div>Total Amount: {formatCurrency(test.result.summary.totalAmount)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Item Details:</h4>
                      <div className="text-sm space-y-1">
                        <div>Name: {test.item.name}</div>
                        <div>Type: {test.item.type}</div>
                        <div>Price: {formatCurrency(test.item.price)}</div>
                        <div>Quantity: {test.item.quantity}</div>
                        {test.item.taxCategory && (
                          <div>Category: <Badge variant="outline">{test.item.taxCategory}</Badge></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Tax Calculation:</h4>
                      <div className="text-sm space-y-1">
                        <div>Tax Rate: {test.result.taxRate}%</div>
                        <div>Base Amount: {formatCurrency(test.result.baseAmount)}</div>
                        <div>Tax Amount: {formatCurrency(test.result.taxAmount)}</div>
                        <div>CGST: {formatCurrency(test.result.cgst)}</div>
                        <div>SGST: {formatCurrency(test.result.sgst)}</div>
                        <div>Total: {formatCurrency(test.result.totalAmount)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
