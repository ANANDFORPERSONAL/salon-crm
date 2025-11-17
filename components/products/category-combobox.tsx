"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
import { CategoriesAPI, ProductsAPI, ServicesAPI } from "@/lib/api"
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
  onManageCategories?: () => void // Optional callback to open category management
}

export function CategoryCombobox({ value, onChange, disabled, type = 'both', onManageCategories }: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [addingCategory, setAddingCategory] = React.useState(false)
  const { toast } = useToast()

  // Load categories on mount and when type changes
  React.useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]) // Reload when type changes

  const loadCategories = async () => {
    try {
      setLoading(true)
      const uniqueCategories = new Set<string>()
      const categoryMap = new Map<string, Category>()
      
      // First, try to fetch from the Categories API
      try {
        const response = await CategoriesAPI.getAll({ 
          type, 
          activeOnly: true 
        })
        
        if (response.success && response.data) {
          response.data.forEach((category: any) => {
            if (category.name && category.name.trim()) {
              const categoryName = category.name.trim()
              uniqueCategories.add(categoryName)
              categoryMap.set(categoryName, {
                name: categoryName,
                _id: category._id || categoryName,
                type: category.type,
                isActive: category.isActive
              })
            }
          })
        }
      } catch (error) {
        console.log('Categories API not available or empty, will extract from products/services')
      }
      
      // Also extract categories from existing products and services for backward compatibility
      if (type === 'product' || type === 'both') {
        try {
          const response = await ProductsAPI.getAll({ limit: 10000 })
          if (response.success && response.data) {
            const products = Array.isArray(response.data) ? response.data : (response.data?.data || [])
            
            products.forEach((product: any) => {
              if (product.category && product.category.trim()) {
                const categoryName = product.category.trim()
                if (!uniqueCategories.has(categoryName)) {
                  uniqueCategories.add(categoryName)
                  categoryMap.set(categoryName, {
                    name: categoryName,
                    _id: categoryName,
                    isActive: true
                  })
                }
              }
            })
          }
        } catch (error) {
          console.log('Error fetching products for categories:', error)
        }
      }
      
      if (type === 'service' || type === 'both') {
        try {
          const response = await ServicesAPI.getAll({ limit: 10000 })
          if (response.success && response.data) {
            const services = Array.isArray(response.data) ? response.data : (response.data?.data || [])
            
            services.forEach((service: any) => {
              if (service.category && service.category.trim()) {
                const categoryName = service.category.trim()
                if (!uniqueCategories.has(categoryName)) {
                  uniqueCategories.add(categoryName)
                  categoryMap.set(categoryName, {
                    name: categoryName,
                    _id: categoryName,
                    isActive: true
                  })
                }
              }
            })
          }
        } catch (error) {
          console.log('Error fetching services for categories:', error)
        }
      }
      
      // Convert map to array and sort alphabetically
      const categoriesArray = Array.from(categoryMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      )
      
      setCategories(categoriesArray)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: "Error",
        description: "Failed to load categories",
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
      
      // Create the category using the API
      const response = await CategoriesAPI.create({
        name: newCategoryName.trim(),
        type: type === 'both' ? 'both' : type, // Use the specified type or 'both'
        description: ''
      })
      
      if (response.success && response.data) {
        // Reload categories to get the updated list
        await loadCategories()
        
        // Select the new category
        onChange(response.data.name)
        
        toast({
          title: "Success",
          description: "Category created successfully",
        })
        
        // Close dialog and reset
        setShowAddDialog(false)
        setNewCategoryName("")
        setOpen(false)
      } else {
        throw new Error(response.error || 'Failed to create category')
      }
    } catch (error: any) {
      console.error('Error adding category:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
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
              <CommandSeparator />
              <div className="p-2 text-center">
                <p className="text-xs text-muted-foreground">
                  <Settings className="inline h-3 w-3 mr-1" />
                  Go to <strong>Categories</strong> tab to edit/delete
                </p>
              </div>
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
              Create a new category for your {type === 'product' ? 'products' : type === 'service' ? 'services' : 'products and services'}.
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

