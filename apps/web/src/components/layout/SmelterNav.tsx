"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"

interface NavItem {
  href: string
  label: string
  icon?: string
  variant?: "smelter" | "system" | "foundry"
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/foundry", label: "Foundry", icon: "🔥", variant: "smelter" },
  { href: "/console", label: "Console", icon: "💻", variant: "foundry" },
  { href: "/circuit", label: "Circuit", icon: "⚙️", variant: "system" },
  { href: "/avva-noon", label: "AVVA", icon: "🧠", variant: "system" },
  { href: "/chickenhawk", label: "Hawk", icon: "🦅", variant: "foundry" },
]

interface SmelterNavProps {
  title?: string
  subtitle?: string
  status?: "optimal" | "processing" | "critical"
  statusText?: string
  showNav?: boolean
}

export function SmelterNav({
  title = "SmelterOS",
  subtitle,
  status = "optimal",
  statusText = "SYSTEM OPTIMAL",
  showNav = true,
}: SmelterNavProps) {
  const pathname = usePathname()

  return (
    <header className="bg-foundry-900/80 backdrop-blur-xl border-b border-foundry-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <motion.span 
                className="text-xl font-display text-molten"
                whileHover={{ scale: 1.05 }}
              >
                {title}
              </motion.span>
            </Link>
            {subtitle && (
              <span className="text-foundry-500 font-mono text-sm">/ {subtitle}</span>
            )}
          </div>

          {/* Navigation */}
          {showNav && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? (item.variant || "smelter") : "ghost"}
                      size="sm"
                      className={`font-mono text-xs ${
                        isActive ? "" : "text-foundry-400 hover:text-foundry-50"
                      }`}
                    >
                      {item.icon && <span className="mr-1">{item.icon}</span>}
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge variant={status}>{statusText}</StatusBadge>
          </div>
        </div>
      </div>
    </header>
  )
}

export function SmelterFooter() {
  return (
    <footer className="bg-foundry-900 border-t border-foundry-800 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-foundry-500">
            <span className="font-display text-molten">SmelterOS</span>
            <span>•</span>
            <span className="font-mono">v1.0.0</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-foundry-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-system-green" />
              ORACLE: ONLINE
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-system-teal" />
              ADK: CONNECTED
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-molten" />
              FORGE: READY
            </span>
          </div>

          <div className="text-xs text-foundry-600">
            © 2026 SmelterOS. The AI Foundry.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SmelterNav
