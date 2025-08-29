"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Settings } from "lucide-react"

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    bookingConfirmations: true,
    cancellationAlerts: true,
    lowStockAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    reminderTime: "24",
    smsProvider: "twilio",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Notification settings saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Notification Settings</h2>
              <p className="text-slate-600">Configure email alerts, SMS settings, and reminder preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Communication Channels Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Communication Channels</h3>
                <p className="text-slate-600 text-sm">Choose how you want to receive notifications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Email Notifications</Label>
                  <p className="text-sm text-slate-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">SMS Notifications</Label>
                  <p className="text-sm text-slate-600">Receive notifications via text message</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Notifications Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Appointment Notifications</h3>
                <p className="text-slate-600 text-sm">Configure appointment-related alerts</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Appointment Reminders</Label>
                  <p className="text-sm text-slate-600">Send reminders to customers</p>
                </div>
                <Switch
                  checked={settings.appointmentReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, appointmentReminders: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Booking Confirmations</Label>
                  <p className="text-sm text-slate-600">Send confirmation when appointments are booked</p>
                </div>
                <Switch
                  checked={settings.bookingConfirmations}
                  onCheckedChange={(checked) => setSettings({ ...settings, bookingConfirmations: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Cancellation Alerts</Label>
                  <p className="text-sm text-slate-600">Get notified when appointments are cancelled</p>
                </div>
                <Switch
                  checked={settings.cancellationAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, cancellationAlerts: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Alerts Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Business Alerts</h3>
                <p className="text-slate-600 text-sm">Configure business operation notifications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Low Stock Alerts</Label>
                  <p className="text-sm text-slate-600">Get notified when products are running low</p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, lowStockAlerts: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Daily Reports</Label>
                  <p className="text-sm text-slate-600">Receive daily business summary reports</p>
                </div>
                <Switch
                  checked={settings.dailyReports}
                  onCheckedChange={(checked) => setSettings({ ...settings, dailyReports: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Weekly Reports</Label>
                  <p className="text-sm text-slate-600">Receive weekly business analytics</p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg font-medium"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
