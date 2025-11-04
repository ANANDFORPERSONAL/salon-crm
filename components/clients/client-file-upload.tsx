"use client"

import { useCallback, useState } from "react"
import { Upload, FileSpreadsheet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ClientFileUpload({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      setSelectedFile(f); onFileSelect(f)
    }
  }, [onFileSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setSelectedFile(f); onFileSelect(f)
  }, [onFileSelect])

  return (
    <Card>
      <CardContent className="p-6">
        <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">Choose a file</span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={handleChange} />
                </label>
              </div>
              <p className="text-sm text-gray-500">Excel (XLSX, XLS) or CSV files only</p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Required Columns:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Name</li>
            <li>Phone</li>
          </ul>
          <p className="text-sm font-medium text-gray-700 mt-3">Optional Columns:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Email</li>
            <li>Status</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}


