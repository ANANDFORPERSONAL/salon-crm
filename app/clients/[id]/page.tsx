import { ProtectedRoute } from "@/components/auth/protected-route"
import { ClientDetailsPage } from "@/components/clients/client-details"

interface ClientDetailsPageProps {
  params: {
    id: string
  }
}

export default function ClientDetailsRoute({ params }: ClientDetailsPageProps) {
  return (
    <ProtectedRoute>
      <ClientDetailsPage clientId={params.id} />
    </ProtectedRoute>
  )
} 