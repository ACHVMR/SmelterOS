import * as React from "react"
import { cn } from "@/lib/utils"

type StatusType = "active" | "inactive" | "pending" | "error" | "processing"

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  label?: string
  showDot?: boolean
  size?: "sm" | "md" | "lg"
}

const statusClasses = {
  active: "text-[rgb(var(--status-success))] bg-[rgba(var(--status-success),0.1)] border-[rgba(var(--status-success),0.2)]",
  inactive: "text-[rgb(var(--text-secondary))] bg-[rgba(115,115,115,0.1)] border-[rgba(115,115,115,0.2)]",
  pending: "text-[rgb(var(--status-warning))] bg-[rgba(var(--status-warning),0.1)] border-[rgba(var(--status-warning),0.2)]",
  error: "text-[rgb(var(--status-error))] bg-[rgba(var(--status-error),0.1)] border-[rgba(var(--status-error),0.2)]",
  processing: "text-[rgb(var(--status-info))] bg-[rgba(var(--status-info),0.1)] border-[rgba(var(--status-info),0.2)]"
}

const statusLabels = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  error: "Error",
  processing: "Processing"
}

const dotClasses = {
  active: "bg-[rgb(var(--status-success))]",
  inactive: "bg-[rgb(var(--text-secondary))]",
  pending: "bg-[rgb(var(--status-warning))]",
  error: "bg-[rgb(var(--status-error))]",
  processing: "bg-[rgb(var(--status-info))]"
}

const sizeConfig = {
  sm: { dot: "h-1.5 w-1.5", text: "text-xs", padding: "px-2 py-0.5" },
  md: { dot: "h-2 w-2", text: "text-sm", padding: "px-3 py-1" },
  lg: { dot: "h-2.5 w-2.5", text: "text-base", padding: "px-4 py-1.5" }
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, label, showDot = true, size = "md", className, ...props }, ref) => {
    const sizeStyle = sizeConfig[size]
    const displayLabel = label || statusLabels[status]
    
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border font-medium",
          sizeStyle.padding,
          sizeStyle.text,
          statusClasses[status],
          className
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn("rounded-full animate-pulse", sizeStyle.dot, dotClasses[status])}
          />
        )}
        {displayLabel}
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator, type StatusType }
