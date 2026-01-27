"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Switch } from "@/components/ui/switch"

interface ServiceStatus {
  id: string
  name: string
  type: "cloud-run" | "firestore" | "function" | "storage"
  status: "running" | "stopped" | "error"
  region: string
  lastDeployed?: string
}

const services: ServiceStatus[] = [
  { id: "1", name: "smelteros-api", type: "cloud-run", status: "running", region: "us-central1", lastDeployed: "2h ago" },
  { id: "2", name: "chickenhawk-engine", type: "cloud-run", status: "running", region: "us-central1", lastDeployed: "4h ago" },
  { id: "3", name: "avva-noon-core", type: "cloud-run", status: "running", region: "us-east1", lastDeployed: "1d ago" },
  { id: "4", name: "ingot-processor", type: "function", status: "running", region: "us-central1", lastDeployed: "6h ago" },
  { id: "5", name: "telemetry-stream", type: "firestore", status: "running", region: "nam5", lastDeployed: "3d ago" },
  { id: "6", name: "artifact-storage", type: "storage", status: "running", region: "us-multi", lastDeployed: "7d ago" },
  { id: "7", name: "backup-service", type: "cloud-run", status: "stopped", region: "us-west1", lastDeployed: "14d ago" },
  { id: "8", name: "legacy-adapter", type: "function", status: "error", region: "us-central1", lastDeployed: "2d ago" },
]

const switches = [
  { id: "auto-scale", label: "Auto Scaling", description: "Automatically scale services based on load", defaultOn: true },
  { id: "telemetry", label: "Telemetry Stream", description: "Real-time metrics collection", defaultOn: true },
  { id: "backup", label: "Auto Backup", description: "Scheduled database backups", defaultOn: true },
  { id: "alerts", label: "Alert System", description: "Critical failure notifications", defaultOn: true },
  { id: "debug", label: "Debug Mode", description: "Verbose logging for all services", defaultOn: false },
  { id: "maintenance", label: "Maintenance Mode", description: "Disable public access", defaultOn: false },
]

export default function CircuitBoxPage() {
  const [emergencyShutdown, setEmergencyShutdown] = useState(false)
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>(
    Object.fromEntries(switches.map(s => [s.id, s.defaultOn]))
  )

  const handleSwitchChange = (id: string, checked: boolean) => {
    setSwitchStates(prev => ({ ...prev, [id]: checked }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "system-green"
      case "stopped": return "foundry-500"
      case "error": return "molten-deep"
      default: return "foundry-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cloud-run": return "☁️"
      case "firestore": return "🔥"
      case "function": return "⚡"
      case "storage": return "💾"
      default: return "📦"
    }
  }

  return (
    <div className="min-h-screen bg-foundry-950">
      {/* Header */}
      <header className="bg-foundry-900 border-b border-foundry-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-display text-molten">
              SmelterOS
            </Link>
            <span className="text-foundry-500 text-sm font-mono">/ CIRCUIT BOX</span>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge variant="system">CONNECTED TO GCP</StatusBadge>
            <Link href="/foundry">
              <Button variant="foundry" size="sm">← Foundry</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Emergency Shutdown Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`p-6 border-2 ${emergencyShutdown ? "border-molten-deep bg-molten-deep/10" : "border-foundry-700 bg-foundry-900"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display text-foundry-50 flex items-center gap-2">
                  <span className="text-molten-deep">⚠️</span>
                  Emergency System Control
                </h2>
                <p className="text-sm text-foundry-400 mt-1">
                  Master shutdown for all Cloud Run services and Firestore connections
                </p>
              </div>
              <Button
                variant={emergencyShutdown ? "smelter" : "destructive"}
                size="lg"
                onClick={() => setEmergencyShutdown(!emergencyShutdown)}
                className={`${emergencyShutdown ? "" : "bg-molten-deep hover:bg-molten-deep/80"} min-w-[200px]`}
              >
                {emergencyShutdown ? "🔄 RESTORE SYSTEMS" : "🛑 EMERGENCY SHUTDOWN"}
              </Button>
            </div>
            {emergencyShutdown && (
              <motion.div
                className="mt-4 p-4 bg-molten-deep/20 rounded-lg border border-molten-deep/40"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <p className="text-sm text-molten-highlight font-mono animate-pulse">
                  ⚠️ ALL SERVICES ARE CURRENTLY OFFLINE - EMERGENCY SHUTDOWN ACTIVE
                </p>
              </motion.div>
            )}
          </Card>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {/* Services Grid */}
          <motion.div
            className="col-span-12 lg:col-span-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="foundry" className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-display text-foundry-50 flex items-center justify-between">
                  <span>Service Matrix</span>
                  <span className="text-xs font-mono text-foundry-500">
                    {services.filter(s => s.status === "running").length}/{services.length} RUNNING
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      className={`p-4 rounded-lg border transition-all ${
                        service.status === "running" 
                          ? "bg-foundry-800/50 border-system-green/30 hover:border-system-green/60" 
                          : service.status === "error"
                          ? "bg-molten-deep/10 border-molten-deep/40 hover:border-molten-deep"
                          : "bg-foundry-900/50 border-foundry-700 hover:border-foundry-600"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(service.type)}</span>
                          <div>
                            <div className="font-mono text-sm text-foundry-100">{service.name}</div>
                            <div className="text-xs text-foundry-500">{service.region}</div>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          service.status === "running" ? "bg-system-green shadow-glow-switch-on" :
                          service.status === "error" ? "bg-molten-deep animate-pulse-heat" :
                          "bg-foundry-600"
                        }`} />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-foundry-500 font-mono">
                          Deployed: {service.lastDeployed}
                        </span>
                        <StatusBadge 
                          variant={
                            service.status === "running" ? "optimal" : 
                            service.status === "error" ? "critical" : "inactive"
                          }
                          size="sm"
                        >
                          {service.status.toUpperCase()}
                        </StatusBadge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Control Switches */}
          <motion.aside
            className="col-span-12 lg:col-span-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="foundry" className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-display text-foundry-50">
                  System Switches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {switches.map((sw) => (
                  <div 
                    key={sw.id} 
                    className="flex items-center justify-between p-3 bg-foundry-900/50 rounded-lg border border-foundry-800"
                  >
                    <div className="flex-1 mr-4">
                      <div className="text-sm font-medium text-foundry-100">{sw.label}</div>
                      <div className="text-xs text-foundry-500">{sw.description}</div>
                    </div>
                    <div className="relative">
                      <Switch
                        checked={switchStates[sw.id]}
                        onCheckedChange={(checked) => handleSwitchChange(sw.id, checked)}
                        className={switchStates[sw.id] ? "data-[state=checked]:bg-system-green" : ""}
                      />
                      {switchStates[sw.id] && (
                        <div className="absolute inset-0 rounded-full bg-system-green/30 blur-md -z-10" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="smelter" className="p-6 mt-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-display text-foundry-50">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <Button variant="smelter" className="w-full justify-start">
                  🔄 Redeploy All Services
                </Button>
                <Button variant="system" className="w-full justify-start">
                  📊 Generate Health Report
                </Button>
                <Button variant="foundry" className="w-full justify-start">
                  📋 Export Logs
                </Button>
              </CardContent>
            </Card>
          </motion.aside>
        </div>
      </div>
    </div>
  )
}
