"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface NixieTubeProps {
  value: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const digitMap: Record<string, string> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ":": ":", ".": ".", "-": "-", " ": " ",
}

export function NixieTube({ value, size = "md", className = "" }: NixieTubeProps) {
  const [isFlickering, setIsFlickering] = useState(false)
  const [prevValue, setPrevValue] = useState(value)

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlickering(true)
      const timer = setTimeout(() => {
        setIsFlickering(false)
        setPrevValue(value)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [value, prevValue])

  const sizeClasses = {
    sm: "w-6 h-10 text-lg",
    md: "w-10 h-16 text-2xl",
    lg: "w-14 h-24 text-4xl",
  }

  const glowIntensity = isFlickering ? "brightness-125" : "brightness-100"

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        ${sizeClasses[size]}
        bg-gradient-to-b from-zinc-900/80 to-zinc-950/90
        border border-zinc-700/50
        rounded-lg
        overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(255,255,255,0.05)",
      }}
    >
      {/* Glass tube effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Tube reflection */}
      <div className="absolute top-0 left-1 right-1 h-1/4 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg" />
      
      {/* Filament glow background */}
      <div 
        className={`absolute inset-0 transition-all duration-100 ${glowIntensity}`}
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,77,0,0.3) 0%, transparent 70%)",
        }}
      />

      {/* The digit */}
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ 
            opacity: isFlickering ? [1, 0.6, 1, 0.8, 1] : 1,
            scale: 1,
            filter: isFlickering ? ["brightness(1.2)", "brightness(0.8)", "brightness(1.2)"] : "brightness(1)"
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.1 }}
          className="relative z-10 font-mono font-bold"
          style={{
            color: "#FF4D00",
            textShadow: `
              0 0 10px rgba(255,77,0,0.8),
              0 0 20px rgba(255,77,0,0.6),
              0 0 30px rgba(255,77,0,0.4),
              0 0 40px rgba(255,77,0,0.2)
            `,
          }}
        >
          {digitMap[value] ?? value}
        </motion.span>
      </AnimatePresence>

      {/* Internal glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: "linear-gradient(to top, rgba(255,77,0,0.15), transparent)",
        }}
      />
    </div>
  )
}

interface NixieDisplayProps {
  value: string
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function NixieDisplay({ value, label, size = "md", className = "" }: NixieDisplayProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex gap-1">
        {value.split("").map((char, index) => (
          <NixieTube key={`${index}-${char}`} value={char} size={size} />
        ))}
      </div>
      {label && (
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
      )}
    </div>
  )
}

interface SystemTelemetryProps {
  uptime?: { days: number; hours: number; minutes: number; seconds: number }
  agentsActive?: number
  memoryUsage?: number
  className?: string
  compact?: boolean
}

export function SystemTelemetry({
  uptime = { days: 0, hours: 0, minutes: 0, seconds: 0 },
  agentsActive = 0,
  memoryUsage = 0,
  className = "",
  compact = false,
}: SystemTelemetryProps) {
  const [currentTime, setCurrentTime] = useState(uptime)
  const [currentAgents, setCurrentAgents] = useState(agentsActive)
  const [currentMemory, setCurrentMemory] = useState(memoryUsage)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        let { days, hours, minutes, seconds } = prev
        seconds++
        if (seconds >= 60) { seconds = 0; minutes++ }
        if (minutes >= 60) { minutes = 0; hours++ }
        if (hours >= 24) { hours = 0; days++ }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setCurrentAgents(agentsActive)
  }, [agentsActive])

  useEffect(() => {
    setCurrentMemory(memoryUsage)
  }, [memoryUsage])

  const formatNumber = (n: number, digits: number = 2) => 
    n.toString().padStart(digits, "0")

  const uptimeString = `${formatNumber(currentTime.days, 3)}:${formatNumber(currentTime.hours)}:${formatNumber(currentTime.minutes)}:${formatNumber(currentTime.seconds)}`

  if (compact) {
    return (
      <div className={`flex items-center gap-6 text-xs font-mono ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-foundry-500">UPTIME:</span>
          <span className="text-molten">{uptimeString}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foundry-500">AGENTS:</span>
          <span className="text-system-teal">{formatNumber(currentAgents, 2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foundry-500">MEM:</span>
          <span className="text-system-green">{formatNumber(currentMemory, 2)}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap justify-center gap-8 ${className}`}>
      <NixieDisplay 
        value={uptimeString} 
        label="System Uptime" 
        size="sm"
      />
      <NixieDisplay 
        value={formatNumber(currentAgents, 2)} 
        label="Agents Active" 
        size="md"
      />
      <NixieDisplay 
        value={`${formatNumber(currentMemory, 3)}%`} 
        label="Memory Usage" 
        size="sm"
      />
    </div>
  )
}

export default NixieTube
