"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Download, RotateCcw, AlertCircle } from "lucide-react"

interface ImportResult {
  success: boolean
  imported: number
  errors: number
  skipped: number
  errorDetails: Array<{
    row: number
    field: string
    message: string
  }>
  skippedDetails: Array<{
    row: number
    name: string
    category: string
    reason: string
  }>
}

interface ImportResultsProps {
  result: ImportResult
  onClose: () => void
  onImportMore: () => void
}

export function ImportResults({ result, onClose, onImportMore }: ImportResultsProps) {
  const { success, imported, errors, skipped, errorDetails, skippedDetails } = result
  const totalProcessed = imported + errors + skipped

  const downloadErrorReport = () => {
    if (errorDetails.length === 0) return
    
    const csvContent = [
      ['Row', 'Field', 'Error Message'],
      ...errorDetails.map(error => [error.row, error.field, error.message])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-errors.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Status */}
      <Card className={success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${success ? 'bg-green-100' : 'bg-red-100'}`}>
              {success ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${success ? 'text-green-800' : 'text-red-800'}`}>
                {success ? 'Import Completed Successfully!' : 'Import Completed with Errors'}
              </h3>
              <p className={`text-sm ${success ? 'text-green-600' : 'text-red-600'}`}>
                {success 
                  ? `${imported} products imported successfully.${skipped > 0 ? ` ${skipped} products were skipped (already exist).` : ''}`
                  : `${imported} products imported, ${errors} errors occurred.${skipped > 0 ? ` ${skipped} products were skipped.` : ''}`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">{totalProcessed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Successfully Imported</p>
                <p className="text-2xl font-bold text-green-600">{imported}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Skipped</p>
                <p className="text-2xl font-bold text-yellow-600">{skipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      {errorDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Import Errors
            </CardTitle>
            <CardDescription>
              The following errors occurred during import. You can download a detailed report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {errorDetails.slice(0, 10).map((error, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="destructive" className="text-xs">
                      Row {error.row}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">{error.field}</span>
                    <span className="text-sm text-gray-600">{error.message}</span>
                  </div>
                </div>
              ))}
              
              {errorDetails.length > 10 && (
                <div className="text-center py-2">
                  <Badge variant="outline">
                    +{errorDetails.length - 10} more errors
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <Button variant="outline" onClick={downloadErrorReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Error Report
              </Button>
              
              <p className="text-sm text-gray-500">
                {errorDetails.length} total errors
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skipped Products Details */}
      {skippedDetails && skippedDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Skipped Products
            </CardTitle>
            <CardDescription>
              These products already exist in your inventory and were not imported.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {skippedDetails.map((skipped, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                      Row {skipped.row}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{skipped.name}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{skipped.category}</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">{skipped.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {skippedDetails.length} product{skippedDetails.length !== 1 ? 's' : ''} skipped
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Great!</strong> All products have been successfully imported and are now available in your product inventory.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onImportMore}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Import More Products
        </Button>
        
        <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Done
        </Button>
      </div>
    </div>
  )
}
