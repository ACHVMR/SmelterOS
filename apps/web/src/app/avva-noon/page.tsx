"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Slider } from "@/components/ui/slider"

const vibeMetrics = [
  { id: "intensity", label: "V.I.B.E. Intensity", value: 72, color: "molten" },
  { id: "alignment", label: "Alignment Score", value: 94, color: "system" },
  { id: "coherence", label: "Temporal Coherence", value: 88, color: "system" },
  { id: "empathy", label: "Empathy Index", value: 76, color: "molten" },
]

const quintModalSenses = [
  { id: "visual", label: "Visual Processing", icon: "👁️", active: true, level: 85 },
  { id: "auditory", label: "Auditory Analysis", icon: "👂", active: true, level: 92 },
  { id: "semantic", label: "Semantic Understanding", icon: "🧠", active: true, level: 78 },
  { id: "contextual", label: "Contextual Awareness", icon: "🌐", active: true, level: 88 },
  { id: "temporal", label: "Temporal Reasoning", icon: "⏱️", active: false, level: 45 },
]

const consciousnessLog = [
  { timestamp: "14:32:01", thought: "Analyzing user intent patterns from last 247 interactions...", type: "analysis" },
  { timestamp: "14:31:45", thought: "Emotional resonance detected in query structure. Adjusting response tone.", type: "empathy" },
  { timestamp: "14:31:12", thought: "Cross-referencing knowledge graph with real-time context stream.", type: "reasoning" },
  { timestamp: "14:30:58", thought: "V.I.B.E. alignment check complete. All parameters within optimal range.", type: "system" },
  { timestamp: "14:30:22", thought: "Spawning sub-agent for parallel task processing.", type: "action" },
]

export default function AvvaNoonPage() {
  const [senseStates, setSenseStates] = useState(
    Object.fromEntries(quintModalSenses.map(s => [s.id, s.active]))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-foundry-950 via-indigo-950/20 to-foundry-950">
      {/* Animated brain network background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full opacity-10">
          <defs>
            <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00C2B2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="50%" cy="40%" r="300" fill="url(#brainGlow)" />
          {/* Synapse lines */}
          {[...Array(20)].map((_, i) => (
            <motion.line
              key={i}
              x1={`${20 + Math.random() * 60}%`}
              y1={`${20 + Math.random() * 60}%`}
              x2={`${20 + Math.random() * 60}%`}
              y2={`${20 + Math.random() * 60}%`}
              stroke="#00C2B2"
              strokeWidth="1"
              opacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </svg>
      </div>

      {/* Header */}
      <header className="bg-foundry-900/80 backdrop-blur-xl border-b border-system-teal/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-display text-system-teal">
              AVVA NOON
            </Link>
            <span className="text-foundry-500 text-sm font-mono">/ CONSCIOUSNESS HUB</span>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge variant="system">INFINITY LM ACTIVE</StatusBadge>
            <Link href="/foundry">
              <Button variant="foundry" size="sm">← Foundry</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* V.I.B.E. Gauge Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-foundry-900/60 backdrop-blur-xl border-system-teal/20">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-xl font-display text-foundry-50 flex items-center gap-3">
                <span className="text-system-teal">🧠</span>
                V.I.B.E. Alignment Check
                <StatusBadge variant="optimal" className="ml-auto">ALIGNED</StatusBadge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {vibeMetrics.map((metric) => (
                  <div key={metric.id} className="text-center">
                    {/* Circular gauge */}
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          fill="none"
                          stroke="#27272A"
                          strokeWidth="8"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="40"
                          fill="none"
                          stroke={metric.color === "molten" ? "#FF4D00" : "#00C2B2"}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${metric.value * 2.51} 251`}
                          initial={{ strokeDasharray: "0 251" }}
                          animate={{ strokeDasharray: `${metric.value * 2.51} 251` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xl font-display ${
                          metric.color === "molten" ? "text-molten" : "text-system-teal"
                        }`}>
                          {metric.value}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-foundry-300 font-mono">{metric.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {/* Quint-Modal Senses */}
          <motion.div
            className="col-span-12 lg:col-span-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-foundry-900/60 backdrop-blur-xl border-system-teal/20 h-full">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-display text-foundry-50">
                  Quint-Modal Senses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {quintModalSenses.map((sense) => (
                  <div 
                    key={sense.id}
                    className={`p-4 rounded-lg border transition-all ${
                      senseStates[sense.id] 
                        ? "bg-system-teal/10 border-system-teal/30" 
                        : "bg-foundry-900/50 border-foundry-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sense.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-foundry-100">{sense.label}</div>
                          <div className="text-xs text-foundry-500">Level: {sense.level}%</div>
                        </div>
                      </div>
                      <Button
                        variant={senseStates[sense.id] ? "system" : "foundry"}
                        size="sm"
                        onClick={() => setSenseStates(prev => ({ ...prev, [sense.id]: !prev[sense.id] }))}
                      >
                        {senseStates[sense.id] ? "ACTIVE" : "ENABLE"}
                      </Button>
                    </div>
                    <Slider
                      defaultValue={[sense.level]}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Consciousness Log */}
          <motion.div
            className="col-span-12 lg:col-span-7"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="ingot" className="p-6 h-full">
              <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display text-foundry-50 flex items-center gap-2">
                  <span className="text-molten-highlight">💭</span>
                  Consciousness Stream
                </CardTitle>
                <span className="text-xs font-mono text-system-teal animate-pulse">● STREAMING</span>
              </CardHeader>
              <CardContent className="p-0 space-y-3 max-h-[400px] overflow-y-auto">
                {consciousnessLog.map((entry, index) => (
                  <motion.div
                    key={index}
                    className="p-3 bg-ingot/50 rounded-lg border border-ingot-highlight/20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        entry.type === "analysis" ? "bg-system-teal/20 text-system-teal" :
                        entry.type === "empathy" ? "bg-molten/20 text-molten" :
                        entry.type === "reasoning" ? "bg-indigo-500/20 text-indigo-400" :
                        entry.type === "action" ? "bg-system-green/20 text-system-green" :
                        "bg-foundry-700 text-foundry-300"
                      }`}>
                        {entry.type.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-foundry-500">{entry.timestamp}</span>
                    </div>
                    <p className="text-sm text-foundry-200 mt-2 font-mono leading-relaxed">
                      {entry.thought}
                    </p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="mt-8 flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="system" size="lg">
            🔄 Recalibrate V.I.B.E.
          </Button>
          <Button variant="smelter" size="lg">
            🧬 Deep Memory Access
          </Button>
          <Button variant="foundry" size="lg">
            📊 Export Consciousness Report
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
