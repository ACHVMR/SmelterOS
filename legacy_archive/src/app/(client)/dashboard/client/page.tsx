export default function ClientDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Client Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold mb-2">Active Projects</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold mb-2">AI Credits</h3>
          <p className="text-2xl font-bold">100</p>
        </div>
      </div>
    </div>
  );
}
