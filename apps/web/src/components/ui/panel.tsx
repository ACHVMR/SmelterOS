import * as React from "react"
import { cn } from "@/lib/utils"

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle"
  title?: string
  children: React.ReactNode
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = "default", title, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-[rgb(var(--bg-card))] border-[rgb(var(--border-default))]",
      elevated: "bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-subtle))]",
      subtle: "bg-[rgb(var(--bg-secondary))] border-[rgb(var(--border-subtle))]"
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] border",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {title && (
          <div className="border-b border-[rgb(var(--border-subtle))] px-6 py-4">
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {title}
            </h3>
          </div>
        )}
        <div className={cn(title ? "p-6" : "")}>
          {children}
        </div>
      </div>
    )
  }
)
Panel.displayName = "Panel"

export { Panel }
