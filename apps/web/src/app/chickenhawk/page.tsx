"use client"

import React from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"

const techStack = {
  frontend: [
    { name: "React 19", status: "active", icon: "⚛️" },
    { name: "Next.js 16", status: "active", icon: "▲" },
    { name: "Tailwind CSS", status: "active", icon: "🎨" },
    { name: "ShadCN UI", status: "active", icon: "🧩" }
  ],
  backend: [
    { name: "Cloud Run", status: "active", icon: "☁️" },
    { name: "Express.js", status: "active", icon: "🚀" },
    { name: "Firestore", status: "active", icon: "🔥" }
  ],
  ai: [
    { name: "Agent Zero", status: "active", icon: "🤖" },
    { name: "GROQ (Llama)", status: "active", icon: "🦙" },
    { name: "OpenAI GPT-4", status: "active", icon: "🧠" },
    { name: "AVVA NOON", status: "active", icon: "💫" }
  ],
  infrastructure: [
    { name: "Docker", status: "active", icon: "🐳" },
    { name: "GCP", status: "active", icon: "☁️" },
    { name: "GitHub Actions", status: "active", icon: "⚙️" }
  ],
  integrations: [
    { name: "Stripe", status: "active", icon: "💳" },
    { name: "Firebase", status: "active", icon: "🔥" },
    { name: "ElevenLabs", status: "active", icon: "🎙️" },
    { name: "Deepgram", status: "active", icon: "👂" }
  ]
}

export default function ChickenhawkPage() {
  return (
    <div className="min-h-screen bg-foundry-950 text-foundry-50">
      {/* Header */}
      <header className="bg-foundry-900 border-b border-foundry-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 relative">
              <Image
                src="/chickenhawk-logo.png"
                alt="Chickenhawk"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <Link href="/" className="text-2xl font-display text-molten">
                CHICKENHAWK
              </Link>
              <p className="text-xs font-mono text-foundry-500">SYSTEM INFRASTRUCTURE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge variant="optimal">ALL SYSTEMS NOMINAL</StatusBadge>
            <Link href="/">
              <Button variant="foundry" size="sm">← Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-display text-foundry-50 mb-4">
            Tech Stack & Infrastructure
          </h1>
          <p className="text-foundry-400 max-w-2xl mx-auto">
            The complete nervous system of SmelterOS — from frontend interfaces to AI orchestration layers.
          </p>
        </motion.div>

        {/* Tech Stack Grid */}
        <div className="space-y-8">
          {Object.entries(techStack).map(([category, technologies], categoryIndex) => (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-lg font-display text-molten mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-[2px] bg-molten-gradient rounded" />
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {technologies.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                  >
                    <Card 
                      variant={tech.status === "active" ? "os" : "foundry"}
                      className="p-4 h-full"
                    >
                      <CardContent className="p-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-foundry-800 rounded-lg flex items-center justify-center text-2xl border border-foundry-700">
                            {tech.icon}
                          </div>
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            tech.status === "active" 
                              ? "bg-system-green shadow-glow-switch-on" 
                              : "bg-foundry-600"
                          }`} />
                        </div>
                        <div className="font-semibold text-foundry-100">{tech.name}</div>
                        <div className="text-xs text-foundry-500 mt-1">
                          {tech.status === "active" ? "● Connected" : "○ Inactive"}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* System Health Dashboard */}
        <motion.section
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-display text-system-teal mb-4 uppercase tracking-wider flex items-center gap-2">
            <span className="w-8 h-[2px] bg-system-gradient rounded" />
            System Health
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="smelter" className="p-6 text-center">
              <div className="text-5xl font-display text-system-green mb-2">100%</div>
              <div className="text-sm text-foundry-300">Services Operational</div>
              <StatusBadge variant="optimal" className="mt-3">HEALTHY</StatusBadge>
            </Card>
            
            <Card variant="smelter" className="p-6 text-center">
              <div className="text-5xl font-display text-molten mb-2">99.9%</div>
              <div className="text-sm text-foundry-300">Uptime (30 days)</div>
              <StatusBadge variant="optimal" className="mt-3">STABLE</StatusBadge>
            </Card>
            
            <Card variant="smelter" className="p-6 text-center">
              <div className="text-5xl font-display text-system-teal mb-2">24</div>
              <div className="text-sm text-foundry-300">Active Integrations</div>
              <StatusBadge variant="system" className="mt-3">CONNECTED</StatusBadge>
            </Card>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.div 
          className="mt-12 flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Link href="/circuit">
            <Button variant="system" size="lg">
              ⚙️ Circuit Box
            </Button>
          </Link>
          <Link href="/foundry">
            <Button variant="smelter" size="lg">
              🔥 Foundry
            </Button>
          </Link>
          <Link href="/avva-noon">
            <Button variant="foundry" size="lg">
              🧠 AVVA NOON
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
