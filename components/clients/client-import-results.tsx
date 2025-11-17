"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Upload } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ImportResult {
  success: boolean
  imported: number
  created?: number
  updated?: number
  errors: number
  skipped: number
  errorDetails: { row: number; field: string; message: string }[]
  skippedDetails: { row: number; name: string; phone: string; reason: string }[]
}

export function ClientImportResults({ result, onClose, onImportMore }: { result: ImportResult; onClose: () => void; onImportMore: () => void }) {
  const totalProcessed = result.imported + result.errors + result.skipped
  const hasErrors = result.errors > 0
  const hasSkipped = result.skipped > 0

  return (
    <div className="space-y-4">
      {result.success && !hasErrors && !hasSkipped ? (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully processed all {result.imported} clients!
            {result.created !== undefined && result.updated !== undefined && (
              <span className="block mt-1 text-sm">({result.created} created, {result.updated} updated)</span>
            )}
          </AlertDescription>
        </Alert>
      ) : result.success ? (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Processed {result.imported} clients. {result.errors} failed, {result.skipped} skipped.
            {result.created !== undefined && result.updated !== undefined && (
              <span className="block mt-1 text-sm">({result.created} created, {result.updated} updated)</span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Import failed. Please review the errors and try again.</AlertDescription>
        </Alert>
      )}

      <div className={`grid grid-cols-2 ${result.created !== undefined ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4`}>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-gray-900">{totalProcessed}</div><p className="text-sm text-gray-600">Total Processed</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{result.imported}</div><p className="text-sm text-gray-600">Imported</p></CardContent></Card>
        {result.created !== undefined && (
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{result.created}</div><p className="text-sm text-gray-600">Created</p></CardContent></Card>
        )}
        {result.updated !== undefined && (
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-purple-600">{result.updated}</div><p className="text-sm text-gray-600">Updated</p></CardContent></Card>
        )}
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-red-600">{result.errors}</div><p className="text-sm text-gray-600">Errors</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{result.skipped}</div><p className="text-sm text-gray-600">Skipped</p></CardContent></Card>
      </div>

      {hasErrors && result.errorDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600"><XCircle className="h-5 w-5" /> Error Details</CardTitle>
            <CardDescription>Clients that failed to import</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Row</TableHead><TableHead>Error Message</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {result.errorDetails.map((e, i) => (
                    <TableRow key={i}><TableCell className="font-medium">{e.row}</TableCell><TableCell className="text-sm text-red-600">{e.message}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSkipped && result.skippedDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-600"><AlertCircle className="h-5 w-5" /> Skipped Clients Details</CardTitle>
            <CardDescription>Clients skipped during import (likely duplicates)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Row</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Reason</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {result.skippedDetails.map((s, i) => (
                    <TableRow key={i}><TableCell className="font-medium">{s.row}</TableCell><TableCell>{s.name}</TableCell><TableCell>{s.phone}</TableCell><TableCell className="text-sm text-yellow-700">{s.reason}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onImportMore}><Upload className="h-4 w-4 mr-2" />Import More Clients</Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}


