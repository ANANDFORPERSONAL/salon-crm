"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle, FileSpreadsheet, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface ServiceImportResultsProps {
  result: ImportResult
  onClose: () => void
  onImportMore: () => void
}

export function ServiceImportResults({ result, onClose, onImportMore }: ServiceImportResultsProps) {
  const totalProcessed = result.imported + result.errors + result.skipped
  const hasErrors = result.errors > 0
  const hasSkipped = result.skipped > 0

  return (
    <div className="space-y-4">
      {/* Summary Alert */}
      {result.success && !hasErrors && !hasSkipped ? (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully imported all {result.imported} services!
          </AlertDescription>
        </Alert>
      ) : result.success && (hasErrors || hasSkipped) ? (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Imported {result.imported} services. {result.errors} failed, {result.skipped} skipped.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Import failed. Please review the errors and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{totalProcessed}</div>
            <p className="text-sm text-gray-600">Total Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{result.imported}</div>
            <p className="text-sm text-gray-600">Imported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{result.errors}</div>
            <p className="text-sm text-gray-600">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
            <p className="text-sm text-gray-600">Skipped</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      {hasErrors && result.errorDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error Details
            </CardTitle>
            <CardDescription>
              Services that failed to import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Error Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.errorDetails.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{error.row}</TableCell>
                      <TableCell className="text-sm text-red-600">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skipped Services Details */}
      {hasSkipped && result.skippedDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              Skipped Services Details
            </CardTitle>
            <CardDescription>
              Services that were skipped during import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.skippedDetails.map((skipped, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{skipped.row}</TableCell>
                      <TableCell>{skipped.name}</TableCell>
                      <TableCell>{skipped.category}</TableCell>
                      <TableCell className="text-sm text-yellow-700">{skipped.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onImportMore}>
          <Upload className="h-4 w-4 mr-2" />
          Import More Services
        </Button>
        <Button onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
