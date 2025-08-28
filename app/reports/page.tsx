import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SalesReport } from "@/components/reports/sales-report"
import { ExpenseReport } from "@/components/reports/expense-report"

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="manager">
      <ProtectedLayout>
        <div className="flex flex-col space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">Generate and view detailed business reports</p>
              </div>

              <Tabs defaultValue="sales" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sales">Sales Report</TabsTrigger>
                  <TabsTrigger value="expense">Expense Report</TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Report</CardTitle>
                      <CardDescription>View detailed sales performance and revenue analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SalesReport />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="expense" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Report</CardTitle>
                      <CardDescription>Track and analyze business expenses and costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ExpenseReport />
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
        </div>
      </ProtectedLayout>
    </ProtectedRoute>
  )
} 