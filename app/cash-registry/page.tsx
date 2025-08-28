"use client"

import { useState } from "react"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CashRegistryReport } from "@/components/cash-registry/cash-registry-report"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function CashRegistryPage() {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

  const handleVerifiedAndClose = () => {
    setIsVerificationModalOpen(true)
  }

  return (
    <ProtectedRoute requiredRole="manager">
      <ProtectedLayout>
        <div className="flex flex-col space-y-8 p-6">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cash Registry</h1>
              <p className="text-lg text-gray-600">Manage and track daily cash balances and shifts</p>
              <div className="flex items-start space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-600 text-lg">💡</span>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Each date has one record that gets updated with opening and closing data. Activity Report shows separate rows for Opening and Closing activities, making it easy to track both shifts.
                </p>
              </div>
            </div>
            
            {/* Top Right Button */}
            <Button 
              onClick={handleVerifiedAndClose}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 shadow-sm"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Verified and Close
            </Button>
          </div>

          {/* Main Content - No extra Card wrapper needed */}
          <CashRegistryReport 
            isVerificationModalOpen={isVerificationModalOpen}
            onVerificationModalChange={setIsVerificationModalOpen}
          />
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
}
