import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  /** Optional icon to display before the title */
  icon?: React.ReactNode
  taskCount?: number
  isExpanded: boolean
  onToggleExpand: () => void
  className?: string
}

/**
 * A collapsible section header for grouping tasks.
 * Used for static sections like "Scheduled for Today" or "Overdue".
 * Click to expand/collapse.
 */
export function SectionHeader({
  title,
  icon,
  taskCount,
  isExpanded,
  onToggleExpand,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-1 cursor-pointer select-none",
        "border-b border-border/60",
        "hover:bg-muted/30 transition-colors",
        className
      )}
      onClick={onToggleExpand}
    >
      {/* Expand/collapse chevron */}
      <ChevronRight
        className={cn(
          "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
          isExpanded && "rotate-90"
        )}
      />

      {/* Optional icon */}
      {icon && (
        <span className="text-muted-foreground shrink-0">
          {icon}
        </span>
      )}

      {/* Section title */}
      <span className="font-semibold text-sm truncate flex-1">
        {title}
      </span>

      {/* Task count badge */}
      {taskCount !== undefined && taskCount > 0 && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {taskCount}
        </span>
      )}
    </div>
  )
}
