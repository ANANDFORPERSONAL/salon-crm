"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Package } from "lucide-react"
import { ProductsAPI } from "@/lib/api"
import { ProductForm } from "@/components/products/product-form"
import { useAuth } from "@/lib/auth-context"
import { useCurrency } from "@/hooks/use-currency"

export function ProductsTable() {
  const { formatAmount } = useCurrency()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const canManageProducts = user?.role === "admin" || user?.role === "manager"

  const fetchProducts = async () => {
    try {
      const response = await ProductsAPI.getAll()
      if (response.success) {
        setProducts(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Listen for custom events to refresh products
  useEffect(() => {
    const handleProductAdded = () => {
      fetchProducts()
    }

    window.addEventListener('product-added', handleProductAdded)
    return () => window.removeEventListener('product-added', handleProductAdded)
  }, [])

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsEditDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        console.log('Deleting product with ID:', productId)
        const response = await ProductsAPI.delete(productId)
        console.log('Delete response:', response)
        if (response.success) {
          // Refresh the products list
          fetchProducts()
          // Dispatch event to refresh stats
          window.dispatchEvent(new CustomEvent('product-added'))
        } else {
          console.error('Delete failed:', response.error)
        }
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStockBadge = (stock: number, minStock: number) => {
    if (stock <= minStock) {
      return <Badge variant="destructive">Low Stock</Badge>
    } else if (stock <= minStock * 2) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Medium
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        In Stock
      </Badge>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Enhanced Search and Add Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {filteredProducts.length} results
              </div>
            </div>
          )}
        </div>
        {canManageProducts && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Product Dialog */}
        {canManageProducts && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <ProductForm 
                product={selectedProduct} 
                onClose={() => {
                  setIsEditDialogOpen(false)
                  setSelectedProduct(null)
                }} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Enhanced Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Product Directory</h3>
            <div className="text-sm text-gray-600">
              {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Product Name</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Category</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Stock</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Price</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Supplier</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">SKU</TableHead>
                {canManageProducts && <TableHead className="px-4 py-3 text-center font-semibold text-gray-700 w-[70px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow key="loading">
                  <TableCell colSpan={canManageProducts ? 7 : 6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600 text-sm">Loading products...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow key="empty">
                  <TableCell colSpan={canManageProducts ? 7 : 6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900">No products found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow 
                    key={product._id || product.id}
                    className={`hover:bg-gray-50/50 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">ID: {product._id?.slice(-6) || product.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="px-2 py-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="text-base font-medium text-gray-700">{product.stock}</div>
                        {getStockBadge(product.stock, product.minStock || 10)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-emerald-600">{formatAmount(product.price)}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {product.supplier || (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {product.sku}
                      </div>
                    </TableCell>
                    {canManageProducts && (
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem 
                                onClick={() => handleEditProduct(product)}
                                className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                                onClick={() => handleDeleteProduct(product._id || product.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
