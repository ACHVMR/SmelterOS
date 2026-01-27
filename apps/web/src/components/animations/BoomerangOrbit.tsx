"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface BoomerangAgent {
  id: string
  name: string
  icon?: ReactNode
  color?: string
  status?: "active" | "idle" | "processing"
}

const defaultAgents: BoomerangAgent[] = [
  { id: "1", name: "ARCHITECT", status: "active" },
  { id: "2", name: "ANALYST", status: "active" },
  { id: "3", name: "BUILDER", status: "processing" },
  { id: "4", name: "DEBUGGER", status: "idle" },
  { id: "5", name: "DESIGNER", status: "active" },
  { id: "6", name: "DEPLOYER", status: "idle" },
  { id: "7", name: "DOCUMENTER", status: "active" },
  { id: "8", name: "GUARDIAN", status: "active" },
  { id: "9", name: "INTEGRATOR", status: "processing" },
  { id: "10", name: "MONITOR", status: "active" },
  { id: "11", name: "OPTIMIZER", status: "idle" },
  { id: "12", name: "PLANNER", status: "active" },
  { id: "13", name: "RESEARCHER", status: "active" },
  { id: "14", name: "REVIEWER", status: "processing" },
  { id: "15", name: "SECURITY", status: "active" },
  { id: "16", name: "TESTER", status: "active" },
  { id: "17", name: "VALIDATOR", status: "idle" },
]

interface BoomerangOrbitProps {
  agents?: BoomerangAgent[]
  radius?: number
  duration?: number
  className?: string
  centerContent?: ReactNode
}

export function BoomerangOrbit({
  agents = defaultAgents,
  radius = 200,
  duration = 30,
  className = "",
  centerContent,
}: BoomerangOrbitProps) {
  const angleStep = (2 * Math.PI) / agents.length

  return (
    <div className={`relative ${className}`} style={{ width: radius * 2 + 100, height: radius * 2 + 100 }}>
      {/* Center content */}
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {centerContent}
        </div>
      )}

      {/* Orbit path visualization */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: "perspective(500px) rotateX(60deg)" }}
      >
        <div 
          className="rounded-full border border-molten/20"
          style={{ 
            width: radius * 2, 
            height: radius * 2,
            boxShadow: "0 0 40px rgba(255,77,0,0.1), inset 0 0 20px rgba(255,77,0,0.05)"
          }}
        />
      </div>

      {/* Orbiting container */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {agents.map((agent, index) => {
          const angle = angleStep * index
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius * 0.4 // Elliptical orbit

          const statusColors = {
            active: "#32CD32",
            processing: "#FFB000",
            idle: "#71717A",
          }

          return (
            <motion.div
              key={agent.id}
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                x: x - 20,
                y: y - 20,
              }}
              whileHover={{ scale: 1.5, zIndex: 50 }}
            >
              {/* Counter-rotate to keep upright */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{
                  duration,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="relative group cursor-pointer">
                  {/* Boomerang icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${statusColors[agent.status || "idle"]}, #1a1a1a)`,
                      boxShadow: `0 0 10px ${statusColors[agent.status || "idle"]}40, 0 0 20px ${statusColors[agent.status || "idle"]}20`,
                      border: `1px solid ${statusColors[agent.status || "idle"]}60`,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/80"
                    >
                      <path d="M3 12c0-3.866 3.582-7 8-7s8 3.134 8 7" />
                      <path d="M19 12c0 3.866-3.582 7-8 7" />
                      <path d="M11 19l-2 2 4-1-2-1z" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Status indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                      agent.status === "processing" ? "animate-pulse" : ""
                    }`}
                    style={{
                      backgroundColor: statusColors[agent.status || "idle"],
                      boxShadow: `0 0 6px ${statusColors[agent.status || "idle"]}`,
                    }}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap">
                      <div className="font-bold text-white">{agent.name}</div>
                      <div className="text-zinc-400 capitalize">{agent.status}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export function BoomerangOrbitCompact({
  agents = defaultAgents.slice(0, 8),
  className = "",
}: {
  agents?: BoomerangAgent[]
  className?: string
}) {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {agents.map((agent) => {
        const statusColors = {
          active: "#32CD32",
          processing: "#FFB000",
          idle: "#71717A",
        }

        return (
          <motion.div
            key={agent.id}
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${statusColors[agent.status || "idle"]}40, #1a1a1a)`,
                boxShadow: `0 0 10px ${statusColors[agent.status || "idle"]}20`,
                border: `1px solid ${statusColors[agent.status || "idle"]}40`,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/60"
              >
                <path d="M3 12c0-3.866 3.582-7 8-7s8 3.134 8 7" />
                <path d="M19 12c0 3.866-3.582 7-8 7" />
                <path d="M11 19l-2 2 4-1-2-1z" fill="currentColor" />
              </svg>
            </div>

            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
                agent.status === "processing" ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor: statusColors[agent.status || "idle"],
                boxShadow: `0 0 4px ${statusColors[agent.status || "idle"]}`,
              }}
            />

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] whitespace-nowrap">
                <div className="font-bold text-white">{agent.name}</div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default BoomerangOrbit
