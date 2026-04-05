'use client'

import React, { useState, useCallback, type ChangeEvent, type DragEvent } from 'react'
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

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
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

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
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
      <div className="space-y-6 px-6">
        <section className="lg:max-w-[28rem]">
          <h2 className="font-display text-3xl font-semibold text-ink-900">Import Employees</h2>
          <p className="mt-2 text-base leading-7 text-ink-500">
            Upload a CSV file to import or update employee data.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <div>
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

            {result && (
              <Card className="mt-6" title="Import Results">
                <div className="mb-6 grid grid-cols-3 gap-4">
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
                    <h4 className="mb-2 font-medium text-red-800">Errors</h4>
                    <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-red-700">
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

          <div className="space-y-4">
            <Card title="CSV Format">
              <p className="mb-4 text-sm text-gray-600">
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
                  <span className="mt-0.5 text-primary-600">•</span>
                  Employee IDs are used for upserts (existing employees will be updated)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary-600">•</span>
                  Manager relationships are created using manager_id
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary-600">•</span>
                  Skills are deduplicated automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary-600">•</span>
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
      </div>
    </AppLayout>
  )
}
