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
import { CategoriesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Category {
  _id: string
  name: string
  type: 'product' | 'service' | 'both'
  description?: string
  isActive: boolean
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
  }, [type])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await CategoriesAPI.getAll({ activeOnly: true, type })
      if (response.success) {
        setCategories(response.data)
      }
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
      const response = await CategoriesAPI.create({ 
        name: newCategoryName.trim(),
        type: type === 'both' ? 'both' : type
      })
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Category added successfully",
        })
        
        // Reload categories and select the new one
        await loadCategories()
        onChange(newCategoryName.trim())
        
        // Close dialog and reset
        setShowAddDialog(false)
        setNewCategoryName("")
        setOpen(false)
      }
    } catch (error: any) {
      console.error('Error adding category:', error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add category",
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
            <CommandList>
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
                    key={category._id}
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
              Create a new category to organize your {type === 'product' ? 'products' : type === 'service' ? 'services' : 'items'}.
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

