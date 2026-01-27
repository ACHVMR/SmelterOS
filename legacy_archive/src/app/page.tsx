import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8 bg-zinc-950 text-zinc-50">
      <h1 className="text-4xl font-bold tracking-tight">SmelterOS Rebuild</h1>
      <p className="text-zinc-400">Route B: Fresh Build Verified</p>
      
      <div className="flex gap-4">
        <Link href="/dashboard/client">
          <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700">Client Dashboard</Button>
        </Link>
        <Link href="/dashboard/partner">
          <Button variant="secondary">Partner Dashboard</Button>
        </Link>
      </div>

      <div className="text-xs text-zinc-600 font-mono">
        System Status: ONLINE
      </div>
    </main>
  );
}
