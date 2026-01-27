"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AnimatedCard({
  children,
  index = 0,
  isActive = false,
  onClick,
  className = "",
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.05,
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        boxShadow: "0 12px 40px rgba(255, 107, 53, 0.2)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative cursor-pointer overflow-hidden
        bg-glass border border-glass-border rounded-xl
        transition-colors duration-300
        ${isActive ? "border-magma bg-glass-glow" : "hover:border-white/20"}
        ${className}
      `}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Glow pulse for active state */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{
            boxShadow: [
              "0 0 20px rgba(255, 107, 53, 0.3)",
              "0 0 40px rgba(255, 107, 53, 0.5)",
              "0 0 20px rgba(255, 107, 53, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
      
      {/* Ripple effect container */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <motion.span
          className="absolute bg-white/10 rounded-full"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: 50, height: 50, left: "50%", top: "50%", marginLeft: -25, marginTop: -25 }}
        />
      </span>
    </motion.div>
  );
}

interface StaggeredGridProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredGrid({
  children,
  className = "",
  staggerDelay = 0.05,
}: StaggeredGridProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 24,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function PulsingOrb({ color = "#ff6b35" }: { color?: string }) {
  return (
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
      style={{ background: color, opacity: 0.15 }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 10 + Math.random() * 20,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-magma/30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
