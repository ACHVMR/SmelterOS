"use client";

import React, { useState } from "react";
import { CapabilityButton } from "./components/CapabilityButton";
import { StatusPanel } from "./components/StatusPanel";

interface ModuleStatus {
  name: string;
  status: "ready" | "loading" | "error" | "offline";
  port?: number;
}

const CAPABILITY_CATEGORIES = {
  "Agent Orchestration": [
    { id: "ii-agent", label: "Launch ii-agent Workspace", icon: "🤖", description: "Full-stack web dev with NeonDB/Vercel" },
    { id: "commonground", label: "Activate Multi-Agent Mesh", icon: "🕸️", description: "CommonGround team collaboration" },
    { id: "agent-zero", label: "Deploy Agent-Zero Container", icon: "🐳", description: "Docker sandbox per task" },
  ],
  "Research & Intelligence": [
    { id: "ii-researcher", label: "Deep Research Mode", icon: "🔬", description: "ii-researcher with BAML web search" },
    { id: "chronicle", label: "Timeline Chronicle", icon: "📜", description: "Common_Chronicle structured context" },
    { id: "ii-commons", label: "Data Embedding Engine", icon: "💎", description: "II-Commons RAG pipelines" },
  ],
  "Code Generation": [
    { id: "codex", label: "Codex Terminal", icon: "⚡", description: "Rust-based lightweight coding agent" },
    { id: "browser-auto", label: "Browser Automation", icon: "🌐", description: "ii-agent web interaction capabilities" },
    { id: "file-ops", label: "File System Ops", icon: "📁", description: "Intelligent code editing" },
  ],
  "Presentation & Content": [
    { id: "pptist", label: "PPTist Slides", icon: "📊", description: "AI-powered presentation builder" },
    { id: "revealjs", label: "reveal.js Export", icon: "🎬", description: "HTML presentation framework" },
    { id: "content-gen", label: "Content Generator", icon: "✍️", description: "Blog/article drafting" },
  ],
  "LLM Integrations": [
    { id: "gemini-cli", label: "Gemini CLI", icon: "💫", description: "Direct terminal access to Gemini" },
    { id: "litellm", label: "LiteLLM Proxy", icon: "🔀", description: "100+ LLM API gateway" },
    { id: "model-switch", label: "Model Switcher", icon: "🎛️", description: "Claude/GPT/Gemini selection" },
  ],
  "Advanced Features": [
    { id: "cot-lab", label: "CoT Lab", icon: "🧠", description: "Chain-of-Thought cognitive alignment" },
    { id: "ii-thought", label: "ii-thought RL Dataset", icon: "📈", description: "Reinforcement learning training" },
    { id: "verl", label: "VERL Training", icon: "🌋", description: "Volcano Engine RL for LLMs" },
  ],
};

export default function ChickenHawkLauncher() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, ModuleStatus>>({
    "agent-zero": { name: "Agent Zero", status: "ready", port: 50001 },
    "ii-agent": { name: "II-Agent", status: "ready", port: 8091 },
    "codex": { name: "Codex", status: "ready", port: 8092 },
    "oracle": { name: "Oracle Gateway", status: "ready", port: 8090 },
  });

  const handleCapabilityClick = async (capabilityId: string) => {
    setActiveModule(capabilityId);
    // Route to the appropriate handler based on capability
    console.log(`Activating capability: ${capabilityId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#0a1a1a] to-[#0a0a1a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-cyan-400 to-green-500 rounded-lg flex items-center justify-center text-2xl">
            🦅
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Chicken Hawk Mode
            </h1>
            <p className="text-sm text-gray-400">SmelterOS Agentic Development Environment</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusPanel statuses={Object.values(moduleStatuses)} />
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
            ⌘K Command Palette
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(CAPABILITY_CATEGORIES).map(([category, capabilities]) => (
            <div key={category} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-4 text-white/80">{category}</h2>
              <div className="space-y-3">
                {capabilities.map((cap) => (
                  <CapabilityButton
                    key={cap.id}
                    icon={cap.icon}
                    label={cap.label}
                    description={cap.description}
                    moduleId={cap.id}
                    status={moduleStatuses[cap.id]?.status || "offline"}
                    isActive={activeModule === cap.id}
                    onClick={() => handleCapabilityClick(cap.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* A2UI Viewport */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white/80">A2UI Dynamic Interface Viewport</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Rendering
            </div>
          </div>
          <div className="min-h-[300px] bg-black/30 rounded-xl border border-white/5 flex items-center justify-center">
            {activeModule ? (
              <div className="text-center">
                <div className="text-4xl mb-4">
                  {CAPABILITY_CATEGORIES[Object.keys(CAPABILITY_CATEGORIES).find(k => 
                    CAPABILITY_CATEGORIES[k as keyof typeof CAPABILITY_CATEGORIES].some(c => c.id === activeModule)
                  ) as keyof typeof CAPABILITY_CATEGORIES]?.find(c => c.id === activeModule)?.icon}
                </div>
                <p className="text-lg text-white/60">
                  {activeModule} interface loading...
                </p>
                <p className="text-sm text-gray-500 mt-2">A2UI components will render here</p>
              </div>
            ) : (
              <p className="text-gray-500">Select a capability to launch the A2UI interface</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
