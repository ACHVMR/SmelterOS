"use client";

import { GlitchText } from "@/components/ui/glitch-text";
import { TerminalContainer } from "@/components/layout/terminal-container";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-obsidian text-pure-white p-4 relative overflow-hidden">
      {/* Background Matrix/Grid Effect (CSS) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none"></div>
      
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-terminal-green/5 blur-[120px] rounded-full pointer-events-none"></div>

      <TerminalContainer className="w-full max-w-3xl z-10" header="root@smelter-os:~/launch_sequence">
        <div className="flex flex-col gap-6 py-8 px-4 text-center items-center">
          <div className="text-sm font-mono text-terminal-green/70 mb-2">
            SYSTEM BOOT SEQUENCE_
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-2 text-glow">
            <GlitchText text="SMELTER OS" />
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-lg mb-8">
            The Intelligent Agent Foundry. <br />
            <span className="text-terminal-green text-sm mt-2 block opacity-80">
              v2.1.0 // ARCHITECTURE: HYBRID
            </span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left mt-8">
            <div className="border border-terminal-green/20 p-4 bg-black/40 hover:bg-terminal-green/5 transition-colors group">
              <div className="text-terminal-green font-bold text-sm mb-1 group-hover:text-glow">01. ORCHESTRATE</div>
              <div className="text-gray-500 text-xs">Deploy complex agent workflows (Achievy).</div>
            </div>
            <div className="border border-terminal-green/20 p-4 bg-black/40 hover:bg-terminal-green/5 transition-colors group">
              <div className="text-terminal-green font-bold text-sm mb-1 group-hover:text-glow">02. VALIDATE</div>
              <div className="text-gray-500 text-xs">Ethics & Safety alignment (V.I.B.E).</div>
            </div>
            <div className="border border-terminal-green/20 p-4 bg-black/40 hover:bg-terminal-green/5 transition-colors group">
              <div className="text-terminal-green font-bold text-sm mb-1 group-hover:text-glow">03. EXECUTE</div>
              <div className="text-gray-500 text-xs">Sandboxed cloud environments.</div>
            </div>
          </div>

          <Link href="/console">
            <button className="mt-8 px-8 py-3 bg-terminal-green text-black font-bold text-sm hover:bg-white hover:scale-105 transition-all w-fit cursor-pointer">
              INITIALIZE CONSOLE_
            </button>
          </Link>
        </div>
      </TerminalContainer>

      <div className="fixed bottom-4 right-4 text-xs text-gray-600 font-mono">
        STATUS: ONLINE | LATENCY: 12ms
      </div>
    </main>
  );
}
