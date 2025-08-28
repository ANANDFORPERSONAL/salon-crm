"use client"

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent } from "@/components/ui/card"

// Sample data
const retentionData = [
  { month: "Jan", newClients: 15, returningClients: 30, totalClients: 45 },
  { month: "Feb", newClients: 18, returningClients: 34, totalClients: 52 },
  { month: "Mar", newClients: 12, returningClients: 37, totalClients: 49 },
  { month: "Apr", newClients: 20, returningClients: 42, totalClients: 62 },
  { month: "May", newClients: 15, returningClients: 40, totalClients: 55 },
  { month: "Jun", newClients: 22, returningClients: 45, totalClients: 67 },
]

const clientStats = [
  { label: "Total Clients", value: 245, change: "+12%" },
  { label: "New Clients (30 days)", value: 28, change: "+8%" },
  { label: "Retention Rate", value: "76%", change: "+4%" },
  { label: "Avg. Visits per Client", value: "2.3", change: "+0.2" },
]

export function ClientRetention() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        {clientStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="text-muted-foreground text-sm">{stat.label}</div>
              <div className="text-2xl font-bold mt-1">{stat.value}</div>
              <div className="text-xs text-green-500 mt-1">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="h-[400px]">
        <h3 className="text-lg font-medium mb-4">Client Acquisition & Retention</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="newClients" stackId="1" name="New Clients" stroke="#adfa1d" fill="#adfa1d" />
            <Area
              type="monotone"
              dataKey="returningClients"
              stackId="1"
              name="Returning Clients"
              stroke="#10b981"
              fill="#10b981"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
