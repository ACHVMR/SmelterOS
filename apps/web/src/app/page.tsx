"use client"

import { FoundryHero, ProductShowcase, ForgeProcess, SystemTelemetry, AgentForge } from "@/components/landing"

/* ═══════════════════════════════════════════════════════════════════════════
   SMELTEROS LANDING PAGE
   The AI Foundry - Fresh Start
   
   Architecture:
   - SmelterOS = The Platform (The Foundry)
   - ACHEEVY = Orchestrator (couples with AVVA NOON)
   - AVVA NOON = Language Model (keeps agents on track)
   - Chicken Hawk = Autonomous Ops Framework
   - Boomer_Angs = AI Agents created via ADK/UCP
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <div className="relative min-h-screen bg-foundry-deep bg-noise">
      {/* Fixed Header Telemetry */}
      <SystemTelemetry position="header" />

      {/* Hero Section - Full viewport */}
      <FoundryHero />

      {/* Product Showcase - ACHEEVY, AVVA NOON, Chicken Hawk, Boomer_Angs */}
      <ProductShowcase className="bg-[var(--foundry-850)]" />

      {/* Forge Process - SMELT → REFINE → DEPLOY */}
      <ForgeProcess />

      {/* Agent Forge - Prompt-to-Agent Creation */}
      <AgentForge className="bg-[var(--foundry-850)]" />


      {/* Capabilities Section */}
      <section className="relative py-32 px-6 bg-[var(--foundry-850)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              <span className="text-white">FOUNDRY </span>
              <span className="text-gradient-molten">CAPABILITIES</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Enterprise-grade AI infrastructure built for scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CapabilityCard
              icon="🔮"
              title="Multi-Agent Orchestration"
              description="Coordinate complex workflows across 17+ specialized AI agents."
            />
            <CapabilityCard
              icon="⚡"
              title="Real-time Processing"
              description="Sub-second response times with intelligent caching and streaming."
            />
            <CapabilityCard
              icon="🛡️"
              title="Enterprise Security"
              description="SOC2 compliant with end-to-end encryption and audit logging."
            />
            <CapabilityCard
              icon="📊"
              title="Full Observability"
              description="Complete visibility into agent performance and system health."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            <span className="text-white">READY TO </span>
            <span className="text-gradient-molten">FORGE?</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-12 max-w-2xl mx-auto">
            Join the next generation of AI-powered enterprises. Deploy intelligent systems that scale with your ambitions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/foundry">
              <button className="btn-molten">
                <span>START FORGING</span>
              </button>
            </a>
            <a href="/docs">
              <button className="btn-ghost">
                VIEW DOCUMENTATION
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer with padding for fixed status bar */}
      <footer className="py-16 px-6 border-t border-[var(--glass-border)] mb-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-[var(--molten-core)] to-[var(--molten-hot)] flex items-center justify-center font-bold text-black">
                S
              </div>
              <div>
                <div className="font-bold font-display text-lg">SMELTEROS</div>
                <div className="text-xs text-zinc-500">The AI Foundry</div>
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-8 text-sm text-zinc-400">
              <a href="/foundry" className="hover:text-white transition-colors">Foundry</a>
              <a href="/circuit" className="hover:text-white transition-colors">Circuit</a>
              <a href="/avva-noon" className="hover:text-white transition-colors">AVVA NOON</a>
              <a href="/docs" className="hover:text-white transition-colors">Docs</a>
            </div>

            {/* Copyright */}
            <div className="text-xs text-zinc-600">
              © 2026 SmelterOS. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Fixed Footer Telemetry */}
      <SystemTelemetry position="footer" />
    </div>
  )
}

function CapabilityCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card-foundry p-6">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold font-display mb-2 text-white">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}
