export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b bg-white dark:bg-zinc-950 px-6 py-4">
        <div className="font-bold">Locale / Client</div>
      </header>
      <main>
        {children}
      </main>
    </div>
  )
}
