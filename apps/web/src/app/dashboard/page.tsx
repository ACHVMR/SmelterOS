"use client";

import React from "react";
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  Globe, 
  Shield, 
  Zap, 
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-foreground p-8 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2 mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Manage your AI agents, deployments, and infrastructure health.
        </p>
      </div>

      {/* High-Level Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard 
          title="Total Requests" 
          value="24.5k" 
          change="+12% from last month" 
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard 
          title="Active Agents" 
          value="12" 
          change="+2 new agents" 
          icon={<Cpu className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard 
          title="System Uptime" 
          value="99.9%" 
          change="Operational" 
          icon={<Server className="h-4 w-4 text-emerald-500" />}
        />
        <MetricCard 
          title="Avg. Response" 
          value="142ms" 
          change="-18ms improvement" 
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Main Content - Agent Status (4 cols) */}
        <Card className="col-span-4 border-zinc-800 bg-zinc-950/50">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
            <CardDescription>Real-time monitoring of active AI agents.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-[150px]">Agent Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Load</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AgentRow name="Voice Agent" status="active" model="ElevenLabs v2" load="78%" />
                <AgentRow name="Code Gen" status="active" model="GPT-4 Turbo" load="65%" />
                <AgentRow name="Orchestrator" status="active" model="System" load="42%" />
                <AgentRow name="Testing Bot" status="idle" model="Custom" load="0%" />
                <AgentRow name="Deployer" status="idle" model="Script" load="0%" />
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sidebar - Recent Activity (3 cols) */}
        <Card className="col-span-3 border-zinc-800 bg-zinc-950/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ActivityItem 
                time="2 min ago" 
                title="Deployment Successful" 
                desc="v2.4.0 deployed to production"
                type="success"
              />
              <ActivityItem 
                time="15 min ago" 
                title="High Latency Alert" 
                desc="Database response > 500ms"
                type="warning"
              />
              <ActivityItem 
                time="1 hour ago" 
                title="New Component Created" 
                desc="StatusIndicator added to lib"
                type="info"
              />
              <ActivityItem 
                time="2 hours ago" 
                title="Backup Completed" 
                desc="Daily snapshot saved to S3"
                type="success"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Row */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <InfrastructureCard 
          title="Database" 
          status="Healthy" 
          details="PostgreSQL 15 • 42% Active Conns"
          icon={<Database className="h-5 w-5" />}
        />
        <InfrastructureCard 
          title="API Gateway" 
          status="Healthy" 
          details="Cloudflare • 22ms Latency"
          icon={<Globe className="h-5 w-5" />}
        />
        <InfrastructureCard 
          title="Security" 
          status="Secure" 
          details="WAF Active • 0 Threats"
          icon={<Shield className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function MetricCard({ title, value, change, icon }: any) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{change}</p>
      </CardContent>
    </Card>
  );
}

function AgentRow({ name, status, model, load }: any) {
  return (
    <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
      <TableCell className="font-medium text-white">{name}</TableCell>
      <TableCell>
        <Badge variant={status === "active" ? "default" : "secondary"} className={status === "active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : ""}>
          {status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{model}</TableCell>
      <TableCell className="text-right font-mono text-xs">{load}</TableCell>
    </TableRow>
  );
}

function ActivityItem({ time, title, desc, type }: any) {
  const color = type === "success" ? "text-emerald-500" : type === "warning" ? "text-amber-500" : "text-blue-500";
  return (
    <div className="flex items-start gap-4">
      <div className={`mt-1 h-2 w-2 rounded-full ${type === "success" ? "bg-emerald-500" : type === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none text-white">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
        <p className="text-[10px] text-zinc-500 font-mono pt-1">{time}</p>
      </div>
    </div>
  );
}

function InfrastructureCard({ title, status, details, icon }: any) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/50">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="p-2 bg-zinc-900 rounded-md text-white">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base text-white">{title}</CardTitle>
          <CardDescription className="text-xs">{status}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-white/20 w-full" />
        </div>
        <p className="text-xs text-muted-foreground font-mono">{details}</p>
      </CardContent>
    </Card>
  );
}
