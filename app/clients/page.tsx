import { ProtectedRoute } from "@/components/auth/protected-route"
import { ClientsListPage } from "@/components/clients/clients-list"

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsListPage />
    </ProtectedRoute>
  )
}
