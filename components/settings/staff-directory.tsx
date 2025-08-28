"use client"

import { UsersTable } from "@/components/users/users-table"

export function StaffDirectory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Staff Directory</h2>
        <p className="text-muted-foreground">
          Manage staff accounts, roles, and access permissions
        </p>
      </div>
      <UsersTable />
    </div>
  )
} 