'use client'

import { useState, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Alert } from '@/components/shared/alert'

interface ImportResult {
  totalRows: number
  successful: number
  failed: number
  errors: Array<{ row: number; employee_id?: string; error: string }>
}

export default function AdminImportPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Please upload a CSV file')
      }
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Read the file and send as text
      const text = await file.text()

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadSample = () => {
    const link = document.createElement('a')
    link.href = '/sample-employees.csv'
    link.download = 'sample-employees.csv'
    link.click()
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Import Employees</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV file to import or update employee data
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <Card title="Upload CSV">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">CSV files only</p>
                </div>
              )}
            </div>

            {error && (
              <Alert type="error" title="Upload error" description={error} />
            )}

            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1"
              >
                {uploading ? 'Importing...' : 'Import CSV'}
              </Button>
              <Button variant="secondary" onClick={handleDownloadSample}>
                Download Sample
              </Button>
            </div>
          </Card>

          {/* Import Result */}
          {result && (
            <Card className="mt-6" title="Import Results">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{result.totalRows}</p>
                  <p className="text-sm text-gray-500">Total Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{result.successful}</p>
                  <p className="text-sm text-gray-500">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                  <ul className="space-y-1 text-sm text-red-700 max-h-48 overflow-y-auto">
                    {result.errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}
                        {err.employee_id && ` (${err.employee_id})`}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 10 && (
                      <li className="text-gray-500">...and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {result.errors.length === 0 && (
                <Alert type="success" title="Import successful" description="All employees were imported successfully." />
              )}
            </Card>
          )}
        </div>

        {/* Help Section */}
        <div className="space-y-4">
          <Card title="CSV Format">
            <p className="text-sm text-gray-600 mb-4">
              Your CSV should include the following columns:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="font-medium">employee_id</span>
                <span className="text-gray-400">*</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">name</span>
                <span className="text-gray-400">*</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">email</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">title</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">department</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">location</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">hired_date</span>
                <span className="text-xs text-gray-400">(YYYY-MM-DD)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">manager_id</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">skills</span>
                <span className="text-xs text-gray-400">(semicolon-separated)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">certifications</span>
                <span className="text-xs text-gray-400">(semicolon-separated)</span>
              </li>
            </ul>
          </Card>

          <Card title="Tips">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                Employee IDs are used for upserts (existing employees will be updated)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                Manager relationships are created using manager_id
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                Skills are deduplicated automatically
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                Multiple values can be separated by semicolons
              </li>
            </ul>
          </Card>

          <Card title="Actions">
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => (window.location.href = '/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
