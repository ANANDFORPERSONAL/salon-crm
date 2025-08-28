"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ProductsAPI } from "@/lib/api"

interface ProductFormProps {
  onClose: () => void
  product?: any // For edit mode
}

export function ProductForm({ onClose, product }: ProductFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "",
    price: product?.price || "",
    cost: product?.cost || "",
    stock: product?.stock || "",
    minStock: product?.minStock || "",
    supplier: product?.supplier || "",
    sku: product?.sku || "",
    description: product?.description || "",
    barcode: product?.barcode || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku || `SKU-${Date.now()}`,
        supplier: formData.supplier,
        description: formData.description,
        isActive: true
      }

      console.log('Submitting product data:', productData)

      let response
      if (product) {
        // Edit mode
        console.log('Updating product with ID:', product._id || product.id)
        response = await ProductsAPI.update(product._id || product.id, productData)
        console.log('Update response:', response)
        if (response.success) {
          toast({
            title: "Product updated",
            description: `${formData.name} has been updated successfully.`,
          })
        }
      } else {
        // Create mode
        console.log('Creating new product')
        response = await ProductsAPI.create(productData)
        console.log('Create response:', response)
        if (response.success) {
          toast({
            title: "Product created",
            description: `${formData.name} has been added to your inventory.`,
          })
        }
      }
      
      if (response.success) {
        onClose()
        
        // Dispatch custom event to refresh stats
        window.dispatchEvent(new CustomEvent('product-added'))
      } else {
        throw new Error(response.error || `Failed to ${product ? 'update' : 'create'} product`)
      }
    } catch (error) {
      console.error(`Error ${product ? 'updating' : 'creating'} product:`, error)
      toast({
        title: "Error",
        description: `Failed to ${product ? 'update' : 'create'} product. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hair Care">Hair Care</SelectItem>
              <SelectItem value="Skin Care">Skin Care</SelectItem>
              <SelectItem value="Styling Tools">Styling Tools</SelectItem>
              <SelectItem value="Color Products">Color Products</SelectItem>
              <SelectItem value="Accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Selling Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Cost Price</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => handleChange("cost", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Current Stock *</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => handleChange("stock", e.target.value)}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStock">Minimum Stock Level</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={(e) => handleChange("minStock", e.target.value)}
            placeholder="5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => handleChange("supplier", e.target.value)}
            placeholder="Supplier name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => handleChange("sku", e.target.value)}
            placeholder="Product SKU"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Product description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode</Label>
        <Input
          id="barcode"
          value={formData.barcode}
          onChange={(e) => handleChange("barcode", e.target.value)}
          placeholder="Barcode number"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{product ? "Update Product" : "Create Product"}</Button>
      </div>
    </form>
  )
}
