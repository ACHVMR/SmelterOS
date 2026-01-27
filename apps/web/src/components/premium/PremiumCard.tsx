import React from "react";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass";
  title?: string;
  icon?: React.ReactNode;
}

export function PremiumCard({ 
  className, 
  variant = "default", 
  title, 
  icon,
  children, 
  ...props 
}: PremiumCardProps) {
  return (
    <div 
      className={cn(
        variant === "glass" ? "premium-glass" : "premium-card",
        "relative",
        className
      )}
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[rgba(255,255,255,0.02)] to-transparent">
          {icon && (
            <div className="text-[var(--terminal-green)] drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-sm font-bold tracking-wider uppercase text-[var(--text-secondary)] font-mono">
              {title}
            </h3>
          )}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}
