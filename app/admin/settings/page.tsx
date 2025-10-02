"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminSettingsPage } from "@/components/admin/admin-settings-page"

export default function AdminSettings() {
  return (
    <AdminLayout>
      <AdminSettingsPage />
    </AdminLayout>
  )
}
