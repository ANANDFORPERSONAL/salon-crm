"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SettingsAPI } from "@/lib/api"

export function BusinessSettings() {
  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    website: "",
    description: "",
    socialMedia: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load business settings on component mount
  useEffect(() => {
    loadBusinessSettings()
  }, [])

  const loadBusinessSettings = async () => {
    setIsLoading(true)
    try {
      const response = await SettingsAPI.getBusinessSettings()
      if (response.success) {
        setBusinessInfo(response.data)
      }
    } catch (error) {
      console.error('Error loading business settings:', error)
      toast({
        title: "Error",
        description: "Failed to load business settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await SettingsAPI.updateBusinessSettings(businessInfo)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Business information updated successfully",
        })
        // Reload business settings to ensure we have the latest data
        await loadBusinessSettings()
      } else {
        throw new Error(response.error || 'Failed to update business settings')
      }
    } catch (error: any) {
      console.error('Error saving business settings:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save business information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Information</h2>
          <p className="text-muted-foreground">Loading business settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Business Information</h2>
        <p className="text-muted-foreground">Manage your salon&apos;s contact details and branding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your salon&apos;s primary business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                placeholder="Enter business name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={businessInfo.website}
                onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                placeholder="Enter website URL"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={businessInfo.description}
              onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
              rows={3}
              placeholder="Enter business description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialMedia">Social Media Handle</Label>
            <Input
              id="socialMedia"
              value={businessInfo.socialMedia}
              onChange={(e) => setBusinessInfo({ ...businessInfo, socialMedia: e.target.value })}
              placeholder="e.g., @glamoursalon"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Your salon&apos;s physical location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
              placeholder="Enter street address"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={businessInfo.city}
                onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={businessInfo.state}
                onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                placeholder="Enter state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={businessInfo.zipCode}
                onChange={(e) => setBusinessInfo({ ...businessInfo, zipCode: e.target.value })}
                placeholder="Enter ZIP code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
