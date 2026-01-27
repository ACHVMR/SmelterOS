export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b bg-white dark:bg-slate-950 px-6 py-4">
        <div className="font-bold text-blue-600">Locale / Partner</div>
      </header>
      <main>
        {children}
      </main>
    </div>
  )
}
