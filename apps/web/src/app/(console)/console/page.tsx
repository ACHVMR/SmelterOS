"use client";

import { motion } from "framer-motion";
import { ConsoleTerminal } from "@/components/terminal/console";
import { NixieDisplay } from "@/components/animations/NixieTube";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ConsolePage() {
  return (
    <main className="min-h-screen bg-foundry-950 text-foundry-50 flex flex-col">
      {/* Header */}
      <header className="furnace-header sticky top-0 z-50 backdrop-blur-xl border-b border-molten/20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-molten font-display text-xl hover:text-molten-highlight transition-colors">
              SmelterOS
            </Link>
            <span className="text-foundry-500 font-mono text-sm">/ CONSOLE</span>
          </div>
          
          {/* Nixie Tube Metrics */}
          <motion.div 
            className="hidden md:flex items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-foundry-500">CPU</span>
              <NixieDisplay value="12%" size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-foundry-500">MEM</span>
              <NixieDisplay value="40%" size="sm" />
            </div>
            <StatusBadge variant="optimal">
              <span className="w-1.5 h-1.5 rounded-full bg-foundry-950" />
              CONNECTED
            </StatusBadge>
          </motion.div>

          <div className="flex items-center gap-3">
            <Link href="/foundry">
              <Button variant="foundry" size="sm">Foundry</Button>
            </Link>
            <Link href="/circuit">
              <Button variant="system" size="sm">Circuit Box</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Console Area */}
      <div className="flex-1 p-4 md:p-8 flex flex-col items-center">
        <motion.div 
          className="w-full max-w-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Terminal Container */}
          <div className="relative">
            {/* Terminal glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-molten/20 via-molten-highlight/10 to-molten/20 rounded-xl blur-xl" />
            
            <div className="relative bg-foundry-900 border border-foundry-700 rounded-xl overflow-hidden shadow-2xl">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-4 py-2 bg-foundry-800 border-b border-foundry-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-molten-deep" />
                  <div className="w-3 h-3 rounded-full bg-molten-highlight" />
                  <div className="w-3 h-3 rounded-full bg-system-green" />
                </div>
                <span className="text-xs font-mono text-foundry-400">smelteros://console</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-system-green animate-pulse">● LIVE</span>
                </div>
              </div>

              {/* Console Terminal */}
              <ConsoleTerminal />
            </div>
          </div>

          {/* Quick Command Bar */}
          <motion.div 
            className="mt-6 flex flex-wrap gap-2 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { cmd: "help", label: "HELP" },
              { cmd: "status", label: "STATUS" },
              { cmd: "agents", label: "AGENTS" },
              { cmd: "forge", label: "FORGE" },
              { cmd: "clear", label: "CLEAR" },
            ].map((item) => (
              <Button
                key={item.cmd}
                variant="foundry"
                size="sm"
                className="font-mono text-xs"
              >
                /{item.label}
              </Button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
