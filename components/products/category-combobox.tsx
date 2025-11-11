"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Category {
  _id?: string
  name: string
  type?: 'product' | 'service' | 'both'
  description?: string
  isActive?: boolean
}

interface CategoryComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  type?: 'product' | 'service' | 'both' // Filter categories by type
}

export function CategoryCombobox({ value, onChange, disabled, type = 'both' }: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [addingCategory, setAddingCategory] = React.useState(false)
  const { toast } = useToast()

  // Load categories on mount
  React.useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Load once on mount - categories are fetched from products

  const loadCategories = async () => {
    try {
      setLoading(true)
      // Fetch all products to extract unique categories
      // Fetch with a high limit to get all products in one request
      const response = await ProductsAPI.getAll({ limit: 10000 })
      if (response.success && response.data) {
        // Extract unique categories from products
        const uniqueCategories = new Set<string>()
        const categoryMap = new Map<string, Category>()
        
        // Handle both array and paginated response
        const products = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        
        products.forEach((product: any) => {
          if (product.category && product.category.trim()) {
            const categoryName = product.category.trim()
            if (!uniqueCategories.has(categoryName)) {
              uniqueCategories.add(categoryName)
              categoryMap.set(categoryName, {
                name: categoryName,
                _id: categoryName, // Use name as ID for simplicity
                isActive: true
              })
            }
          }
        })
        
        // Convert map to array and sort alphabetically
        const categoriesArray = Array.from(categoryMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        )
        
        setCategories(categoriesArray)
      }
    } catch (error) {
      console.error('Error loading categories from products:', error)
      toast({
        title: "Error",
        description: "Failed to load categories from products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setAddingCategory(true)
      // Since categories are fetched from products, we just need to select the new category
      // The category will be created when a product with this category is saved
      const newCategory: Category = {
        name: newCategoryName.trim(),
        _id: newCategoryName.trim(),
        isActive: true
      }
      
      // Add to local state
      setCategories(prev => {
        const updated = [...prev, newCategory].sort((a, b) => 
          a.name.localeCompare(b.name)
        )
        return updated
      })
      
      // Select the new category
      onChange(newCategoryName.trim())
      
      toast({
        title: "Success",
        description: "Category will be saved when you create a product with this category",
      })
      
      // Close dialog and reset
      setShowAddDialog(false)
      setNewCategoryName("")
      setOpen(false)
    } catch (error: any) {
      console.error('Error adding category:', error)
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      })
    } finally {
      setAddingCategory(false)
    }
  }

  // Filter categories based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  // Check if the search query matches an existing category
  const exactMatch = categories.find(
    c => c.name.toLowerCase() === searchQuery.toLowerCase()
  )

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {value || "Select or type category..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search categories..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList 
              className="category-scroll-container max-h-[240px] overflow-y-auto overflow-x-hidden"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              <CommandEmpty>
                {searchQuery && !exactMatch ? (
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => {
                        setNewCategoryName(searchQuery)
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{searchQuery}"
                    </Button>
                  </div>
                ) : (
                  "No categories found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category._id || category.name}
                    value={category.name}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {searchQuery && !exactMatch && filteredCategories.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setNewCategoryName(searchQuery)
                      setShowAddDialog(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new category "{searchQuery}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Add a new category. It will be saved when you create a product with this category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                disabled={addingCategory}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCategory()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setNewCategoryName("")
              }}
              disabled={addingCategory}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={addingCategory}>
              {addingCategory ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

