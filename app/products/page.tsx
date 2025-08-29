import { Package, Sparkles, TrendingUp, BarChart3 } from "lucide-react"
import { ProductsTable } from "@/components/products/products-table"
import { ProductStatsCards } from "@/components/dashboard/stats-cards"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ProductsPage() {
  return (
    <ProtectedRoute requiredRole="staff">
      <ProtectedLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4">
          {/* Elegant Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header Background */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Package className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800 mb-1">
                        Product Inventory
                      </h1>
                      <p className="text-slate-600 text-base">
                        Manage your salon's product inventory, stock levels, and suppliers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature Highlights */}
              <div className="px-8 py-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-8 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Smart inventory management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span>Stock level monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span>Supplier tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards Section */}
          <div className="mb-6 animate-in slide-in-from-bottom-2" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Inventory Analytics</h2>
            </div>
            <ProductStatsCards />
          </div>

          {/* Products Table Section */}
          <div className="animate-in slide-in-from-bottom-2" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Product Directory</h2>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg overflow-hidden">
              <ProductsTable />
            </div>
          </div>
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
}
