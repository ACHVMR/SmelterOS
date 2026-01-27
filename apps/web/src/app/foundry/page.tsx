"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { SystemTelemetry } from "@/components/animations/NixieTube"
import { BoomerangOrbitCompact } from "@/components/animations/BoomerangOrbit"
import { WorldShowcase } from "@/components/landing/WorldShowcase"

const quickActions = [
  { icon: "🔨", label: "Forge Agent", href: "/forge", variant: "smelter" as const },
  { icon: "📊", label: "View Metrics", href: "/metrics", variant: "system" as const },
  { icon: "⚙️", label: "Circuit Box", href: "/circuit", variant: "foundry" as const },
  { icon: "🧠", label: "AVVA NOON", href: "/avva-noon", variant: "system" as const },
]

const recentActivity = [
  { time: "2m ago", action: "Agent BUILDER completed deployment", status: "success" },
  { time: "5m ago", action: "Ingot refinement: 847 tokens processed", status: "processing" },
  { time: "12m ago", action: "GUARDIAN flagged anomaly in sector 7", status: "warning" },
  { time: "18m ago", action: "New agent OPTIMIZER spawned", status: "success" },
  { time: "25m ago", action: "Memory optimization complete", status: "success" },
]

const agents = [
  { id: "1", name: "ARCHITECT", status: "active" as const },
  { id: "2", name: "BUILDER", status: "processing" as const },
  { id: "3", name: "GUARDIAN", status: "active" as const },
  { id: "4", name: "ANALYST", status: "active" as const },
  { id: "5", name: "DEPLOYER", status: "idle" as const },
  { id: "6", name: "MONITOR", status: "active" as const },
]

export default function FoundryPage() {
  return (
    <div className="min-h-screen bg-foundry-950">
      {/* Furnace Header */}
      <header className="furnace-header sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-display text-molten">
              SmelterOS
            </Link>
            <span className="text-foundry-500 text-sm font-mono">/ FOUNDRY</span>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge variant="optimal">SYSTEM OPTIMAL</StatusBadge>
            <Button variant="foundry" size="sm">Settings</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* System Telemetry */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SystemTelemetry
            uptime={{ days: 127, hours: 14, minutes: 45, seconds: 0 }}
            agentsActive={17}
            memoryUsage={64}
          />
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Navigation */}
          <motion.aside
            className="col-span-12 md:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="foundry" className="p-4">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-sm font-mono text-foundry-400 uppercase">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Button variant={action.variant} size="sm" className="w-full justify-start">
                      <span className="mr-2">{action.icon}</span>
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Agent Status */}
            <Card variant="foundry" className="p-4 mt-4">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-sm font-mono text-foundry-400 uppercase">
                  Active Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BoomerangOrbitCompact agents={agents} />
              </CardContent>
            </Card>
          </motion.aside>

          {/* Main Content - Molten Feed */}
          <motion.main
            className="col-span-12 md:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="foundry" className="p-6">
              <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display text-foundry-50">
                  Molten Feed
                </CardTitle>
                <span className="text-xs font-mono text-molten animate-pulse">● LIVE</span>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                {recentActivity.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-foundry-900/50 rounded-lg border border-foundry-800 hover:border-molten/20 transition-colors animate-molten-drip"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${
                      item.status === "success" ? "bg-system-green" :
                      item.status === "processing" ? "bg-molten animate-pulse" :
                      "bg-molten-highlight"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-foundry-200">{item.action}</p>
                      <span className="text-xs text-foundry-500 font-mono">{item.time}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Ingot Production */}
            <Card variant="smelter" className="p-6 mt-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-display text-foundry-50 flex items-center gap-2">
                  <span className="text-molten">🔥</span>
                  Ingot Production
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-display text-molten">847</div>
                    <div className="text-xs text-foundry-400 font-mono">TOKENS/MIN</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-display text-system-teal">12</div>
                    <div className="text-xs text-foundry-400 font-mono">ACTIVE INGOTS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-display text-molten-highlight">98.4%</div>
                    <div className="text-xs text-foundry-400 font-mono">EFFICIENCY</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.main>

          {/* Right Sidebar - System Health */}
          <motion.aside
            className="col-span-12 md:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="os" className="p-4">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-sm font-mono text-foundry-400 uppercase">
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foundry-300">CPU Usage</span>
                  <StatusBadge variant="optimal" size="sm">42%</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foundry-300">Memory</span>
                  <StatusBadge variant="processing" size="sm">64%</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foundry-300">Network</span>
                  <StatusBadge variant="optimal" size="sm">STABLE</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foundry-300">Storage</span>
                  <StatusBadge variant="warning" size="sm">78%</StatusBadge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card variant="ingot" className="p-4 mt-4">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-sm font-mono text-foundry-300 uppercase">
                  Today&apos;s Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-foundry-400">Ingots Forged</span>
                  <span className="text-sm font-mono text-molten">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foundry-400">Agents Deployed</span>
                  <span className="text-sm font-mono text-system-teal">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foundry-400">Tasks Completed</span>
                  <span className="text-sm font-mono text-system-green">847</span>
                </div>
              </CardContent>
            </Card>
          </motion.aside>
        </div>

        {/* World Labs Showcase */}
        <WorldShowcase className="mt-12" />
      </div>
    </div>
  )
}
