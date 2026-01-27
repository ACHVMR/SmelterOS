import React from "react";
import { cn } from "@/lib/utils";

interface MetricProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: "green" | "orange" | "cyan" | "purple";
  className?: string;
}

export function MetricProgress({ 
  value, 
  max = 100, 
  label, 
  showValue = true,
  color = "green",
  className 
}: MetricProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const getColorVar = () => {
    switch (color) {
      case "green": return "var(--terminal-green)";
      case "orange": return "var(--molten-orange)";
      case "cyan": return "var(--smelter-cyan)";
      case "purple": return "var(--electric-purple)";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-end mb-2">
          {label && (
            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider font-mono">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-bold font-mono" style={{ color: getColorVar() }}>
              {value}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full bg-[var(--bg-surface-3)] rounded-full overflow-hidden border border-[var(--border-subtle)] relative">
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: "linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.5) 50%)",
            backgroundSize: "4px 100%" 
          }} 
        />
        
        {/* Active Bar */}
        <div 
          className="h-full relative transition-all duration-500 ease-out"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getColorVar(),
            boxShadow: `0 0 10px ${getColorVar()}`
          }}
        >
          {/* Shimmer Effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            style={{ 
              animation: "shimmer 2s infinite linear",
              backgroundSize: "200% 100%" 
            }} 
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
