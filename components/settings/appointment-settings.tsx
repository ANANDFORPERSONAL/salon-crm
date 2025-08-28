"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function AppointmentSettings() {
  const [settings, setSettings] = useState({
    bookingWindow: "30",
    slotDuration: "30",
    bufferTime: "15",
    maxAdvanceBooking: "60",
    allowOnlineBooking: true,
    requireDeposit: false,
    sendReminders: true,
    reminderTime: "24",
    allowCancellation: true,
    cancellationWindow: "24",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Appointment settings saved",
        description: "Your appointment configuration has been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save appointment settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Appointment Settings</h2>
        <p className="text-muted-foreground">Configure booking rules, time slots, and availability</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Configuration</CardTitle>
            <CardDescription>Set up your appointment booking parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slotDuration">Default Slot Duration (minutes)</Label>
                <Select
                  value={settings.slotDuration}
                  onValueChange={(value) => setSettings({ ...settings, slotDuration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                <Select
                  value={settings.bufferTime}
                  onValueChange={(value) => setSettings({ ...settings, bufferTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookingWindow">Booking Window (days)</Label>
                <Input
                  id="bookingWindow"
                  type="number"
                  value={settings.bookingWindow}
                  onChange={(e) => setSettings({ ...settings, bookingWindow: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAdvanceBooking">Max Advance Booking (days)</Label>
                <Input
                  id="maxAdvanceBooking"
                  type="number"
                  value={settings.maxAdvanceBooking}
                  onChange={(e) => setSettings({ ...settings, maxAdvanceBooking: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Online Booking</CardTitle>
            <CardDescription>Configure online booking preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Online Booking</Label>
                <p className="text-sm text-muted-foreground">Enable customers to book online</p>
              </div>
              <Switch
                checked={settings.allowOnlineBooking}
                onCheckedChange={(checked) => setSettings({ ...settings, allowOnlineBooking: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Deposit</Label>
                <p className="text-sm text-muted-foreground">Require payment for online bookings</p>
              </div>
              <Switch
                checked={settings.requireDeposit}
                onCheckedChange={(checked) => setSettings({ ...settings, requireDeposit: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reminders & Cancellations</CardTitle>
            <CardDescription>Configure reminder and cancellation policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send Reminders</Label>
                <p className="text-sm text-muted-foreground">Automatically send appointment reminders</p>
              </div>
              <Switch
                checked={settings.sendReminders}
                onCheckedChange={(checked) => setSettings({ ...settings, sendReminders: checked })}
              />
            </div>
            {settings.sendReminders && (
              <div className="space-y-2">
                <Label htmlFor="reminderTime">Reminder Time (hours before)</Label>
                <Select
                  value={settings.reminderTime}
                  onValueChange={(value) => setSettings({ ...settings, reminderTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Cancellation</Label>
                <p className="text-sm text-muted-foreground">Allow customers to cancel appointments</p>
              </div>
              <Switch
                checked={settings.allowCancellation}
                onCheckedChange={(checked) => setSettings({ ...settings, allowCancellation: checked })}
              />
            </div>
            {settings.allowCancellation && (
              <div className="space-y-2">
                <Label htmlFor="cancellationWindow">Cancellation Window (hours)</Label>
                <Input
                  id="cancellationWindow"
                  type="number"
                  value={settings.cancellationWindow}
                  onChange={(e) => setSettings({ ...settings, cancellationWindow: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
