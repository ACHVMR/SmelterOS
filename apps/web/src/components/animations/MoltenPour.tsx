"use client"

import { motion } from "framer-motion"

interface MoltenPourProps {
  className?: string
}

export function MoltenPour({ className = "" }: MoltenPourProps) {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Crucible Container */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-16">
        {/* Crucible Body */}
        <svg viewBox="0 0 100 70" className="w-full h-full">
          <defs>
            <linearGradient id="crucibleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3D2B1F" />
              <stop offset="100%" stopColor="#2A1F15" />
            </linearGradient>
            <linearGradient id="moltenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFB000" />
              <stop offset="50%" stopColor="#FF4D00" />
              <stop offset="100%" stopColor="#E63900" />
            </linearGradient>
            <filter id="moltenGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Crucible Shape */}
          <path
            d="M15 10 Q10 10 10 20 L15 60 Q15 65 25 65 L75 65 Q85 65 85 60 L90 20 Q90 10 85 10 Z"
            fill="url(#crucibleGradient)"
            stroke="#4A3628"
            strokeWidth="2"
          />
          
          {/* Inner Molten Pool */}
          <ellipse
            cx="50"
            cy="35"
            rx="30"
            ry="15"
            fill="url(#moltenGradient)"
            filter="url(#moltenGlow)"
          >
            <animate
              attributeName="ry"
              values="15;13;15"
              dur="2s"
              repeatCount="indefinite"
            />
          </ellipse>
        </svg>
      </div>

      {/* Pouring Stream */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-16 w-3"
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: [0, 200, 250, 200],
          opacity: [0, 1, 1, 0.9]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: "linear-gradient(180deg, #FFB000 0%, #FF4D00 40%, #E63900 100%)",
            boxShadow: "0 0 20px rgba(255, 77, 0, 0.6), 0 0 40px rgba(255, 176, 0, 0.3)",
          }}
        />
      </motion.div>

      {/* Splash Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-24 left-1/2 w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? "#FF4D00" : "#FFB000",
            boxShadow: "0 0 8px rgba(255, 77, 0, 0.8)",
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 0,
            scale: 0
          }}
          animate={{
            x: [(i - 2.5) * 15, (i - 2.5) * 25],
            y: [0, -30, 10],
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Heat Radiance at Bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(255, 77, 0, 0.15) 0%, transparent 70%)"
        }}
      />
    </div>
  )
}

interface MoltenPourContainedProps {
  children: React.ReactNode
  showAnimation?: boolean
  className?: string
}

export function MoltenPourContainer({ 
  children, 
  showAnimation = true,
  className = "" 
}: MoltenPourContainedProps) {
  return (
    <div className={`relative ${className}`}>
      {showAnimation && <MoltenPour />}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
