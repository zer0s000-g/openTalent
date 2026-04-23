'use client'

import React, { useCallback, useEffect, useState, type ChangeEvent, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Alert } from '@/components/shared/alert'
import { Button } from '@/components/shared/button'
import { Card } from '@/components/shared/card'

interface ImportIssue {
  row: number
  employee_id?: string
  message: string
  severity: 'error' | 'warning'
}

interface ImportRowPreview {
  row: number
  employee_id?: string
  name?: string
  status: 'create' | 'update' | 'invalid'
  warnings: string[]
}

interface ImportResult {
  mode: 'dry-run' | 'apply'
  filename?: string
  totalRows: number
  validRows: number
  invalidRows: number
  rowsToCreate: number
  rowsToUpdate: number
  successful: number
  failed: number
  warnings: ImportIssue[]
  errors: ImportIssue[]
  preview: ImportRowPreview[]
  applied: boolean
  importedAt?: string
  batchId?: string
}

interface RecentImportBatch {
  id: string
  source: string
  filename?: string
  importedAt: string
  actorEmail?: string
  actorName?: string
  totalRows: number
  validRows: number
  invalidRows: number
  rowsToCreate: number
  rowsToUpdate: number
  warningCount: number
  employeeCount: number
  issues: ImportIssue[]
}

async function readFileContents(file: File) {
  return file.text()
}

export default function AdminImportPage() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<RecentImportBatch[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await fetch('/api/import')
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load import history')
      }

      setHistory(payload.imports || [])
    } catch (historyRequestError) {
      setHistoryError(
        historyRequestError instanceof Error ? historyRequestError.message : 'Failed to load import history',
      )
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const handleDrag = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true)
      return
    }

    if (event.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const assignFile = useCallback((nextFile: File | null) => {
    setFile(nextFile)
    setResult(null)
    setError(null)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setDragActive(false)

      const droppedFile = event.dataTransfer.files?.[0] ?? null
      if (!droppedFile) return

      if (droppedFile.type === 'text/csv' || droppedFile.name.toLowerCase().endsWith('.csv')) {
        assignFile(droppedFile)
        return
      }

      setError('Please upload a CSV file.')
    },
    [assignFile],
  )

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null
      if (!nextFile) return

      assignFile(nextFile)
    },
    [assignFile],
  )

  const submitImport = useCallback(
    async (mode: 'dry-run' | 'apply') => {
      if (!file) return

      if (mode === 'dry-run') {
        setReviewing(true)
      } else {
        setApplying(true)
      }

      setError(null)

      try {
        const csv = await readFileContents(file)
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csv,
            mode,
            filename: file.name,
          }),
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Import request failed')
        }

        setResult(payload.result)
        if (mode === 'apply' && payload.result?.applied) {
          await loadHistory()
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Import request failed')
      } finally {
        setReviewing(false)
        setApplying(false)
      }
    },
    [file, loadHistory],
  )

  const handleReview = useCallback(() => {
    void submitImport('dry-run')
  }, [submitImport])

  const handleApply = useCallback(() => {
    void submitImport('apply')
  }, [submitImport])

  const handleDownloadSample = useCallback(() => {
    const link = document.createElement('a')
    link.href = '/sample-employees.csv'
    link.download = 'sample-employees.csv'
    link.click()
  }, [])

  const hasBlockingErrors = (result?.errors.length ?? 0) > 0
  const canApply = Boolean(result && result.mode === 'dry-run' && !hasBlockingErrors && !result.applied)

  return (
    <AppLayout>
      <div className="space-y-6 px-6">
        <section className="lg:max-w-[34rem]">
          <h2 className="font-display text-3xl font-semibold text-ink-900">Import Employees</h2>
          <p className="mt-2 text-base leading-7 text-ink-500">
            Review a CSV before it mutates the workforce graph. The preview shows what will be created, updated,
            or blocked so admins can import with confidence.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <Card title="Upload CSV">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-[color:var(--border-soft)] bg-white/70 hover:border-[color:var(--border-strong)]'
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sand-100">
                  <svg
                    className="h-6 w-6 text-ink-400"
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
                    <p className="text-sm font-medium text-ink-900">{file.name}</p>
                    <p className="text-xs text-ink-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-ink-600">
                      <span className="font-medium text-primary-700">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-ink-500">CSV files only</p>
                  </div>
                )}
              </div>

              {error ? <Alert type="error" title="Import request failed" description={error} /> : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={handleReview} disabled={!file || reviewing || applying} className="flex-1">
                  {reviewing ? 'Reviewing...' : 'Review Import'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleApply}
                  disabled={!canApply || applying || reviewing}
                  className="flex-1"
                >
                  {applying ? 'Applying...' : 'Apply Import'}
                </Button>
                <Button variant="secondary" onClick={handleDownloadSample}>
                  Download Sample
                </Button>
              </div>
            </Card>

            {result ? (
              <Card title={result.applied ? 'Import Completed' : 'Import Review'}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryMetric label="Rows scanned" value={result.totalRows} />
                  <SummaryMetric label="Valid rows" value={result.validRows} tone="success" />
                  <SummaryMetric label="Creates" value={result.rowsToCreate} />
                  <SummaryMetric label="Updates" value={result.rowsToUpdate} />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <SummaryMetric label="Blocked rows" value={result.invalidRows} tone={hasBlockingErrors ? 'danger' : 'default'} />
                  <SummaryMetric label="Warnings" value={result.warnings.length} tone={result.warnings.length ? 'warning' : 'default'} />
                  <SummaryMetric
                    label={result.applied ? 'Imported rows' : 'Ready to import'}
                    value={result.applied ? result.successful : result.validRows}
                    tone="success"
                  />
                </div>

                {result.applied ? (
                  <Alert
                    type="success"
                    title="Import applied successfully"
                    description={`Batch ${result.batchId ?? 'unknown'} imported ${result.successful} employee rows.`}
                  />
                ) : hasBlockingErrors ? (
                  <Alert
                    type="warning"
                    title="Review found blocking issues"
                    description="Fix the invalid rows in the CSV before applying this import."
                  />
                ) : (
                  <Alert
                    type="info"
                    title="Preview looks safe to apply"
                    description="No blocking issues were found. You can apply this import when you’re ready."
                  />
                )}

                {result.importedAt ? (
                  <p className="mt-4 text-sm text-ink-500">
                    Imported at {new Date(result.importedAt).toLocaleString()}
                  </p>
                ) : null}

                {(result.errors.length > 0 || result.warnings.length > 0) ? (
                  <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    <IssueList
                      title="Errors"
                      tone="error"
                      issues={result.errors}
                      emptyLabel="No blocking issues found."
                    />
                    <IssueList
                      title="Warnings"
                      tone="warning"
                      issues={result.warnings}
                      emptyLabel="No warnings found."
                    />
                  </div>
                ) : null}

                <div className="mt-6">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">Row Preview</h4>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--border-soft)]">
                    <table className="min-w-full divide-y divide-[color:var(--border-soft)] text-left text-sm">
                      <thead className="bg-sand-50 text-ink-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Row</th>
                          <th className="px-4 py-3 font-medium">Employee</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Warnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--border-soft)] bg-white/90 text-ink-800">
                        {result.preview.slice(0, 12).map((row) => (
                          <tr key={`${row.row}-${row.employee_id ?? row.name ?? 'row'}`}>
                            <td className="px-4 py-3">{row.row}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{row.name || 'Unknown employee'}</p>
                              <p className="text-xs text-ink-500">{row.employee_id || 'No employee_id'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={row.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-ink-500">
                              {row.warnings.length > 0 ? row.warnings.join('; ') : 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.preview.length > 12 ? (
                    <p className="mt-3 text-xs text-ink-500">
                      Showing the first 12 rows from the preview. The import summary still reflects the full file.
                    </p>
                  ) : null}
                </div>
              </Card>
            ) : null}

            <Card title="Recent Import History">
              {historyError ? (
                <Alert type="error" title="Unable to load import history" description={historyError} />
              ) : historyLoading ? (
                <p className="text-sm text-ink-500">Loading recent imports...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-ink-500">No import batches have been applied yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((batch) => (
                    <div
                      key={batch.id}
                      className="rounded-2xl border border-[color:var(--border-soft)] bg-white/90 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">
                            {batch.filename || 'CSV import'}
                          </p>
                          <p className="mt-1 text-xs text-ink-500">
                            {new Date(batch.importedAt).toLocaleString()} by {batch.actorName || batch.actorEmail || 'Unknown admin'}
                          </p>
                        </div>
                        <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
                          {batch.employeeCount} employees
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <CompactMetric label="Rows" value={batch.totalRows} />
                        <CompactMetric label="Creates" value={batch.rowsToCreate} />
                        <CompactMetric label="Updates" value={batch.rowsToUpdate} />
                        <CompactMetric
                          label="Warnings"
                          value={batch.warningCount}
                          tone={batch.warningCount > 0 ? 'warning' : 'default'}
                        />
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-ink-500">
                        <p>Batch ID: <span className="font-mono text-ink-700">{batch.id}</span></p>
                        <p>Valid rows: {batch.validRows} • Invalid rows: {batch.invalidRows}</p>
                      </div>

                      {batch.issues.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                            Recorded Issues
                          </p>
                          <ul className="mt-2 space-y-1 text-sm text-amber-900">
                            {batch.issues.slice(0, 4).map((issue) => (
                              <li key={`${batch.id}-${issue.severity}-${issue.row}-${issue.employee_id ?? 'row'}`}>
                                {issue.severity === 'error' ? 'Error' : 'Warning'} • Row {issue.row}
                                {issue.employee_id ? ` (${issue.employee_id})` : ''}: {issue.message}
                              </li>
                            ))}
                            {batch.issues.length > 4 ? (
                              <li>...and {batch.issues.length - 4} more</li>
                            ) : null}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Review Workflow">
              <ol className="space-y-3 text-sm text-ink-600">
                <li>1. Upload a CSV file and run a review before mutating the directory.</li>
                <li>2. Fix any blocking rows shown in the preview.</li>
                <li>3. Apply the import only after the review is clean.</li>
                <li>4. Re-open key employee, graph, and location views to confirm the result.</li>
              </ol>
            </Card>

            <Card title="CSV Format">
              <p className="mb-4 text-sm text-ink-600">Required columns: `employee_id`, `name`.</p>
              <ul className="space-y-2 text-sm text-ink-600">
                <li>`email`, `title`, `department`, `location`</li>
                <li>`hired_date` in `YYYY-MM-DD` format</li>
                <li>`manager_id` for reporting lines</li>
                <li>`skills`, `certifications` as semicolon-separated lists</li>
                <li>`education_*` and `aspiration_*` columns to replace those employee records</li>
              </ul>
            </Card>

            <Card title="Import Semantics">
              <ul className="space-y-2 text-sm text-ink-600">
                <li>Imported rows upsert by `employee_id`.</li>
                <li>If a column exists in the CSV and a value is blank, that field is cleared.</li>
                <li>If a column is absent from the CSV, existing data for that field is left untouched.</li>
                <li>Department, role, skill, certification, manager, education, and aspiration relationships are reconciled with the previewed row.</li>
              </ul>
            </Card>

            <Card title="Actions">
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => void loadHistory()}>
                  Refresh Import History
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => router.push('/dashboard')}>
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

function CompactMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'warning'
}) {
  return (
    <div className={`rounded-xl border border-[color:var(--border-soft)] px-3 py-2 ${tone === 'warning' ? 'bg-amber-50 text-amber-900' : 'bg-sand-50 text-ink-800'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const tones = {
    default: 'bg-white text-ink-900',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-800',
    danger: 'bg-rose-50 text-rose-800',
  }

  return (
    <div className={`rounded-2xl border border-[color:var(--border-soft)] p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: ImportRowPreview['status'] }) {
  const styles = {
    create: 'bg-primary-50 text-primary-800',
    update: 'bg-sand-100 text-ink-800',
    invalid: 'bg-rose-50 text-rose-700',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status === 'invalid' ? 'Blocked' : status === 'create' ? 'Create' : 'Update'}
    </span>
  )
}

function IssueList({
  title,
  tone,
  issues,
  emptyLabel,
}: {
  title: string
  tone: 'error' | 'warning'
  issues: ImportIssue[]
  emptyLabel: string
}) {
  const tones = {
    error: 'border-rose-200 bg-rose-50/90 text-rose-800',
    warning: 'border-amber-200 bg-amber-50/90 text-amber-800',
  }

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <h4 className="font-semibold">{title}</h4>
      {issues.length === 0 ? (
        <p className="mt-2 text-sm opacity-90">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
          {issues.slice(0, 12).map((issue) => (
            <li key={`${title}-${issue.row}-${issue.employee_id ?? 'row'}`}>
              Row {issue.row}
              {issue.employee_id ? ` (${issue.employee_id})` : ''}: {issue.message}
            </li>
          ))}
          {issues.length > 12 ? <li>...and {issues.length - 12} more</li> : null}
        </ul>
      )}
    </div>
  )
}
