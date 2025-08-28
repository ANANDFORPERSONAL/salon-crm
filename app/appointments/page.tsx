import Link from "next/link"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AppointmentsPage() {
  return (
    <ProtectedRoute>
      <ProtectedLayout>
        <div className="flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                <Button asChild>
                  <Link href="/appointments/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Appointment
                  </Link>
                </Button>
              </div>
              <AppointmentsCalendar />
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
}
