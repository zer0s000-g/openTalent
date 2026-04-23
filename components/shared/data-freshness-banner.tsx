import React from 'react'

interface DataFreshnessSummary {
  employeeCount: number
  employeesWithImportMetadata: number
  totalImportBatches: number
  latestBatchId?: string | null
  latestImportSource?: string | null
  latestImportedAt?: string | null
  latestWarningCount: number
  latestRowsToCreate: number
  latestRowsToUpdate: number
}

function formatTimestamp(value?: string | null) {
  if (!value) return 'Not available'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString()
}

export function DataFreshnessBanner({
  summary,
  contextLabel,
}: {
  summary: DataFreshnessSummary | null
  contextLabel: string
}) {
  if (!summary) {
    return (
      <div className="rounded-[24px] border border-[color:var(--border)] bg-white/82 px-5 py-4">
        <p className="text-sm font-medium text-ink-600">Data freshness</p>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Freshness details are not available for this view yet.
        </p>
      </div>
    )
  }

  const hasCoverage = summary.employeeCount > 0
  const coverageLabel = hasCoverage
    ? `${summary.employeesWithImportMetadata} of ${summary.employeeCount} employees carry import provenance`
    : 'No employee coverage available'

  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,247,252,0.92))] px-5 py-4 shadow-[0_12px_30px_rgba(148,163,184,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Data Freshness</p>
          <p className="mt-2 font-medium text-ink-900">
            {contextLabel} reflects the latest import from{' '}
            <span className="text-primary-700">{summary.latestImportSource || 'the workforce CSV pipeline'}</span>.
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Last imported {formatTimestamp(summary.latestImportedAt)}. {coverageLabel}.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[22rem]">
          <MetricChip label="Batches" value={summary.totalImportBatches} />
          <MetricChip label="Creates" value={summary.latestRowsToCreate} />
          <MetricChip label="Updates" value={summary.latestRowsToUpdate} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-500">
        <span className="rounded-full bg-sand-100 px-2.5 py-1 font-medium text-ink-700">
          Batch {summary.latestBatchId || 'Not available'}
        </span>
        <span className={`rounded-full px-2.5 py-1 font-medium ${summary.latestWarningCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {summary.latestWarningCount > 0
            ? `${summary.latestWarningCount} warning${summary.latestWarningCount === 1 ? '' : 's'} recorded`
            : 'No warnings on latest batch'}
        </span>
      </div>
    </div>
  )
}

function MetricChip({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white/82 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink-900">{value}</p>
    </div>
  )
}

export type { DataFreshnessSummary }
