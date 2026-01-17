"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

interface FoundryHeroProps {
  className?: string
}

export function FoundryHero({ className = "" }: FoundryHeroProps) {
  return (
    <section className={`relative min-h-screen flex flex-col items-center justify-center px-6 ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-ambient-glow pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none" />
      
      {/* Logo with animated glow ring */}
      <motion.div
        className="relative mb-12"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Outer rotating ring */}
        <div className="glow-ring-outer" />
        
        {/* Pulsing glow */}
        <div className="glow-ring" />
        
        {/* Logo */}
        <div className="relative w-40 h-40 md:w-56 md:h-56">
          <Image
            src="/smelteros-logo.jpg"
            alt="SmelterOS"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
      </motion.div>

      {/* Main headline */}
      <motion.h1
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-6 font-display tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span className="text-gradient-molten glitch-reveal">THE AI FOUNDRY</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-lg md:text-xl text-zinc-400 text-center max-w-xl mb-12 font-body"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        Where raw ideas are smelted into intelligent systems. 
        <br className="hidden md:block" />
        Forge. Refine. Deploy.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Link href="/foundry">
          <button className="btn-molten group">
            <span className="flex items-center gap-2">
              ENTER FOUNDRY
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </Link>
        
        <Link href="#products">
          <button className="btn-ghost">
            VIEW PRODUCTS
          </button>
        </Link>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border border-zinc-700 flex items-start justify-center p-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-molten-core" style={{ background: 'var(--molten-core)' }} />
        </motion.div>
      </motion.div>
    </section>
  )
}
