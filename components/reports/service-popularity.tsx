"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample data
const serviceData = [
  { name: "Haircut & Style", value: 35, color: "#adfa1d" },
  { name: "Color Treatment", value: 25, color: "#10b981" },
  { name: "Manicure", value: 15, color: "#3b82f6" },
  { name: "Beard Trim", value: 10, color: "#8b5cf6" },
  { name: "Full Highlights", value: 15, color: "#ec4899" },
]

const topServices = [
  { name: "Haircut & Style", count: 145, growth: 12 },
  { name: "Color Treatment", count: 98, growth: 8 },
  { name: "Manicure", count: 67, growth: -3 },
  { name: "Beard Trim", count: 54, growth: 15 },
  { name: "Full Highlights", count: 42, growth: 5 },
]

export function ServicePopularity() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-4">Service Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Top Services</h3>
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">{service.count} bookings</div>
                  </div>
                  <Badge variant={service.growth > 0 ? "default" : "destructive"}>
                    {service.growth > 0 ? "+" : ""}
                    {service.growth}%
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
