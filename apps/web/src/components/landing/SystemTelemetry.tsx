"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface TelemetryData {
  uptime: string
  agents: number
  memory: number
  status: "ONLINE" | "PROCESSING" | "OFFLINE"
}

const formatUptime = (totalSeconds: number): string => {
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

interface SystemTelemetryProps {
  className?: string
  position?: "header" | "footer"
}

export function SystemTelemetry({ className = "", position = "footer" }: SystemTelemetryProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    uptime: "127:14:32:48",
    agents: 17,
    memory: 64,
    status: "ONLINE"
  })

  const [uptimeSeconds, setUptimeSeconds] = useState(11016768)

  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const displayUptime = formatUptime(uptimeSeconds)

  if (position === "header") {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 bg-[var(--foundry-950)]/90 backdrop-blur-xl border-b border-[var(--glass-border)] ${className}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--molten-core)] to-[var(--molten-hot)] flex items-center justify-center font-bold text-sm text-black">
              S
            </div>
            <span className="text-lg font-bold font-display tracking-wider text-gradient-molten">
              SMELTEROS
            </span>
          </div>

          {/* Telemetry - Desktop */}
          <div className="hidden md:flex items-center gap-6 text-xs font-mono">
            <TelemetryChip label="UPTIME" value={displayUptime} />
            <TelemetryChip label="AGENTS" value={telemetry.agents.toString()} accent="teal" />
            <TelemetryChip label="MEM" value={`${telemetry.memory}%`} accent="green" />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="status-dot status-dot-green" />
            <span className="text-xs font-mono text-[var(--system-green)]">{telemetry.status}</span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <footer className={`fixed bottom-0 left-0 right-0 z-50 bg-[var(--foundry-950)]/90 backdrop-blur-xl border-t border-[var(--glass-border)] ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-center gap-8 text-xs font-mono">
          {/* Status indicators */}
          <StatusIndicator label="ORACLE" status="ONLINE" color="green" />
          <StatusIndicator label="ADK" status="CONNECTED" color="teal" />
          <StatusIndicator label="FORGE" status="READY" color="orange" />
          
          {/* Separator */}
          <div className="w-px h-4 bg-[var(--glass-border)] hidden sm:block" />
          
          {/* Uptime */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-zinc-500">UPTIME:</span>
            <span className="nixie-display">{displayUptime}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function TelemetryChip({ label, value, accent = "orange" }: { label: string; value: string; accent?: "orange" | "teal" | "green" }) {
  const accentColors = {
    orange: "text-[var(--molten-core)]",
    teal: "text-[var(--system-teal)]",
    green: "text-[var(--system-green)]"
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--foundry-800)] rounded-lg border border-[var(--glass-border)]">
      <span className="text-zinc-500">{label}:</span>
      <motion.span 
        className={`font-semibold tabular-nums ${accentColors[accent]}`}
        key={value}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
      >
        {value}
      </motion.span>
    </div>
  )
}

function StatusIndicator({ label, status, color }: { label: string; status: string; color: "green" | "teal" | "orange" }) {
  const colorClasses = {
    green: { dot: "status-dot-green", text: "text-[var(--system-green)]" },
    teal: { dot: "status-dot-teal", text: "text-[var(--system-teal)]" },
    orange: { dot: "status-dot-orange", text: "text-[var(--molten-core)]" }
  }

  return (
    <div className={`flex items-center gap-2 ${colorClasses[color].text}`}>
      <div className={`status-dot ${colorClasses[color].dot}`} />
      <span>{label}: {status}</span>
    </div>
  )
}
