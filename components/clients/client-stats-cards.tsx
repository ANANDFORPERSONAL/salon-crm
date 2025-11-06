"use client"

import { useMemo } from "react"
import { Users, UserCheck, UserX } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Client } from "@/lib/client-store"

interface ClientStatsCardsProps {
  clients: Client[]
  activeFilter: "all" | "active" | "inactive"
  onFilterChange: (filter: "all" | "active" | "inactive") => void
}

export function ClientStatsCards({ clients, activeFilter, onFilterChange }: ClientStatsCardsProps) {
  // Calculate date 3 months ago from current date (normalize to start of day for accurate comparison)
  const threeMonthsAgo = useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 3)
    date.setHours(0, 0, 0, 0) // Normalize to start of day
    return date
  }, [])

  // Calculate stats (using same logic as filter)
  const stats = useMemo(() => {
    const totalCustomers = clients.length
    
    let activeCustomers = 0
    let inactiveCustomers = 0

    clients.forEach((client) => {
      // Use only lastVisit (database value) for stats calculation to match filter logic
      // realLastVisit is populated asynchronously and may not be available consistently
      const lastVisit = client.lastVisit

      if (!lastVisit) {
        // No last visit means inactive
        inactiveCustomers++
        return
      }

      // Parse the last visit date
      const lastVisitDate = new Date(lastVisit)
      
      // Check if date is valid
      if (isNaN(lastVisitDate.getTime())) {
        inactiveCustomers++
        return
      }

      // Normalize to start of day for comparison (same as filter logic)
      lastVisitDate.setHours(0, 0, 0, 0)

      // Active if last visit is within 3 months
      if (lastVisitDate >= threeMonthsAgo) {
        activeCustomers++
      } else {
        inactiveCustomers++
      }
    })

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
    }
  }, [clients, threeMonthsAgo])

  const statsCards = [
    {
      id: "all" as const,
      label: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      activeBorderClass: "border-blue-500",
      bgGradient: "from-blue-500 to-blue-600",
      hoverBg: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      id: "active" as const,
      label: "Active Customers",
      value: stats.activeCustomers,
      icon: UserCheck,
      activeBorderClass: "border-green-500",
      bgGradient: "from-green-500 to-green-600",
      hoverBg: "hover:from-green-600 hover:to-green-700",
      description: "Last visit within 3 months",
    },
    {
      id: "inactive" as const,
      label: "Inactive Customers",
      value: stats.inactiveCustomers,
      icon: UserX,
      activeBorderClass: "border-red-500",
      bgGradient: "from-red-500 to-red-600",
      hoverBg: "hover:from-red-600 hover:to-red-700",
      description: "Last visit more than 3 months ago",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon
        const isActive = activeFilter === stat.id

        return (
          <Card
            key={stat.id}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-lg border-2",
              isActive
                ? `${stat.activeBorderClass} shadow-md`
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onFilterChange(stat.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-xl bg-gradient-to-br",
                    stat.bgGradient,
                    stat.hoverBg,
                    isActive && "ring-2 ring-offset-2 ring-white"
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              {isActive && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {stat.id === "all" 
                      ? "Showing all customers" 
                      : `Click "Total Customers" to view all`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

