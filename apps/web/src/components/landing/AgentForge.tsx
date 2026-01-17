"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

type AgentType = "researcher" | "coder" | "writer" | "executor" | "custom"
type ModelType = "gemini-2.0-flash" | "claude-3-5-sonnet" | "gpt-4o"

interface AgentConfig {
  type: AgentType
  model: ModelType
  prompt: string
}

const agentTypes: { id: AgentType; label: string; icon: string; description: string }[] = [
  { id: "researcher", label: "Researcher", icon: "🔍", description: "Deep web research & analysis" },
  { id: "coder", label: "Coder", icon: "💻", description: "Software development & debugging" },
  { id: "writer", label: "Writer", icon: "✍️", description: "Content creation & documentation" },
  { id: "executor", label: "Executor", icon: "⚡", description: "Task execution & automation" },
  { id: "custom", label: "Custom", icon: "🎯", description: "Define your own agent type" },
]

const models: { id: ModelType; label: string; provider: string }[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google" },
  { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
]

interface AgentForgeProps {
  className?: string
}

export function AgentForge({ className = "" }: AgentForgeProps) {
  const [config, setConfig] = useState<AgentConfig>({
    type: "researcher",
    model: "gemini-2.0-flash",
    prompt: "",
  })
  const [isForging, setIsForging] = useState(false)
  const [forgedAgent, setForgedAgent] = useState<{ name: string; id: string } | null>(null)

  const handleForge = async () => {
    if (!config.prompt.trim()) return
    
    setIsForging(true)
    
    // Simulate forging process (would call API in production)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const agentName = `boomerang_${config.type}_${Date.now().toString(36)}`
    setForgedAgent({ name: agentName, id: `agent_${Date.now()}` })
    setIsForging(false)
  }

  return (
    <section id="forge" className={`relative py-32 px-6 ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(255,77,0,0.03)] to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-forged mb-6 inline-block">Prompt-to-Agent</span>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            <span className="text-white">FORGE A </span>
            <span className="text-gradient-molten">BOOMER_ANG</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Spin up specialized AI agents in real-time. Describe what you need, and SmelterOS will forge it.
          </p>
        </motion.div>

        {/* Forge Interface */}
        <motion.div
          className="card-foundry p-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Agent Type Selection */}
          <div className="mb-8">
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
              Agent Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {agentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setConfig(c => ({ ...c, type: type.id }))}
                  className={`p-4 rounded-xl border transition-all text-center ${
                    config.type === type.id
                      ? "border-[var(--molten-core)] bg-[rgba(255,77,0,0.1)]"
                      : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-border-hover)]"
                  }`}
                >
                  <span className="text-2xl block mb-2">{type.icon}</span>
                  <span className="text-xs font-mono text-zinc-300">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="mb-8">
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
              Model
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setConfig(c => ({ ...c, model: model.id }))}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    config.model === model.id
                      ? "border-[var(--system-teal)] bg-[rgba(0,194,178,0.1)]"
                      : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-border-hover)]"
                  }`}
                >
                  <span className="text-sm font-medium text-zinc-200">{model.label}</span>
                  <span className="text-xs text-zinc-500 block mt-1">{model.provider}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-8">
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
              Agent Mission
            </label>
            <textarea
              value={config.prompt}
              onChange={(e) => setConfig(c => ({ ...c, prompt: e.target.value }))}
              placeholder="Describe what this Boomer_Ang should do... (e.g., 'Research competitor pricing strategies and summarize findings')"
              className="w-full h-32 px-4 py-3 bg-[var(--foundry-800)] border border-[var(--glass-border)] rounded-xl text-zinc-200 placeholder-zinc-600 resize-none focus:border-[var(--molten-core)] focus:outline-none transition-colors"
            />
          </div>

          {/* Forge Button */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-mono">
              <span className="text-[var(--system-teal)]">ADK</span> • 
              <span className="text-[var(--molten-core)]"> Vertex AI</span> • 
              <span className="text-[var(--system-green)]"> A2A</span>
            </div>
            
            <button
              onClick={handleForge}
              disabled={!config.prompt.trim() || isForging}
              className={`btn-molten ${!config.prompt.trim() || isForging ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="flex items-center gap-2">
                {isForging ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    FORGING...
                  </>
                ) : (
                  <>
                    🔥 FORGE BOOMER_ANG
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {forgedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 p-4 bg-[rgba(34,197,94,0.1)] border border-[var(--system-green)] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="status-dot status-dot-green" />
                  <div>
                    <p className="text-sm font-medium text-[var(--system-green)]">
                      Boomer_Ang Forged Successfully!
                    </p>
                    <p className="text-xs text-zinc-400 font-mono mt-1">
                      {forgedAgent.name} • {forgedAgent.id}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <InfoCard
            icon="🧠"
            title="AVVA NOON Aligned"
            description="Every agent is validated through V.I.B.E. alignment before deployment."
          />
          <InfoCard
            icon="⚡"
            title="ACHEEVY Orchestrated"
            description="The orchestrator ensures agents work together seamlessly."
          />
          <InfoCard
            icon="🪃"
            title="Always Returns"
            description="Boomer_Angs always come back with results, never lost in the void."
          />
        </div>
      </div>
    </section>
  )
}

function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card-foundry p-6 text-center">
      <span className="text-3xl block mb-3">{icon}</span>
      <h4 className="text-sm font-bold font-display text-zinc-200 mb-2">{title}</h4>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  )
}
