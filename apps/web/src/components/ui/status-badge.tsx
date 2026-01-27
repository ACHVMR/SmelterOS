import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-semibold px-3 py-1 rounded-full text-xs transition-all",
  {
    variants: {
      variant: {
        optimal: "bg-system-gradient text-foundry-950",
        processing: "bg-molten-gradient text-foundry-950",
        critical: "bg-molten-deep text-foundry-50 animate-pulse-heat",
        warning: "bg-molten-highlight/20 text-molten-highlight border border-molten-highlight/30",
        inactive: "bg-foundry-800 text-foundry-400 border border-foundry-700",
        system: "bg-system-teal/20 text-system-teal border border-system-teal/30",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        default: "text-xs px-3 py-1",
        lg: "text-sm px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "optimal",
      size: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  pulse?: boolean
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, pulse, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        statusBadgeVariants({ variant, size }),
        pulse && "animate-system-pulse",
        className
      )}
      {...props}
    >
      {variant === "optimal" && (
        <span className="w-1.5 h-1.5 rounded-full bg-foundry-950 animate-pulse" />
      )}
      {variant === "processing" && (
        <span className="w-1.5 h-1.5 rounded-full bg-foundry-950 animate-spin" />
      )}
      {variant === "critical" && (
        <span className="w-1.5 h-1.5 rounded-full bg-foundry-50" />
      )}
      {children}
    </span>
  )
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
