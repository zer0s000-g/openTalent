import Link from 'next/link'

const accessMessages: Record<string, { title: string; description: string }> = {
  signin: {
    title: 'Internal access is required',
    description:
      'OpenTalent AirNav is restricted to authenticated AirNav Indonesia users on the internal network. Connect through VPN and sign in through the configured internal access layer.',
  },
  admin: {
    title: 'Administrator access is required',
    description:
      'This area is reserved for authorized data operations administrators because it can modify workforce records and import source data.',
  },
}

export default function AccessDeniedPage({
  searchParams,
}: {
  searchParams?: { reason?: string; from?: string }
}) {
  const reason = searchParams?.reason === 'admin' ? 'admin' : 'signin'
  const message = accessMessages[reason]

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="surface-panel max-w-2xl rounded-[28px] px-8 py-10 text-left">
        <p className="section-label">Protected Workspace</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900">
          {message.title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-600">
          {message.description}
        </p>
        {searchParams?.from ? (
          <p className="mt-4 text-sm text-ink-500">
            Requested path: <span className="font-mono">{searchParams.from}</span>
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-ink-800"
          >
            Return to dashboard
          </Link>
          <Link
            href="/api/health"
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-white/85 px-4 py-2.5 text-sm font-medium text-ink-800 shadow-sm transition-all hover:border-primary-200 hover:bg-white"
          >
            Check service health
          </Link>
        </div>
      </div>
    </main>
  )
}
