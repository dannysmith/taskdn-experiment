import * as React from "react"
import {
  Check,
  X,
  Snowflake,
  Inbox,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/types/data"

interface TaskStatusCheckboxProps {
  status: TaskStatus
  onToggle: () => void
  className?: string
}

/**
 * A checkbox-like component that displays task status visually.
 * Clicking toggles between "ready" and "done".
 *
 * Visual states (rounded square shape, like Things 3):
 * - ready: empty rounded square
 * - done: filled blue with checkmark
 * - in-progress: blue border with dot
 * - blocked: orange/red with X
 * - icebox: gray with snowflake
 * - inbox: blue with inbox icon
 * - dropped: gray with X
 */
export function TaskStatusCheckbox({
  status,
  onToggle,
  className,
}: TaskStatusCheckboxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      e.stopPropagation()
      onToggle()
    }
  }

  // Rounded square shape like Things 3
  const baseClasses = cn(
    "relative flex items-center justify-center size-[18px] rounded-[5px] shrink-0",
    "transition-all duration-150 cursor-pointer",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    className
  )

  const iconClasses = "size-3"

  // Determine visual representation based on status
  switch (status) {
    case "done":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "bg-[oklch(0.55_0.2_250)] text-white"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as incomplete"
        >
          <Check className={iconClasses} strokeWidth={2.5} />
        </button>
      )

    case "in-progress":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "border-2 border-[oklch(0.55_0.2_250)]"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as complete"
        >
          {/* Filled inner dot */}
          <div className="size-2 rounded-sm bg-[oklch(0.55_0.2_250)]" />
        </button>
      )

    case "blocked":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "bg-status-blocked text-white"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as complete"
        >
          <X className={iconClasses} strokeWidth={2.5} />
        </button>
      )

    case "icebox":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "border-2 border-muted-foreground/40 text-muted-foreground/60"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as complete"
        >
          <Snowflake className="size-2.5" strokeWidth={2} />
        </button>
      )

    case "inbox":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "border-2 border-[oklch(0.55_0.2_250)] text-[oklch(0.55_0.2_250)]"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as complete"
        >
          <Inbox className="size-2.5" strokeWidth={2} />
        </button>
      )

    case "dropped":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "bg-muted-foreground/30 text-muted-foreground"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as complete"
        >
          <X className={iconClasses} strokeWidth={2.5} />
        </button>
      )

    case "ready":
    default:
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "border-2 border-muted-foreground/40 hover:border-[oklch(0.55_0.2_250)]/60",
            "group"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as complete"
        >
          {/* Show faint checkmark on hover */}
          <Check
            className={cn(
              iconClasses,
              "text-muted-foreground/0 group-hover:text-[oklch(0.55_0.2_250)]/40 transition-colors"
            )}
            strokeWidth={2.5}
          />
        </button>
      )
  }
}
