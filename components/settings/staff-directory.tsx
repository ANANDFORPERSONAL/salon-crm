"use client"

import { StaffTable } from "@/components/staff/staff-table"
import { Users } from "lucide-react"

export function StaffDirectory() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Staff Directory</h2>
              <p className="text-slate-600">Manage staff accounts, roles, and access permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6">
          <StaffTable />
        </div>
      </div>
    </div>
  )
} 