export default function PartnerDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Partner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold mb-2">Open Jobs</h3>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold mb-2">Earnings</h3>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
      </div>
    </div>
  );
}
