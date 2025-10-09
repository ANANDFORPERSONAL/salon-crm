"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ProductsAPI } from "@/lib/api"
import { SupplierCombobox } from "./supplier-combobox"
import { CategoryCombobox } from "./category-combobox"
import { Search, CheckCircle, AlertCircle } from "lucide-react"

interface ProductFormProps {
  onClose: () => void
  product?: any // For edit mode
  onProductUpdated?: () => void // Callback to refresh the products list
  onSwitchToEdit?: (product: any) => void // Callback to switch to edit mode
}

export function ProductForm({ onClose, product, onProductUpdated, onSwitchToEdit }: ProductFormProps) {
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
    taxCategory: product?.taxCategory || "standard",
    productType: product?.productType || "retail",
    transactionType: "purchase", // Default to purchase for new products
  })

  // Search functionality states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle')

  // Update form data when product prop changes (for edit mode)
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price || "",
        cost: product.cost || "",
        stock: product.stock || "",
        minStock: product.minStock || "",
        supplier: product.supplier || "",
        sku: product.sku || "",
        description: product.description || "",
        barcode: product.barcode || "",
        taxCategory: product.taxCategory || "standard",
        productType: product.productType || "retail",
        transactionType: "purchase",
      })
      setSearchQuery(product.name || "")
    }
  }, [product])

  // Debounced search function
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setSearchStatus('idle')
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setSearchStatus('searching')

    try {
      const response = await ProductsAPI.getAll({ search: query, limit: 5 })
      if (response.success && response.data) {
        setSearchResults(response.data)
        setSearchStatus(response.data.length > 0 ? 'found' : 'not-found')
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setSearchStatus('not-found')
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setSearchStatus('not-found')
      setShowSearchResults(true)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchProducts])

  // Handle product selection from search results
  const handleProductSelect = (selectedProduct: any) => {
    setFormData({
      name: selectedProduct.name || "",
      category: selectedProduct.category || "",
      price: selectedProduct.price || "",
      cost: selectedProduct.cost || "",
      stock: selectedProduct.stock || "",
      minStock: selectedProduct.minStock || "",
      supplier: selectedProduct.supplier || "",
      sku: selectedProduct.sku || "",
      description: selectedProduct.description || "",
      barcode: selectedProduct.barcode || "",
      taxCategory: selectedProduct.taxCategory || "standard",
      productType: selectedProduct.productType || "retail",
      transactionType: "purchase",
    })
    
    setSearchQuery(selectedProduct.name)
    setShowSearchResults(false)
    setSearchStatus('found')
    
    // Switch to edit mode if callback is provided
    if (onSwitchToEdit) {
      onSwitchToEdit(selectedProduct)
    }
    
    toast({
      title: "Product Found",
      description: `Switched to edit mode for "${selectedProduct.name}". You can modify the details and save changes.`,
    })
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setFormData(prev => ({ ...prev, name: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: formData.productType === 'service' ? 0 : parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku || `SKU-${Date.now()}`,
        supplier: formData.supplier,
        description: formData.description,
        taxCategory: formData.taxCategory,
        productType: formData.productType,
        transactionType: formData.transactionType,
        isActive: true
      }

      console.log('Submitting product data:', productData)
      console.log('Tax category being sent:', formData.taxCategory)

      let response
      if (product) {
        // Edit mode
        console.log('🔍 EDIT MODE - Product object:', product)
        console.log('🔍 EDIT MODE - Product ID:', product._id || product.id)
        console.log('🔍 EDIT MODE - Product name:', product.name)
        console.log('🔍 EDIT MODE - Form data:', formData)
        console.log('🔍 EDIT MODE - Product data to send:', productData)
        
        try {
          response = await ProductsAPI.update(product._id || product.id, productData)
          console.log('✅ Update response:', response)
          
          if (response.success) {
            toast({
              title: "Product updated",
              description: `${formData.name} has been updated successfully.`,
            })
          } else {
            console.error('❌ Update failed:', response)
            toast({
              title: "Update failed",
              description: response.error || "Failed to update product",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('❌ Update error:', error)
          toast({
            title: "Update error",
            description: "An error occurred while updating the product",
            variant: "destructive",
          })
          return
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
        
        // Call the refresh callback if provided
        if (onProductUpdated) {
          onProductUpdated()
        }
        
        // Dispatch custom event to refresh products list
        window.dispatchEvent(new CustomEvent('product-added'))
        console.log('Product update successful, dispatching refresh event')
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
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="name"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search or enter product name..."
                required
                className="pl-10"
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              {searchStatus === 'found' && !isSearching && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
              )}
              {searchStatus === 'not-found' && !isSearching && searchQuery.length > 2 && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-500 h-4 w-4" />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product._id || product.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.category} • Stock: {product.stock} • ₹{product.price}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {product.sku}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* No Results Message */}
            {showSearchResults && searchStatus === 'not-found' && searchQuery.length > 2 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="px-4 py-3 text-center text-gray-500">
                  <AlertCircle className="mx-auto h-6 w-6 text-orange-500 mb-2" />
                  <p>No products found matching "{searchQuery}"</p>
                  <p className="text-sm">You can create a new product with this name</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <CategoryCombobox
            value={formData.category}
            onChange={(value) => handleChange("category", value)}
            type="product"
          />
        </div>

        {formData.productType !== 'service' && (
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
        )}

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
          <SupplierCombobox
            value={formData.supplier}
            onChange={(value) => handleChange("supplier", value)}
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

        <div className="space-y-2">
          <Label htmlFor="taxCategory">Tax Category *</Label>
          <Select
            value={formData.taxCategory}
            onValueChange={(value) => handleChange("taxCategory", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tax category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essential">Essential Products (5% GST)</SelectItem>
              <SelectItem value="intermediate">Intermediate Products (12% GST)</SelectItem>
              <SelectItem value="standard">Standard Products (18% GST)</SelectItem>
              <SelectItem value="luxury">Luxury Products (28% GST)</SelectItem>
              <SelectItem value="exempt">Exempt Products (0% GST)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Select the appropriate tax category for this product as per Indian GST law
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="productType">Product Type *</Label>
          <Select
            value={formData.productType}
            onValueChange={(value) => handleChange("productType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail - Sold to customers</SelectItem>
              <SelectItem value="service">Service - Used in services only</SelectItem>
              <SelectItem value="both">Both - Retail & Service</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            How this product will be used in your business
          </p>
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
              <SelectItem value="purchase">Purchase - New stock received</SelectItem>
              <SelectItem value="return">Return - Customer return</SelectItem>
              <SelectItem value="adjustment">Adjustment - Stock correction</SelectItem>
              <SelectItem value="restock">Restock - Manual restock</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            How this product is being added to inventory
          </p>
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
