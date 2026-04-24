"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Crown,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type TeamMember = {
  name: string;
  role: string;
  squad: "Black" | "Blue" | "Purple" | "White" | "Gold";
  status: "Online" | "On Mission" | "Standby";
};

const team: TeamMember[] = [
  { name: "Lil_Mast_Hawk", role: "Identity / MFA Lead", squad: "Gold", status: "Online" },
  { name: "Lil_Watch_Hawk", role: "Detection Engine", squad: "Blue", status: "On Mission" },
  { name: "Lil_Scope_Hawk", role: "Kinetic Execution", squad: "Black", status: "Standby" },
  { name: "Lil_Seal_Hawk", role: "Edge Privacy Guard", squad: "White", status: "Online" },
  { name: "Lil_Arc_Hawk", role: "Red/Blue Integration", squad: "Purple", status: "Online" },
  { name: "Lil_Doubt_Hawk", role: "Internal Auditor", squad: "Gold", status: "On Mission" },
];

const squadColor: Record<TeamMember["squad"], string> = {
  Black: "bg-zinc-700/20 text-zinc-200 border-zinc-600",
  Blue: "bg-sky-500/10 text-sky-300 border-sky-500/40",
  Purple: "bg-violet-500/10 text-violet-300 border-violet-500/40",
  White: "bg-stone-400/10 text-stone-200 border-stone-500/40",
  Gold: "bg-amber-500/10 text-amber-300 border-amber-500/40",
};

const statusColor: Record<TeamMember["status"], string> = {
  Online: "text-emerald-400",
  "On Mission": "text-orange-400",
  Standby: "text-zinc-400",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Deploy by ACHIEVEMOR</p>
              <h1 className="mt-2 text-3xl font-semibold">Account Dashboard</h1>
              <p className="mt-2 text-zinc-400">
                Team operations, account posture, and deployment confidence for your Plugs.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="border-zinc-700 bg-transparent text-zinc-200">
                <Link href="/dashboard/security">Security Controls</Link>
              </Button>
              <Button asChild className="bg-orange-500 text-black hover:bg-orange-400">
                <Link href="/dashboard/account">Open Account Center</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric title="Active Hawks" value="32" hint="5 squads online" icon={<Users className="h-4 w-4" />} />
          <Metric title="Ops Confidence" value="99.97%" hint="CIA gates healthy" icon={<Shield className="h-4 w-4" />} />
          <Metric title="Monthly Spend" value="$27.50" hint="Pro plan + BYOK" icon={<Wallet className="h-4 w-4" />} />
          <Metric title="Live Plugs" value="12" hint="2 in rollout" icon={<Sparkles className="h-4 w-4" />} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-zinc-800 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-orange-400" /> Team Command Grid
              </CardTitle>
              <CardDescription>Persona-aligned operators active in your tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-zinc-400">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={squadColor[member.squad]}>{member.squad} Squad</Badge>
                    <span className={`text-sm ${statusColor[member.status]}`}>{member.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Briefcase className="h-5 w-5 text-orange-400" /> Account Posture
              </CardTitle>
              <CardDescription>Plan, limits, and mission-readiness snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-400">Current Plan</p>
                <p className="mt-1 text-xl font-semibold">Pro Shield</p>
                <p className="text-sm text-zinc-500">Renews May 1, 2026</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Privacy Budget (high-risk)</span>
                  <span className="font-mono text-orange-300">81%</span>
                </div>
                <Progress value={81} className="h-2" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Compute Capacity</span>
                  <span className="font-mono text-emerald-300">67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>

              <Button asChild className="w-full bg-orange-500 text-black hover:bg-orange-400">
                <Link href="/dashboard/account" className="inline-flex items-center justify-center gap-2">
                  Manage Account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Crown className="h-4 w-4 text-amber-300" />}
            title="Team Design"
            description="Assign squad goals, set constraints, and wire role-based permissions for every Hawk persona."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            title="Front-End Ops"
            description="One pane to launch Plug deploys, monitor release health, and route support quickly."
          />
          <FeatureCard
            icon={<Shield className="h-4 w-4 text-sky-300" />}
            title="Account Defense"
            description="Review billing, BYOK controls, session trust, and privacy/security posture with shared context."
          />
        </section>
      </div>
    </div>
  );
}

function Metric({ title, value, hint, icon }: { title: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-zinc-400">{title}</CardTitle>
        <span className="text-zinc-400">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-400">{description}</p>
      </CardContent>
    </Card>
  );
}
