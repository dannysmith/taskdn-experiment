import * as React from "react"
import {
  Check,
  CircleDot,
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
 * Visual states:
 * - ready: empty circle
 * - done: filled blue with checkmark
 * - in-progress: blue with dot
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

  const baseClasses = cn(
    "relative flex items-center justify-center size-[18px] rounded-full shrink-0",
    "transition-all duration-150 cursor-pointer",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    className
  )

  const iconClasses = "size-2.5"

  // Determine visual representation based on status
  switch (status) {
    case "done":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "bg-status-done text-white"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as incomplete"
        >
          <Check className={iconClasses} strokeWidth={3} />
        </button>
      )

    case "in-progress":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "border-2 border-status-in-progress text-status-in-progress"
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Mark as complete"
        >
          <CircleDot className="size-3" strokeWidth={2} />
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
          <X className={iconClasses} strokeWidth={3} />
        </button>
      )

    case "icebox":
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "border-2 border-muted-foreground/50 text-muted-foreground/70"
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
            "border-2 border-icon-inbox text-icon-inbox"
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
          <X className={iconClasses} strokeWidth={3} />
        </button>
      )

    case "ready":
    default:
      return (
        <button
          type="button"
          className={cn(
            baseClasses,
            "border-2 border-muted-foreground/40 hover:border-muted-foreground/60",
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
              "text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors"
            )}
            strokeWidth={3}
          />
        </button>
      )
  }
}
