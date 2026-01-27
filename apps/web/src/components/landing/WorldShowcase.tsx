"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

interface WorldAsset {
  id: string
  name: string
  description: string
  thumbnail: string
  panorama?: string
  type: "foundry" | "agent" | "environment"
}

const worldAssets: WorldAsset[] = [
  {
    id: "smelter-foundry",
    name: "SmelterOS Foundry",
    description: "Industrial smelting foundry with molten metal channels and dramatic lighting",
    thumbnail: "/assets/world-labs/smelter-foundry-thumb.webp",
    panorama: "/assets/world-labs/smelter-foundry-pano.png",
    type: "foundry",
  },
  {
    id: "chicken-hawk",
    name: "Chicken Hawk Coding",
    description: "Cyberpunk tech lab with an anthropomorphic hawk at a holographic workstation",
    thumbnail: "/assets/world-labs/chicken-hawk-thumb.webp",
    type: "agent",
  },
  {
    id: "mystical-forest",
    name: "Mystical Forest",
    description: "Ethereal forest with bioluminescent mushrooms and glowing foliage",
    thumbnail: "/assets/world-labs/mystical-forest-thumb.webp",
    type: "environment",
  },
]

const typeLabels = {
  foundry: { label: "FOUNDRY", color: "var(--molten-core)" },
  agent: { label: "AGENT", color: "var(--system-teal)" },
  environment: { label: "ENVIRONMENT", color: "var(--system-green)" },
}

interface WorldShowcaseProps {
  className?: string
}

export function WorldShowcase({ className = "" }: WorldShowcaseProps) {
  const [selectedWorld, setSelectedWorld] = useState<WorldAsset | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section id="worlds" className={`relative py-24 px-6 ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,194,178,0.02)] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-[var(--system-teal)] bg-[rgba(0,194,178,0.1)] border border-[var(--system-teal)] rounded-full mb-6 inline-block">
            3D Gaussian Splats
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            <span className="text-white">IMMERSIVE </span>
            <span className="text-gradient-molten">WORLDS</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            AI-generated 3D environments powered by World Labs. Each world is a fully navigable Gaussian splat scene.
          </p>
        </motion.div>

        {/* World Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {worldAssets.map((world, index) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group cursor-pointer"
              onClick={() => {
                setSelectedWorld(world)
                setIsExpanded(true)
              }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] transition-all duration-300 group-hover:border-[var(--molten-core)] group-hover:shadow-[0_0_30px_rgba(255,77,0,0.2)]">
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={world.thumbnail}
                    alt={world.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--foundry-900)] via-transparent to-transparent opacity-80" />
                  
                  {/* Type badge */}
                  <div 
                    className="absolute top-4 left-4 px-2 py-1 text-xs font-mono uppercase tracking-wider rounded"
                    style={{ 
                      backgroundColor: `${typeLabels[world.type].color}20`,
                      color: typeLabels[world.type].color,
                      border: `1px solid ${typeLabels[world.type].color}40`
                    }}
                  >
                    {typeLabels[world.type].label}
                  </div>

                  {/* View indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-4 py-2 bg-[var(--foundry-900)]/90 rounded-full border border-[var(--molten-core)] text-sm font-mono text-[var(--molten-core)]">
                      🔍 VIEW WORLD
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold font-display text-zinc-100 mb-2">{world.name}</h3>
                  <p className="text-sm text-zinc-500 line-clamp-2">{world.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Expanded View Modal */}
        {isExpanded && selectedWorld && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full bg-[var(--foundry-900)] rounded-2xl border border-[var(--glass-border)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--foundry-800)] border border-[var(--glass-border)] text-zinc-400 hover:text-white hover:border-[var(--molten-core)] transition-colors"
              >
                ✕
              </button>

              {/* Image */}
              <div className="aspect-video relative">
                <Image
                  src={selectedWorld.panorama || selectedWorld.thumbnail}
                  alt={selectedWorld.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Details */}
              <div className="p-8">
                <div 
                  className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider rounded mb-4"
                  style={{ 
                    backgroundColor: `${typeLabels[selectedWorld.type].color}20`,
                    color: typeLabels[selectedWorld.type].color,
                    border: `1px solid ${typeLabels[selectedWorld.type].color}40`
                  }}
                >
                  {typeLabels[selectedWorld.type].label}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold font-display text-white mb-4">{selectedWorld.name}</h3>
                <p className="text-zinc-400 mb-6">{selectedWorld.description}</p>
                
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--system-green)]" />
                    World Labs API
                  </span>
                  <span>•</span>
                  <span>3D Gaussian Splat</span>
                  <span>•</span>
                  <span>Marble 0.1</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Tech badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <TechBadge icon="🌍" label="World Labs" />
          <TechBadge icon="🔮" label="Gaussian Splats" />
          <TechBadge icon="🎬" label="Marble API" />
          <TechBadge icon="⚡" label="Real-time 3D" />
        </motion.div>
      </div>
    </section>
  )
}

function TechBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-xs font-mono text-zinc-400">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

export default WorldShowcase
