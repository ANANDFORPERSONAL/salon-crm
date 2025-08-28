import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClientForm } from "@/components/clients/client-form"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function NewClientPage() {
  return (
    <ProtectedRoute>
      <ProtectedLayout>
        <div className="flex flex-col space-y-6">
              <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                  <Link href="/clients">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">New Client</h1>
              </div>
              <ClientForm />
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
}
