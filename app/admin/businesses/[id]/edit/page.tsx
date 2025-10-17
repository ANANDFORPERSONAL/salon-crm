import { CreateBusinessForm } from "@/components/admin/create-business-form"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function EditBusinessPage() {
  return (
    <AdminLayout>
      <CreateBusinessForm mode="edit" />
    </AdminLayout>
  )
}
