import * as React from "react"
import { Flag, Calendar, X, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatRelativeDate, isOverdue } from "@/lib/date-utils"
import type { Task, TaskStatus } from "@/types/data"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export interface TaskCardProps {
  task: Task
  /** Project name (if task belongs to a project) */
  projectName?: string
  /** Area name (direct or inherited from project) */
  areaName?: string
  /** Click handler for the card */
  onClick?: () => void
  /** Click handler for project name */
  onProjectClick?: () => void
  /** Click handler for area name */
  onAreaClick?: () => void
  /** Called when status is changed */
  onStatusChange?: (newStatus: TaskStatus) => void
  /** Called when title is edited */
  onTitleChange?: (newTitle: string) => void
  /** Called when scheduled date is changed */
  onScheduledChange?: (date: string | undefined) => void
  /** Called when due date is changed */
  onDueChange?: (date: string | undefined) => void
  /** Whether the card is selected */
  isSelected?: boolean
  className?: string
}

// Status configuration with labels and colors
const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  inbox: { label: "Inbox", color: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
  icebox: { label: "Icebox", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  ready: { label: "Ready", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "in-progress": { label: "In Progress", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  blocked: { label: "Blocked", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  dropped: { label: "Dropped", color: "bg-gray-500/15 text-gray-500 dark:text-gray-500" },
  done: { label: "Done", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
}

const allStatuses: TaskStatus[] = ["inbox", "ready", "in-progress", "blocked", "done", "icebox", "dropped"]

/**
 * A card representation of a task.
 * Used in Kanban boards, calendar views, and dashboards.
 */
export function TaskCard({
  task,
  projectName,
  areaName,
  onClick,
  onProjectClick,
  onAreaClick,
  onStatusChange,
  onTitleChange,
  onScheduledChange,
  onDueChange,
  isSelected,
  className,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(task.title)
  const [scheduledOpen, setScheduledOpen] = React.useState(false)
  const [dueOpen, setDueOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const isDone = task.status === "done"
  const isDropped = task.status === "dropped"
  const isCompleted = isDone || isDropped

  // Sync edit value when task changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(task.title)
    }
  }, [task.title, isEditing])

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleContextClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (projectName && onProjectClick) {
      onProjectClick()
    } else if (areaName && onAreaClick) {
      onAreaClick()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onTitleChange && !isEditing) {
      setIsEditing(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isSelected && !isEditing && onTitleChange) {
      e.preventDefault()
      setIsEditing(true)
    }
  }

  const handleInputBlur = () => {
    if (editValue.trim() && editValue.trim() !== task.title) {
      onTitleChange?.(editValue.trim())
    }
    setIsEditing(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === "Enter") {
      e.preventDefault()
      if (editValue.trim() && editValue.trim() !== task.title) {
        onTitleChange?.(editValue.trim())
      }
      setIsEditing(false)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setEditValue(task.title)
      setIsEditing(false)
    }
  }

  const handleScheduledSelect = (date: Date | undefined) => {
    onScheduledChange?.(date ? date.toISOString().split("T")[0] : undefined)
    setScheduledOpen(false)
  }

  const handleDueSelect = (date: Date | undefined) => {
    onDueChange?.(date ? date.toISOString().split("T")[0] : undefined)
    setDueOpen(false)
  }

  const contextName = projectName || areaName
  const hasContextClick = (projectName && onProjectClick) || (areaName && onAreaClick)

  // Parse dates for calendar
  const scheduledDate = task.scheduled ? new Date(task.scheduled) : undefined
  const dueDate = task.due ? new Date(task.due) : undefined

  const currentStatus = statusConfig[task.status]

  return (
    <div
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={cn(
        "group bg-card rounded-xl border border-border/50 p-3.5 transition-all outline-none",
        "hover:border-border hover:shadow-md hover:shadow-black/5",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        onClick && "cursor-pointer",
        isSelected && "ring-2 ring-primary border-primary",
        isEditing && "ring-2 ring-primary",
        className
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-3">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="flex-1 text-sm font-medium bg-transparent outline-none"
            placeholder="Task title..."
          />
        ) : (
          <span
            className={cn(
              "flex-1 text-sm font-medium leading-snug",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Footer: status pill + context + dates */}
      <div
        className={cn(
          "mt-3 flex items-center gap-3 text-xs",
          isCompleted && "opacity-60"
        )}
      >
        {/* Status pill dropdown */}
        <StatusPill
          status={task.status}
          onStatusChange={onStatusChange}
          config={currentStatus}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Context (project or area) */}
        {contextName && (
          <button
            type="button"
            onClick={handleContextClick}
            className={cn(
              "truncate text-muted-foreground",
              hasContextClick && "hover:text-foreground hover:underline"
            )}
          >
            {contextName}
          </button>
        )}

        {/* Dates */}
        <div className="flex items-center gap-2 shrink-0">
          <DatePickerButton
            date={scheduledDate}
            icon={<Calendar className="size-3" />}
            open={scheduledOpen}
            onOpenChange={setScheduledOpen}
            onSelect={handleScheduledSelect}
            canEdit={!!onScheduledChange}
            label="Scheduled"
          />

          <DatePickerButton
            date={dueDate}
            icon={<Flag className="size-3" />}
            open={dueOpen}
            onOpenChange={setDueOpen}
            onSelect={handleDueSelect}
            canEdit={!!onDueChange}
            label="Due"
            isOverdue={dueDate ? isOverdue(task.due!) && !isCompleted : false}
          />
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Status Pill
// -----------------------------------------------------------------------------

interface StatusPillProps {
  status: TaskStatus
  config: { label: string; color: string }
  onStatusChange?: (newStatus: TaskStatus) => void
}

function StatusPill({ status, config, onStatusChange }: StatusPillProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!onStatusChange) {
    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0",
          config.color
        )}
      >
        {config.label}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={handleClick}
        className={cn(
          "px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 inline-flex items-center gap-1 transition-opacity hover:opacity-80",
          config.color
        )}
      >
        {config.label}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {allStatuses.slice(0, 5).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(s)
            }}
            className={cn(
              "cursor-pointer",
              s === status && "bg-accent"
            )}
          >
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                statusConfig[s].color
              )}
            >
              {statusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {allStatuses.slice(5).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(s)
            }}
            className={cn(
              "cursor-pointer",
              s === status && "bg-accent"
            )}
          >
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                statusConfig[s].color
              )}
            >
              {statusConfig[s].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// -----------------------------------------------------------------------------
// Date Picker Button
// -----------------------------------------------------------------------------

interface DatePickerButtonProps {
  date: Date | undefined
  icon: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (date: Date | undefined) => void
  canEdit: boolean
  label: string
  isOverdue?: boolean
}

function DatePickerButton({
  date,
  icon,
  open,
  onOpenChange,
  onSelect,
  canEdit,
  label,
  isOverdue = false,
}: DatePickerButtonProps) {
  if (!date && !canEdit) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(undefined)
  }

  if (!date) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          onClick={handleClick}
          className="flex items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {icon}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarPicker
            mode="single"
            selected={date}
            onSelect={onSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1 transition-colors",
          canEdit && "hover:text-foreground",
          isOverdue
            ? "text-red-500 dark:text-red-400"
            : label === "Due"
              ? "text-red-400/70 dark:text-red-400/60"
              : "text-muted-foreground"
        )}
      >
        {icon}
        {formatRelativeDate(date.toISOString())}
      </PopoverTrigger>
      {canEdit && (
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col">
            <CalendarPicker
              mode="single"
              selected={date}
              onSelect={onSelect}
              initialFocus
            />
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleClear}
              >
                <X className="size-3 mr-2" />
                Clear {label.toLowerCase()} date
              </Button>
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  )
}
