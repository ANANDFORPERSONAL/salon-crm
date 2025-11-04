"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const CLIENT_FIELDS = [
  { value: 'name', label: 'Name', required: true, description: 'Customer full name' },
  { value: 'phone', label: 'Mobile', required: true, description: 'Primary mobile number' },
  { value: 'gender', label: 'Gender', required: false, description: "male / female / other" },
  { value: 'email', label: 'Email', required: false, description: 'Email address' },
  { value: 'dob', label: 'Date of Birth', required: false, description: 'YYYY-MM-DD' },
  { value: 'visits', label: 'Visits', required: false, description: 'Initial visit count' },
  { value: 'lastVisit', label: 'Last Visit', required: false, description: 'YYYY-MM-DD format' },
  { value: 'totalSpent', label: 'Total Revenue', required: false, description: 'Total amount spent by client' },
]

export function ClientColumnMapping({ headers, sampleData, mapping, onMappingChange, onNext, onBack, isProcessing }: { headers: string[]; sampleData: any[][]; mapping: Record<string,string>; onMappingChange: (m: Record<string,string>)=>void; onNext: ()=>void; onBack: ()=>void; isProcessing: boolean }) {
  const handleChange = (excelColumn: string, field: string) => {
    const next = { ...mapping }
    if (field === 'none' || field === '') delete next[excelColumn]
    else next[excelColumn] = field
    onMappingChange(next)
  }
  const getValue = (excelColumn: string) => {
    const v = mapping[excelColumn] || ''
    return v === 'none' ? '' : v
  }
  const isMapped = (field: string) => Object.values(mapping).includes(field)
  const unmappedRequired = CLIENT_FIELDS.filter(f => f.required && !Object.values(mapping).includes(f.value))
  const canProceed = unmappedRequired.length === 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Map Excel Columns to Client Fields</CardTitle>
          <CardDescription>Match your Excel columns with the corresponding client fields</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Excel Column</TableHead>
                  <TableHead className="whitespace-nowrap">Sample Data</TableHead>
                  <TableHead className="whitespace-nowrap">Maps To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((h, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="whitespace-nowrap font-medium">{h}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">{sampleData[0]?.[idx] || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Select value={getValue(h)} onValueChange={(v)=>handleChange(h, v)}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select field..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Don't import this column</SelectItem>
                          {CLIENT_FIELDS.map(f => (
                            <SelectItem key={f.value} value={f.value} disabled={isMapped(f.value) && getValue(h) !== f.value}>
                              <div className="flex items-center gap-2">
                                <span>{f.label}</span>
                                {f.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!canProceed && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Map required fields: {unmappedRequired.map(f=>f.label).join(', ')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 pb-2">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}><ChevronLeft className="h-4 w-4 mr-2" />Back</Button>
        <Button onClick={onNext} disabled={!canProceed || isProcessing}>{isProcessing ? 'Processing...' : 'Start Import'} {!isProcessing && <ChevronRight className="h-4 w-4 ml-2" />}</Button>
      </div>
    </div>
  )
}


