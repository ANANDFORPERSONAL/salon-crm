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
import { SuppliersAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Supplier {
  _id: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive: boolean
}

interface SupplierComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SupplierCombobox({ value, onChange, disabled }: SupplierComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [newSupplierName, setNewSupplierName] = React.useState("")
  const [addingSupplier, setAddingSupplier] = React.useState(false)
  const { toast } = useToast()

  // Load suppliers on mount
  React.useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const response = await SuppliersAPI.getAll({ activeOnly: true })
      if (response.success) {
        setSuppliers(response.data)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setAddingSupplier(true)
      const response = await SuppliersAPI.create({ name: newSupplierName.trim() })
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Supplier added successfully",
        })
        
        // Reload suppliers and select the new one
        await loadSuppliers()
        onChange(newSupplierName.trim())
        
        // Close dialog and reset
        setShowAddDialog(false)
        setNewSupplierName("")
        setOpen(false)
      }
    } catch (error: any) {
      console.error('Error adding supplier:', error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add supplier",
        variant: "destructive",
      })
    } finally {
      setAddingSupplier(false)
    }
  }

  // Filter suppliers based on search query
  const filteredSuppliers = React.useMemo(() => {
    if (!searchQuery) return suppliers
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [suppliers, searchQuery])

  // Check if the search query matches an existing supplier
  const exactMatch = suppliers.find(
    s => s.name.toLowerCase() === searchQuery.toLowerCase()
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
            {value || "Select or type supplier..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search suppliers..."
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
                        setNewSupplierName(searchQuery)
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{searchQuery}"
                    </Button>
                  </div>
                ) : (
                  "No suppliers found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredSuppliers.map((supplier) => (
                  <CommandItem
                    key={supplier._id}
                    value={supplier.name}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === supplier.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {supplier.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {searchQuery && !exactMatch && filteredSuppliers.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setNewSupplierName(searchQuery)
                      setShowAddDialog(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new supplier "{searchQuery}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Create a new supplier to organize your product inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier-name">Supplier Name *</Label>
              <Input
                id="supplier-name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Enter supplier name"
                disabled={addingSupplier}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSupplier()
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
                setNewSupplierName("")
              }}
              disabled={addingSupplier}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSupplier} disabled={addingSupplier}>
              {addingSupplier ? "Adding..." : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

