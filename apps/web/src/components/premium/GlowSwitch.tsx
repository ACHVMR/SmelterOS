import React from "react";
import { cn } from "@/lib/utils";

interface GlowSwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function GlowSwitch({ checked, onChange, label, className }: GlowSwitchProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked ? "true" : "false"}
        aria-label={label || "Toggle switch"}
        title={label || "Toggle switch"}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative h-7 w-12 cursor-pointer rounded-full border transition-all duration-300 ease-in-out focus:outline-none",
          checked 
            ? "border-[var(--terminal-green)] bg-[rgba(0,255,136,0.1)]" 
            : "border-[var(--border-subtle)] bg-[var(--bg-surface-1)]"
        )}
        style={{
          boxShadow: checked ? "var(--glow-green)" : "none"
        }}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-md ring-0 transition duration-300 ease-in-out",
            checked ? "translate-x-6 bg-[var(--terminal-green)]" : "translate-x-1 bg-[var(--text-secondary)]"
          )}
          style={{
            boxShadow: checked ? "0 0 10px var(--terminal-green)" : "none"
          }}
        />
      </button>
    </div>
  );
}
