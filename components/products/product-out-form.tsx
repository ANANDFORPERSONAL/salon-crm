"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ProductsAPI, InventoryAPI } from "@/lib/api"
import { X, Package, Minus } from "lucide-react"

interface ProductOutFormProps {
  onClose: () => void
  onTransactionCreated?: () => void
}

export function ProductOutForm({ onClose, onTransactionCreated }: ProductOutFormProps) {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    transactionType: "service_usage",
    reason: "",
    notes: ""
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await ProductsAPI.getAll()
      if (response.success) {
        setProducts(response.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productId || !formData.quantity || !formData.transactionType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const quantity = parseInt(formData.quantity)
    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive"
      })
      return
    }

    const selectedProduct = products.find(p => p._id === formData.productId)
    if (!selectedProduct) {
      toast({
        title: "Product Not Found",
        description: "Selected product not found",
        variant: "destructive"
      })
      return
    }

    if (selectedProduct.stock < quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${selectedProduct.stock} units available`,
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      // Create inventory transaction for stock deduction
      const transactionData = {
        productId: formData.productId,
        quantity: quantity, // Positive quantity, API will handle the negative
        transactionType: formData.transactionType,
        reason: formData.reason,
        notes: formData.notes
      }

      const result = await InventoryAPI.deductProduct(transactionData)

      if (result.success) {
        toast({
          title: "Success",
          description: `Deducted ${quantity} units of ${selectedProduct.name}`,
        })
        
        setFormData({
          productId: "",
          quantity: "",
          transactionType: "service_usage",
          reason: "",
          notes: ""
        })
        
        onTransactionCreated?.()
        onClose()
      } else {
        throw new Error(result.error || 'Failed to deduct product')
      }
    } catch (error: any) {
      console.error('Error deducting product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to deduct product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'service_usage': 'Service Usage',
      'damage': 'Damage',
      'expiry': 'Expiry',
      'theft': 'Theft',
      'adjustment': 'Adjustment',
      'other': 'Other'
    }
    return labels[type] || type
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-red-500" />
            <CardTitle>Product Out</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => handleChange("productId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product to deduct" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          Stock: {product.stock}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="Enter quantity to deduct"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value) => handleChange("transactionType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service_usage">Service Usage - Used in services</SelectItem>
                  <SelectItem value="damage">Damage - Product damaged</SelectItem>
                  <SelectItem value="expiry">Expiry - Product expired</SelectItem>
                  <SelectItem value="theft">Theft - Product stolen</SelectItem>
                  <SelectItem value="adjustment">Adjustment - Stock correction</SelectItem>
                  <SelectItem value="other">Other - Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Brief reason for deduction"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes (optional)"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Deduct Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
