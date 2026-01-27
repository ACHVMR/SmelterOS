"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

const services = [
  {
    id: "foundry",
    name: "The Foundry",
    description: "Mission control for your AI agents. Monitor, deploy, and manage at scale.",
    icon: "🔥",
    href: "/foundry",
    color: "#FF4D00",
    status: "active",
  },
  {
    id: "avva-noon",
    name: "AVVA NOON",
    description: "The Brain. Orchestrates multi-agent workflows with intelligent reasoning.",
    icon: "🧠",
    href: "/avva-noon",
    color: "#00C2B2",
    status: "active",
  },
  {
    id: "acheevy",
    name: "ACHEEVY",
    description: "The Executor. Deploys tasks and manages integrations across platforms.",
    icon: "🤖",
    href: "/dashboard",
    color: "#FF8C00",
    status: "active",
  },
  {
    id: "chicken-hawk",
    name: "Chicken Hawk",
    description: "Autonomous coding agent. Writes, tests, and deploys code independently.",
    icon: "🐔",
    href: "/chickenhawk",
    color: "#22C55E",
    status: "beta",
  },
  {
    id: "circuit",
    name: "Circuit Box",
    description: "Visual workflow builder. Connect agents and build automation pipelines.",
    icon: "⚡",
    href: "/circuit",
    color: "#8B5CF6",
    status: "active",
  },
  {
    id: "guild",
    name: "The Guild",
    description: "Agent marketplace. Discover, share, and deploy community agents.",
    icon: "🏛️",
    href: "/guild",
    color: "#F59E0B",
    status: "coming",
  },
]

const stats = [
  { label: "Agents Active", value: "2,847" },
  { label: "Tasks Completed", value: "1.2M+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Response Time", value: "<50ms" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-foundry-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-molten/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-molten/5 rounded-full blur-[120px]" />
        
        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <span className="text-2xl font-display text-white">SmelterOS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-foundry-400 hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/foundry" className="px-4 py-2 bg-molten text-white rounded-lg hover:bg-molten-highlight transition-colors">
              Launch Foundry
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-7xl font-display font-bold text-white mb-6">
              Intelligence{" "}
              <span className="bg-gradient-to-r from-molten via-molten-highlight to-system-teal bg-clip-text text-transparent">
                Forged
              </span>
            </h1>
            <p className="text-xl text-foundry-300 max-w-2xl mx-auto mb-10">
              The multi-agent operating system for building, deploying, and orchestrating 
              AI agents at scale. Welcome to the future of autonomous intelligence.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link 
                href="/foundry"
                className="px-8 py-4 bg-molten text-white font-semibold rounded-xl hover:bg-molten-highlight transition-all shadow-lg shadow-molten/25"
              >
                Enter The Foundry →
              </Link>
              <Link 
                href="/docs"
                className="px-8 py-4 border border-foundry-700 text-foundry-300 rounded-xl hover:border-foundry-500 hover:text-white transition-all"
              >
                Documentation
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="border-y border-foundry-800 bg-foundry-900/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-display text-molten">{stat.value}</div>
                <div className="text-sm text-foundry-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-display text-white mb-4">The SmelterOS Ecosystem</h2>
          <p className="text-foundry-400 max-w-xl mx-auto">
            A complete suite of tools for building and managing autonomous AI agents.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={service.href}>
                <div 
                  className="group relative p-6 bg-foundry-900/50 border border-foundry-800 rounded-2xl hover:border-opacity-50 transition-all duration-300 h-full"
                  style={{ 
                    '--service-color': service.color,
                  } as React.CSSProperties}
                >
                  {/* Hover Glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                    style={{ 
                      background: `radial-gradient(ellipse at center, ${service.color}10 0%, transparent 70%)` 
                    }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{service.icon}</span>
                      <span 
                        className={`text-xs px-2 py-1 rounded-full ${
                          service.status === 'active' ? 'bg-system-green/20 text-system-green' :
                          service.status === 'beta' ? 'bg-molten/20 text-molten' :
                          'bg-foundry-700 text-foundry-400'
                        }`}
                      >
                        {service.status === 'coming' ? 'Coming Soon' : service.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 
                      className="text-xl font-semibold text-white mb-2 group-hover:text-opacity-90"
                      style={{ color: service.color }}
                    >
                      {service.name}
                    </h3>
                    <p className="text-foundry-400 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-molten/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <h2 className="text-4xl font-display text-white mb-6">
            Ready to Forge Your Agents?
          </h2>
          <p className="text-foundry-400 max-w-xl mx-auto mb-10">
            Join the next generation of AI-powered automation. 
            Build, deploy, and scale intelligent agents with SmelterOS.
          </p>
          <Link 
            href="/foundry"
            className="inline-flex items-center gap-2 px-8 py-4 bg-molten text-white font-semibold rounded-xl hover:bg-molten-highlight transition-all shadow-lg shadow-molten/25"
          >
            <span className="text-2xl">🔥</span>
            Launch The Foundry
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foundry-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <span className="text-lg font-display text-white">SmelterOS</span>
              <span className="text-foundry-500 text-sm">• Intelligence Forged</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-foundry-400">
              <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="/guild" className="hover:text-white transition-colors">Agent Guild</Link>
              <Link href="/governance" className="hover:text-white transition-colors">Governance</Link>
              <a href="https://github.com/smelteros" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-foundry-800 text-center text-sm text-foundry-500">
            © 2026 SmelterOS. All rights reserved. Powered by AVVA NOON, ACHEEVY, and Chicken Hawk.
          </div>
        </div>
      </footer>
    </div>
  )
}
