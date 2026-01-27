import React from "react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "active" | "inactive" | "warning" | "error" | "info";
  text?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  text, 
  pulse = true,
  className 
}: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case "active": return "var(--status-success)";
      case "warning": return "var(--status-warning)";
      case "error": return "var(--status-error)";
      case "info": return "var(--status-info)";
      default: return "var(--text-secondary)";
    }
  };

  const getGlow = () => {
    switch (status) {
      case "active": return "var(--glow-green)";
      case "warning": return "var(--glow-orange)";
      case "error": return "0 0 10px rgba(239, 68, 68, 0.4)";
      case "info": return "0 0 10px rgba(59, 130, 246, 0.4)";
      default: return "none";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-3 w-3 items-center justify-center">
        {pulse && status !== "inactive" && (
          <span 
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: getStatusColor() }}
          />
        )}
        <span 
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ 
            backgroundColor: getStatusColor(),
            boxShadow: getGlow()
          }}
        />
      </div>
      {text && (
        <span 
          className="text-xs font-medium tracking-wide uppercase font-mono"
          style={{ 
            color: status === "inactive" ? "var(--text-secondary)" : getStatusColor(),
            textShadow: status !== "inactive" ? getGlow() : "none"
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
