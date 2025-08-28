import { ProtectedRoute } from "@/components/auth/protected-route"
import { ProfilePage } from "@/components/profile/profile-page"

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  )
}
