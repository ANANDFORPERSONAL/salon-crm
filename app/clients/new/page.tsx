import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ClientForm } from "@/components/clients/client-form"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function NewClientPage() {
  return (
    <ProtectedRoute>
      <ProtectedLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button asChild variant="outline" size="icon">
                <Link href="/clients">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
      
              <CardContent className="p-8">
                <ClientForm />
              </CardContent>
          </div>
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
}
