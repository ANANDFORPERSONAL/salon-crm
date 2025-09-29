import { ClientsListPage } from "@/components/clients/clients-list"
import { ProtectedLayout } from "@/components/layout/protected-layout"

export default function ClientsPage() {
  return (
    <ProtectedLayout>
      <ClientsListPage />
    </ProtectedLayout>
  )
}
