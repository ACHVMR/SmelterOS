"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"

export function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-foundry-950 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-molten">
            SmelterOS Design System
          </h1>
          <p className="text-foundry-400 text-lg">
            Molten Professionalism • Contextual Coding • Brand Consistency
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foundry-50">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-molten-gradient" />
              <p className="text-sm text-foundry-300">Molten Gradient</p>
              <p className="text-xs text-foundry-500">#FF4D00 → #FFB000</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-system-gradient" />
              <p className="text-sm text-foundry-300">System Gradient</p>
              <p className="text-xs text-foundry-500">#00C2B2 → #32CD32</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-ingot-gradient" />
              <p className="text-sm text-foundry-300">Ingot Bronze</p>
              <p className="text-xs text-foundry-500">#3D2B1F → #4A3628</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-foundry-800 border border-foundry-700" />
              <p className="text-sm text-foundry-300">Foundry Surface</p>
              <p className="text-xs text-foundry-500">#27272A</p>
            </div>
          </div>
        </section>

        {/* Button Variants */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foundry-50">Button Variants</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="smelter" size="lg">Forge</Button>
            <Button variant="system" size="lg">Activate</Button>
            <Button variant="ingot" size="lg">Process</Button>
            <Button variant="foundry" size="lg">Configure</Button>
            <Button variant="smelter" size="default">Create</Button>
            <Button variant="system" size="default">Run</Button>
            <Button variant="smelter" size="sm">Submit</Button>
            <Button variant="system" size="sm">Check</Button>
          </div>
          <div className="bg-foundry-900 p-4 rounded-lg border border-foundry-800">
            <p className="text-sm text-foundry-400">
              <span className="text-molten">Smelter buttons</span> for creation/processing actions (Forge, Create, Submit) <br/>
              <span className="text-system-teal">System buttons</span> for navigation/logic actions (Activate, Run, Check)
            </p>
          </div>
        </section>

        {/* Status Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foundry-50">Status Badges</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <StatusBadge variant="optimal">OPTIMAL</StatusBadge>
            <StatusBadge variant="processing">PROCESSING</StatusBadge>
            <StatusBadge variant="critical">CRITICAL</StatusBadge>
            <StatusBadge variant="warning">WARNING</StatusBadge>
            <StatusBadge variant="inactive">INACTIVE</StatusBadge>
            <StatusBadge variant="system">SYSTEM</StatusBadge>
          </div>
        </section>

        {/* Card Variants */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foundry-50">Card Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="smelter" className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-foundry-50">Smelter Module</CardTitle>
                <CardDescription className="text-foundry-400">
                  For forging, processing, alchemy
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-foundry-300">Hover for orange glow</p>
              </CardContent>
            </Card>

            <Card variant="os" className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-foundry-50">OS Module</CardTitle>
                <CardDescription className="text-foundry-400">
                  For AI agents, system, logic
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-foundry-300">Hover for teal glow</p>
              </CardContent>
            </Card>

            <Card variant="ingot" className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-foundry-50">Ingot Card</CardTitle>
                <CardDescription className="text-foundry-400">
                  For historical logs, inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-foundry-300">3D bronze effect</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foundry-50">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-display text-molten">
              Display Header (Space Grotesk)
            </h1>
            <h2 className="text-2xl font-semibold text-system-teal">
              System Header
            </h2>
            <p className="text-foundry-300 font-sans">
              Body text using Inter. The quick brown fox jumps over the lazy dog.
            </p>
            <code className="text-sm font-mono text-foundry-400 bg-foundry-900 px-2 py-1 rounded">
              Monospace code (JetBrains Mono)
            </code>
          </div>
        </section>

        {/* Animations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foundry-50">Animations</h2>
          <div className="flex gap-8 items-center">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 rounded-lg bg-molten-gradient animate-molten-drip" />
              <p className="text-xs text-foundry-400">molten-drip</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 rounded-lg bg-system-gradient animate-system-pulse" />
              <p className="text-xs text-foundry-400">system-pulse</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 rounded-lg bg-molten-deep animate-pulse-heat" />
              <p className="text-xs text-foundry-400">pulse-heat</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DesignSystemShowcase
