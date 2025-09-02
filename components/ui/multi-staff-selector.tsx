"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface StaffContribution {
  staffId: string
  staffName: string
  percentage?: number
  amount?: number
}

interface MultiStaffSelectorProps {
  staffList: Array<{ _id?: string; id?: string; name: string; role?: string }>
  serviceTotal?: number
  onStaffContributionsChange: (contributions: StaffContribution[]) => void
  initialContributions?: StaffContribution[]
  disabled?: boolean
}

export function MultiStaffSelector({
  staffList,
  serviceTotal = 0,
  onStaffContributionsChange,
  initialContributions = [],
  disabled = false
}: MultiStaffSelectorProps) {
  const { toast } = useToast()
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    initialContributions.map(c => c.staffId)
  )
  const [showAddStaff, setShowAddStaff] = useState(false)

  // Convert selected staff IDs to contributions
  const contributions: StaffContribution[] = selectedStaffIds.map(staffId => {
    const staff = staffList.find(s => (s._id || s.id) === staffId)
    return {
      staffId,
      staffName: staff?.name || 'Unknown Staff',
      percentage: selectedStaffIds.length > 0 ? 100 / selectedStaffIds.length : 0,
      amount: selectedStaffIds.length > 0 ? serviceTotal / selectedStaffIds.length : 0
    }
  })

  // Notify parent component when selections change
  useEffect(() => {
    onStaffContributionsChange(contributions)
  }, [selectedStaffIds, serviceTotal])

  const handleStaffSelection = (staffId: string) => {
    if (!selectedStaffIds.includes(staffId)) {
      setSelectedStaffIds(prev => [...prev, staffId])
      setShowAddStaff(false) // Close the dropdown after selection
    }
  }

  const removeStaff = (staffId: string) => {
    setSelectedStaffIds(prev => prev.filter(id => id !== staffId))
  }

  const getSelectedStaffNames = () => {
    if (selectedStaffIds.length === 0) return "Select staff"
    if (selectedStaffIds.length === 1) {
      const staff = staffList.find(s => (s._id || s.id) === selectedStaffIds[0])
      return staff?.name || "Unknown Staff"
    }
    return `${selectedStaffIds.length} staff selected`
  }

  const availableStaff = staffList.filter(staff => 
    !selectedStaffIds.includes(staff._id || staff.id || '')
  )

  return (
    <div className="space-y-1">
      {/* Main Staff Selection Row */}
      <div className="flex items-center gap-1">
        <div className="flex-1 min-w-0">
          <Select
            value={selectedStaffIds[0] || ""}
            onValueChange={(value) => {
              if (value && !selectedStaffIds.includes(value)) {
                setSelectedStaffIds([value])
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((staff) => {
                const staffId = staff._id || staff.id
                return (
                  <SelectItem key={staffId} value={staffId || ''}>
                    {staff.name} {staff.role ? `(${staff.role})` : ''}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddStaff(!showAddStaff)}
          disabled={disabled || availableStaff.length === 0}
          className="h-8 px-2 text-xs flex-shrink-0"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Staff
        </Button>
      </div>

      {/* Additional Staff Dropdown */}
      {showAddStaff && availableStaff.length > 0 && (
        <div className="flex-1 min-w-0">
          <Select
            onValueChange={handleStaffSelection}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Add more staff" />
            </SelectTrigger>
            <SelectContent>
              {availableStaff.map((staff) => {
                const staffId = staff._id || staff.id
                return (
                  <SelectItem key={staffId} value={staffId || ''}>
                    {staff.name} {staff.role ? `(${staff.role})` : ''}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Selected Staff Display - Only show if more than 1 staff */}
      {selectedStaffIds.length > 1 && (
        <div className="space-y-1">
          {selectedStaffIds.map((staffId) => {
            const staff = staffList.find(s => (s._id || s.id) === staffId)
            const contribution = contributions.find(c => c.staffId === staffId)
            return (
              <div key={staffId} className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-800">{staff?.name}</span>
                  {staff?.role && (
                    <Badge variant="secondary" className="text-xs bg-white">
                      {staff.role}
                    </Badge>
                  )}
                  <span className="text-xs text-green-600">
                    {contribution?.percentage?.toFixed(0)}%
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStaff(staffId)}
                  disabled={disabled}
                  className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Multi-staff info */}
      {selectedStaffIds.length > 1 && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          <Users className="h-3 w-3 inline mr-1" />
          Equally distributed among {selectedStaffIds.length} staff
        </div>
      )}
    </div>
  )
}
