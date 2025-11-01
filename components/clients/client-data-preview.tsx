"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react"

export function ClientDataPreview({ data, onNext, onBack }: { data: { headers: string[]; rows: any[][]; totalRows: number }; onNext: () => void; onBack: () => void }) {
  const { headers, rows, totalRows } = data
  const previewRows = rows.slice(0, 5)
  const hasRequired = headers.some(h => h.toLowerCase().includes('name')) && headers.some(h => h.toLowerCase().includes('phone'))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-3"><div className="text-2xl font-bold text-blue-600">{totalRows}</div><p className="text-sm text-gray-600">Total Clients</p></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-2xl font-bold text-green-600">{headers.length}</div><p className="text-sm text-gray-600">Columns</p></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-2xl font-bold text-purple-600">{hasRequired ? '✓' : '✗'}</div><p className="text-sm text-gray-600">Required Fields</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Data Preview</CardTitle>
          <CardDescription>Showing first 5 rows of {totalRows} total clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">#</TableHead>
                  {headers.map((h, i) => (<TableHead className="whitespace-nowrap" key={i}>{h}</TableHead>))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, ri) => (
                  <TableRow key={ri}>
                    <TableCell className="whitespace-nowrap font-medium">{ri + 1}</TableCell>
                    {row.map((cell, ci) => (<TableCell className="whitespace-nowrap" key={ci}>{cell !== null && cell !== undefined ? String(cell) : '-'}</TableCell>))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!hasRequired && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">⚠️ Required columns (Name, Phone) not detected. You'll need to map them in the next step.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 pb-2">
        <Button variant="outline" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-2" />Back</Button>
        <Button onClick={onNext}>Continue to Map<ChevronRight className="h-4 w-4 ml-2" /></Button>
      </div>
    </div>
  )
}


