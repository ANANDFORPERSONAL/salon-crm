"use client"

import { useState, useEffect } from "react"
import { Search, Edit, Trash2, Plus, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ServiceForm } from "./service-form"
import { ServicesAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useCurrency } from "@/hooks/use-currency"

export function ServicesTable() {
  const { formatAmount } = useCurrency()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const canManageServices = user?.role === "admin" || user?.role === "manager"

  const fetchServices = async () => {
    try {
      const response = await ServicesAPI.getAll()
      if (response.success) {
        setServices(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Listen for custom events to refresh services
  useEffect(() => {
    const handleServiceAdded = () => {
      fetchServices()
    }

    window.addEventListener('service-added', handleServiceAdded)
    return () => window.removeEventListener('service-added', handleServiceAdded)
  }, [])

  const handleEditService = (service: any) => {
    setSelectedService(service)
    setIsEditServiceOpen(true)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        console.log('Deleting service with ID:', serviceId)
        const response = await ServicesAPI.delete(serviceId)
        console.log('Delete response:', response)
        if (response.success) {
          // Refresh the services list
          fetchServices()
          // Dispatch event to refresh stats
          window.dispatchEvent(new CustomEvent('service-added'))
        } else {
          console.error('Delete failed:', response.error)
        }
      } catch (error) {
        console.error('Failed to delete service:', error)
      }
    }
  }

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4 p-4">
      {/* Enhanced Search and Add Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-300"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {filteredServices.length} results
              </div>
            </div>
          )}
        </div>
        {canManageServices && (
          <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <ServiceForm onClose={() => setIsAddServiceOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Enhanced Table Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Service Directory</h3>
            <div className="text-sm text-gray-600">
              {filteredServices.length} of {services.length} services
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Service Name</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Category</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Duration</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Price</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-gray-700">Description</TableHead>
                {canManageServices && <TableHead className="px-4 py-3 text-center font-semibold text-gray-700 w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManageServices ? 6 : 5} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600 text-sm">Loading services...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageServices ? 6 : 5} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Scissors className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900">No services found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service, index) => (
                  <TableRow 
                    key={service._id || service.id} 
                    className={`hover:bg-gray-50/50 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Scissors className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-500">ID: {service._id?.slice(-6) || service.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="px-2 py-1 bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                        {service.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{service.duration} min</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-emerald-600">{formatAmount(service.price)}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 max-w-xs">
                      <div className="text-sm text-gray-600">
                        {service.description || (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </div>
                    </TableCell>
                    {canManageServices && (
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditService(service)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service._id || service.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Edit Service Dialog */}
      {canManageServices && (
        <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            <ServiceForm 
              service={selectedService} 
              onClose={() => {
                setIsEditServiceOpen(false)
                setSelectedService(null)
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
