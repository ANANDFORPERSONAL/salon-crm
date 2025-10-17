"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ServicesAPI } from "@/lib/api"
import { useCurrency } from "@/hooks/use-currency"
import { CategoryCombobox } from "../products/category-combobox"

interface ServiceFormProps {
  onClose?: () => void
  service?: any // For edit mode
}

export function ServiceForm({ onClose, service }: ServiceFormProps) {
  const { getSymbol } = useCurrency()
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    category: service?.category || "",
    duration: service?.duration?.toString() || "",
    price: service?.price?.toString() || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        isActive: true
      }

      console.log('Submitting service data:', serviceData)

      let response
      if (service) {
        // Edit mode
        console.log('Updating service with ID:', service.id)
        response = await ServicesAPI.update(service._id || service.id, serviceData)
        console.log('Update response:', response)
        if (response.success) {
          toast({
            title: "Service updated",
            description: "The service has been updated successfully.",
          })
        }
      } else {
        // Create mode
        console.log('Creating new service')
        response = await ServicesAPI.create(serviceData)
        console.log('Create response:', response)
        if (response.success) {
          toast({
            title: "Service created",
            description: "The service has been added successfully.",
          })

          // Reset form only for create mode
          setFormData({
            name: "",
            description: "",
            category: "",
            duration: "",
            price: "",
          })
        }
      }
      
      if (response.success) {
        onClose?.()
        
        // Dispatch custom event to refresh stats
        window.dispatchEvent(new CustomEvent('service-added'))
      } else {
        throw new Error(response.error || `Failed to ${service ? 'update' : 'create'} service`)
      }
    } catch (error) {
      console.error(`Error ${service ? 'updating' : 'creating'} service:`, error)
      toast({
        title: "Error",
        description: `Failed to ${service ? 'update' : 'create'} service. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter service name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter service description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <CategoryCombobox
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            type="service"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="60"
            min="1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
                        <Label htmlFor="price">Price ({getSymbol()})</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="0.00"
          min="0"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (service ? "Updating..." : "Creating...") : (service ? "Update Service" : "Create Service")}
        </Button>
      </div>
    </form>
  )
}
