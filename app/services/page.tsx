import { ProtectedRoute } from "@/components/auth/protected-route"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ServicesTable } from "@/components/services/services-table"
import { ServiceStatsCards } from "@/components/dashboard/stats-cards"
import { Scissors, Sparkles, TrendingUp } from "lucide-react"

export default function Services() {
  return (
    <ProtectedRoute requiredRole="staff">
      <ProtectedLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
          {/* Compact Hero Header Section */}
          <div className="mb-6 animate-in fade-in" style={{ animationDelay: '200ms' }}>
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Scissors className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">
                        Services Management
                      </h1>
                      <p className="text-indigo-100 text-sm">
                        Manage your salon services, pricing, and categories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-indigo-100">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Professional management</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Streamlined operations</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <Scissors className="h-8 w-8 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards Section */}
          <div className="mb-6 animate-in slide-in-from-bottom-2" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Service Analytics</h2>
            </div>
            <ServiceStatsCards />
          </div>

          {/* Services Table Section */}
          <div className="animate-in slide-in-from-bottom-2" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Service Directory</h2>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg overflow-hidden">
              <ServicesTable />
            </div>
          </div>
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
}
