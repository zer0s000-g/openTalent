export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 pl-64 flex flex-col w-full">
      <main className="flex-1 px-8 py-8 w-full max-w-[1400px] mx-auto">{children}</main>
    </div>
  )
}
