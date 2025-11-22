"use client"

import { AlertTriangle, Mail, Phone, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AccountSuspendedProps {
  message?: string
  onBackToLogin?: () => void
}

export function AccountSuspended({ message, onBackToLogin }: AccountSuspendedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Suspended
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been temporarily suspended
          </p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              {message || "Your account has been suspended. Please contact your host for assistance."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You will not be able to access your salon management system until your account is reactivated.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Need Help?</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>Email: support@easemysalon.in</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>Phone: +1 (555) 123-4567</span>
                </div>
              </div>
            </div>

            {onBackToLogin && (
              <Button 
                onClick={onBackToLogin}
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
