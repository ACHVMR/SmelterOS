"use client"

import { motion } from "framer-motion"

const steps = [
  {
    id: "smelt",
    title: "SMELT",
    icon: "🔥",
    description: "Ingest raw data, ideas, and requirements. Break down complexity into processable ingots.",
    color: "var(--molten-deep)"
  },
  {
    id: "refine",
    title: "REFINE",
    icon: "⚗️",
    description: "Apply AI intelligence to purify and enhance. Shape raw material into refined algorithms.",
    color: "var(--molten-core)"
  },
  {
    id: "deploy",
    title: "DEPLOY",
    icon: "🚀",
    description: "Launch production-ready AI agents. Battle-tested, optimized, and ready for scale.",
    color: "var(--molten-hot)"
  }
]

interface ForgeProcessProps {
  className?: string
}

export function ForgeProcess({ className = "" }: ForgeProcessProps) {
  return (
    <section className={`relative py-32 px-6 overflow-hidden ${className}`}>
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(255,77,0,0.02)] to-transparent pointer-events-none" />
      
      {/* Section header */}
      <motion.div
        className="text-center mb-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
          <span className="text-white">THE FORGE </span>
          <span className="text-gradient-molten">PROCESS</span>
        </h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          From raw concept to production-ready intelligence in three powerful stages.
        </p>
      </motion.div>

      {/* Process steps */}
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[var(--molten-deep)] via-[var(--molten-core)] to-[var(--molten-hot)] opacity-30" />
          
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              {/* Step card */}
              <div className="card-foundry p-8 text-center relative z-10">
                {/* Step number */}
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display"
                  style={{ 
                    background: `linear-gradient(135deg, ${step.color}, var(--foundry-800))`,
                    border: `1px solid ${step.color}`,
                    boxShadow: `0 0 20px ${step.color}40`
                  }}
                >
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="text-5xl mb-6 mt-4">{step.icon}</div>

                {/* Title */}
                <h3 
                  className="text-2xl font-bold font-display mb-4"
                  style={{ color: step.color }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow connector (mobile) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <svg className="w-6 h-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
