"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function AccountDashboardPage() {
  return (
    <div className="min-h-screen bg-black p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Dashboard / Account</p>
            <h1 className="mt-2 text-3xl font-semibold">Account Center</h1>
            <p className="mt-2 text-zinc-400">Manage profile, plan, security controls, and team access from one place.</p>
          </div>
          <Button asChild variant="outline" className="border-zinc-700 bg-transparent text-zinc-200">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Overview
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserRound className="h-4 w-4 text-orange-400" /> Profile</CardTitle>
              <CardDescription>Primary owner settings for ACHIEVEMOR Deploy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Workspace" value="Crypt_Ang Shield Division" />
              <Info label="Owner" value="acheevy@deploy.ai" />
              <Info label="Region" value="United States (us-central)" />
              <Badge className="border-emerald-500/50 bg-emerald-500/10 text-emerald-300">Verified</Badge>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-orange-400" /> Plan & Billing</CardTitle>
              <CardDescription>Subscription and spend controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Plan" value="Pro Shield" />
              <Info label="Monthly Limit" value="$300.00" />
              <Info label="Current Cycle" value="$27.50 used" />
              <Button asChild className="w-full bg-orange-500 text-black hover:bg-orange-400">
                <Link href="/dashboard/billing">Open Billing</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-400" /> Security</CardTitle>
              <CardDescription>Risk controls and access hardening.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Toggle label="Require MFA for all admins" enabled />
              <Toggle label="Session anomaly alerts" enabled />
              <Toggle label="Emergency lockout mode" enabled={false} />
              <Button asChild variant="outline" className="w-full border-zinc-700 bg-transparent text-zinc-100">
                <Link href="/dashboard/security">Open Security</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-orange-400" /> Team Access Matrix</CardTitle>
            <CardDescription>Default account-level permissions by squad.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {[
                ["Black", "SAT-gated offensive simulation"],
                ["Blue", "Always-on detection & containment"],
                ["Purple", "Cross-team detection engineering"],
                ["White", "Governance + privacy enforcement"],
                ["Gold", "Platform-root trust controls"],
              ].map(([name, desc]) => (
                <div key={name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <p className="font-medium">{name} Squad</p>
                  <p className="mt-1 text-xs text-zinc-400">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 font-medium text-zinc-200">{value}</p>
    </div>
  );
}

function Toggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2">
      <span>{label}</span>
      <Switch defaultChecked={enabled} />
    </div>
  );
}
