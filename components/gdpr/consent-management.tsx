"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Shield, Save, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { GDPRAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ConsentPreferences {
  necessary: boolean
  analytics: boolean
  functional: boolean
  marketing: boolean
  dataProcessing: boolean
  dataSharing: boolean
}

export function ConsentManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true, // Always true
    analytics: false,
    functional: false,
    marketing: false,
    dataProcessing: true, // Required for service
    dataSharing: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchConsent = async () => {
      if (!user?._id) return

      try {
        const response = await GDPRAPI.getConsentStatus(user._id)
        if (response.success && response.data?.consent) {
          setPreferences(response.data.consent)
        }
      } catch (error) {
        console.error("Error fetching consent:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConsent()
  }, [user?._id])

  const handleSave = async () => {
    if (!user?._id) return

    setIsSaving(true)
    try {
      const response = await GDPRAPI.updateConsent(user._id, preferences)
      if (response.success) {
        toast({
          title: "Consent Updated",
          description: "Your consent preferences have been saved successfully.",
        })
      } else {
        throw new Error(response.error || "Failed to update consent")
      }
    } catch (error) {
      console.error("Error updating consent:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update consent preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Consent Management
        </CardTitle>
        <CardDescription>
          Manage your data processing consent preferences in accordance with GDPR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex-1">
              <Label htmlFor="necessary" className="font-semibold cursor-pointer">
                Necessary Cookies & Data Processing
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Required for the service to function. Cannot be disabled.
              </p>
            </div>
            <Switch
              id="necessary"
              checked={preferences.necessary}
              disabled
              className="ml-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="dataProcessing" className="font-semibold cursor-pointer">
                Data Processing for Service Delivery
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Required to provide salon management services (appointments, sales, etc.)
              </p>
            </div>
            <Switch
              id="dataProcessing"
              checked={preferences.dataProcessing}
              disabled
              className="ml-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="functional" className="font-semibold cursor-pointer">
                Functional Cookies
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Remember your preferences and settings for a better experience
              </p>
            </div>
            <Switch
              id="functional"
              checked={preferences.functional}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, functional: checked })
              }
              className="ml-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="analytics" className="font-semibold cursor-pointer">
                Analytics Cookies
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Help us understand how you use our service to improve it
              </p>
            </div>
            <Switch
              id="analytics"
              checked={preferences.analytics}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, analytics: checked })
              }
              className="ml-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="marketing" className="font-semibold cursor-pointer">
                Marketing Communications
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Receive promotional emails and updates about new features
              </p>
            </div>
            <Switch
              id="marketing"
              checked={preferences.marketing}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, marketing: checked })
              }
              className="ml-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="dataSharing" className="font-semibold cursor-pointer">
                Data Sharing with Service Providers
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Share anonymized data with trusted service providers for platform improvement
              </p>
            </div>
            <Switch
              id="dataSharing"
              checked={preferences.dataSharing}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, dataSharing: checked })
              }
              className="ml-4"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Consent Preferences
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            You can withdraw your consent at any time. Changes take effect immediately.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

