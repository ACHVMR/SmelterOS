"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

interface Product {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  href: string
  color: string
  glowClass: string
  logo?: string
}

const products: Product[] = [
  {
    id: "chickenhawk",
    name: "CHICKEN HAWK",
    icon: "🦅",
    tagline: "Autonomous Operations Framework",
    description: "Battle-tested autonomous agent architecture for enterprise-grade AI operations. Execute complex workflows with military precision.",
    href: "/chickenhawk",
    color: "#DC2626",
    glowClass: "card-product-chickenhawk",
    logo: "/chickenhawk-logo.png"
  },
  {
    id: "avva-noon",
    name: "AVVA NOON",
    icon: "🧠",
    tagline: "AI Consciousness Engine",
    description: "The neural core powering intelligent decision-making. V.I.B.E. alignment and quint-modal sensory processing.",
    href: "/avva-noon",
    color: "#00C2B2",
    glowClass: "card-product-avva"
  },
  {
    id: "adk-agents",
    name: "ADK AGENTS",
    icon: "⚙️",
    tagline: "Agent Development Kit",
    description: "Build, deploy, and orchestrate AI agents at scale. 17 specialized Boomer_Ang agents ready for deployment.",
    href: "/foundry",
    color: "#22C55E",
    glowClass: "card-product-adk"
  }
]

interface ProductShowcaseProps {
  className?: string
}

export function ProductShowcase({ className = "" }: ProductShowcaseProps) {
  return (
    <section id="products" className={`relative py-32 px-6 ${className}`}>
      {/* Section header */}
      <motion.div
        className="text-center mb-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className="badge-forged mb-6 inline-block">Forged by SmelterOS</span>
        <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
          <span className="text-white">FORGED </span>
          <span className="text-gradient-molten">CREATIONS</span>
        </h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Intelligent systems born from the foundry. Each product carries the SmelterOS signature of excellence.
        </p>
      </motion.div>

      {/* Product grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
          >
            <Link href={product.href}>
              <div className={`card-foundry ${product.glowClass} p-8 h-full cursor-pointer group`}>
                {/* Product icon/logo */}
                <div className="flex items-center gap-4 mb-6">
                  {product.logo ? (
                    <div className="relative w-12 h-12">
                      <Image
                        src={product.logo}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-4xl">{product.icon}</span>
                  )}
                  
                  {/* Status indicator */}
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="status-dot" style={{ background: product.color, boxShadow: `0 0 10px ${product.color}` }} />
                    <span className="text-xs font-mono text-zinc-500">ACTIVE</span>
                  </div>
                </div>

                {/* Product name */}
                <h3 
                  className="text-xl font-bold font-display mb-2 transition-colors"
                  style={{ color: product.color }}
                >
                  {product.name}
                </h3>

                {/* Tagline */}
                <p className="text-sm text-zinc-400 font-mono mb-4">
                  {product.tagline}
                </p>

                {/* Description */}
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Forged badge */}
                <div className="flex items-center justify-between">
                  <span className="badge-forged text-[9px]">
                    FORGED BY SMELTEROS
                  </span>
                  
                  {/* Arrow */}
                  <svg 
                    className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-all group-hover:translate-x-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
