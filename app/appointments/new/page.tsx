import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function NewAppointmentPage() {
  return (
    <ProtectedRoute>
      <ProtectedLayout>
        <div className="flex flex-col space-y-6">
              <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                  <Link href="/appointments">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">New Appointment</h1>
              </div>
              <AppointmentForm />
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
}
