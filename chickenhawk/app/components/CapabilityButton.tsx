"use client";

import React from "react";

interface CapabilityButtonProps {
  icon: string;
  label: string;
  description: string;
  moduleId: string;
  status: "ready" | "loading" | "error" | "offline";
  isActive: boolean;
  onClick: () => void;
}

export function CapabilityButton({
  icon,
  label,
  description,
  moduleId,
  status,
  isActive,
  onClick,
}: CapabilityButtonProps) {
  const statusColors = {
    ready: "bg-green-500",
    loading: "bg-amber-500 animate-pulse",
    error: "bg-red-500",
    offline: "bg-gray-500",
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200
        ${isActive 
          ? "bg-gradient-to-r from-orange-500/20 via-cyan-500/20 to-green-500/20 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20" 
          : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
        }
      `}
    >
      {/* Status LED */}
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
        {status === "ready" && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${statusColors[status]} animate-ping opacity-50`} />
        )}
      </div>

      {/* Icon */}
      <div className="text-2xl">{icon}</div>

      {/* Content */}
      <div className="flex-1 text-left">
        <h3 className="font-medium text-white/90">{label}</h3>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>

      {/* Module Badge */}
      <span className="px-2 py-1 text-xs bg-white/5 rounded-md text-gray-400 font-mono">
        {moduleId}
      </span>

      {/* Arrow */}
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
