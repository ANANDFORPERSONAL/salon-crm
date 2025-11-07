import { Suspense } from "react"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProfilePage } from "@/components/profile/profile-page"

function ProfileContent() {
  return <ProfilePage />
}

export default function Profile() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
        <ProfileContent />
      </Suspense>
    </ProtectedLayout>
  )
}
