import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProfilePage } from "@/components/profile/profile-page"

export default function Profile() {
  return (
    <ProtectedLayout>
      <ProfilePage />
    </ProtectedLayout>
  )
}
