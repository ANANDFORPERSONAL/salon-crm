"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Home, PieChart, Settings, Users, Receipt, Scissors, Package, Wrench, DollarSign, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export function SideNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      requiredRole: null, // All users can access
    },
    {
      title: "Quick Sale",
      href: "/quick-sale",
      icon: Receipt,
      requiredRole: null, // All users can access
    },
    {
      title: "Appointments",
      href: "/appointments",
      icon: CalendarDays,
      requiredRole: "manager", // Manager and above
    },
    {
      title: "Clients",
      href: "/clients",
      icon: Users,
      requiredRole: "manager", // Manager and above
    },
    {
      title: "Services",
      href: "/services",
      icon: Wrench,
      requiredRole: "staff", // Staff can view, manager+ can edit
    },
    {
      title: "Products",
      href: "/products",
      icon: Package,
      requiredRole: "staff", // Staff can view, manager+ can edit
    },
    {
      title: "Cash Register",
      href: "/cash-registry",
      icon: Banknote,
      requiredRole: "manager", // Manager and above
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: PieChart,
      requiredRole: "manager", // Manager and above
    },
    {
      title: "Reports",
      href: "/reports",
      icon: PieChart,
      requiredRole: "manager", // Manager and above
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      requiredRole: null, // All users can access (but specific settings are restricted)
    },
  ]

  const hasAccess = (requiredRole: string | null) => {
    if (!requiredRole) return true
    if (!user) return false

    const roleHierarchy = { admin: 3, manager: 2, staff: 1 }
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  }

  return (
    <div className="hidden border-r bg-gradient-to-b from-slate-50 to-gray-100 md:block w-[352px] shadow-xl">
      <div className="flex h-full flex-col gap-4 p-5">
        {/* Logo Section with Gradient */}
        <div className="flex h-16 items-center border-b border-gray-200 px-2 mb-2 pb-4">
          <Link href="/" className="flex items-center gap-3 font-bold text-lg group">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ease My Salon
            </span>
          </Link>
        </div>
        
        <div className="flex-1 py-2 overflow-y-auto">
          <nav className="grid gap-2.5">
            {navigationItems.map((item) => {
              const hasPermission = hasAccess(item.requiredRole)
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

              return (
                <div key={item.href} className="relative">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "justify-start w-full h-12 text-left px-4 rounded-xl transition-all duration-300 group",
                      !hasPermission && "opacity-50 cursor-not-allowed",
                      isActive 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 !text-white" 
                        : "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md text-gray-700"
                    )}
                    disabled={!hasPermission}
                    asChild
                  >
                    <Link href={hasPermission ? item.href : "#"}>
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300 mr-3 flex-shrink-0",
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "font-medium flex-1",
                        isActive ? "text-white" : "text-gray-700"
                      )}>{item.title}</span>
                      {!hasPermission && (
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
                          {item.requiredRole}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute right-4 w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </Link>
                  </Button>
                  
                  {/* Hover indicator */}
                  {!isActive && hasPermission && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-full opacity-0 group-hover:opacity-100 group-hover:h-8 transition-all duration-300" />
                  )}
                </div>
              )
            })}
          </nav>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-4 mt-auto">
          <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0) || (user as any)?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.name || `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">
                  {user?.role || 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
