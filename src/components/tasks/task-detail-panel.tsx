import * as React from "react"
import { format } from "date-fns"
import {
  X,
  Calendar,
  Flag,
  Snowflake,
  FolderOpen,
  CircleDot,
  ChevronsUpDown,
  Check,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppData } from "@/context/app-data-context"
import { useTaskDetail } from "@/context/task-detail-context"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { TaskStatusCheckbox } from "./task-status-checkbox"
import { TaskStatusPill } from "./task-status-pill"
import { MilkdownEditor } from "./milkdown-editor"

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function TaskDetailPanel() {
  const { openTaskId, closeTask } = useTaskDetail()
  const {
    getTaskById,
    getActiveProjects,
    getActiveAreas,
    updateTaskTitle,
    updateTaskStatus,
    updateTaskScheduled,
    updateTaskDue,
    updateTaskDeferUntil,
    updateTaskNotes,
    updateTaskProject,
    updateTaskArea,
    toggleTaskStatus,
    getProjectById,
    getAreaById,
  } = useAppData()

  const task = openTaskId ? getTaskById(openTaskId) : null
  const activeProjects = getActiveProjects()
  const activeAreas = getActiveAreas()

  // Include non-active projects/areas that are currently assigned
  const allProjects = React.useMemo(() => {
    if (!task?.projectId) return activeProjects
    const current = getProjectById(task.projectId)
    if (current && !activeProjects.find((p) => p.id === current.id)) {
      return [current, ...activeProjects]
    }
    return activeProjects
  }, [task?.projectId, activeProjects, getProjectById])

  const allAreas = React.useMemo(() => {
    if (!task?.areaId) return activeAreas
    const current = getAreaById(task.areaId)
    if (current && !activeAreas.find((a) => a.id === current.id)) {
      return [current, ...activeAreas]
    }
    return activeAreas
  }, [task?.areaId, activeAreas, getAreaById])

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm p-6">
        Select a task to view details
      </div>
    )
  }

  const currentProject = task.projectId ? getProjectById(task.projectId) ?? null : null
  const currentArea = task.areaId ? getAreaById(task.areaId) ?? null : null

  return (
    <div className="flex h-full flex-col">
      {/* Header: Checkbox + Title + Close */}
      <div className="flex items-center gap-3 px-4 py-3">
        <TaskStatusCheckbox
          status={task.status}
          onToggle={() => toggleTaskStatus(task.id)}
          className="size-5 shrink-0"
        />
        <Textarea
          value={task.title}
          onChange={(e) => updateTaskTitle(task.id, e.target.value)}
          className="flex-1 text-lg font-medium border-none shadow-none p-1 min-h-0 h-auto resize-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm field-sizing-content"
          placeholder="Task title..."
          rows={1}
        />
        <Button variant="ghost" size="icon-sm" onClick={closeTask} className="-mr-1 shrink-0">
          <X className="size-4" />
        </Button>
      </div>

      {/* Metadata section */}
      <div className="px-4 pb-3 space-y-2.5">
        {/* Project & Area row */}
        <div className="flex gap-2">
          <SearchableSelect
            value={task.projectId}
            options={allProjects.map(p => ({ value: p.id, label: p.title }))}
            placeholder="Project..."
            displayValue={currentProject?.title}
            icon={<CircleDot className="size-3 text-entity-project" />}
            onChange={(id) => updateTaskProject(task.id, id)}
            emptyText="No projects found"
          />
          <SearchableSelect
            value={task.areaId}
            options={allAreas.map(a => ({ value: a.id, label: a.title }))}
            placeholder="Area..."
            displayValue={currentArea?.title}
            icon={<FolderOpen className="size-3 text-entity-area" />}
            onChange={(id) => updateTaskArea(task.id, id)}
            emptyText="No areas found"
          />
        </div>

        {/* Status + Dates row */}
        <div className="flex items-center gap-2">
          <TaskStatusPill
            status={task.status}
            onStatusChange={(newStatus) => updateTaskStatus(task.id, newStatus)}
          />
          <div className="flex-1" />
          <DateButton
            icon={<Calendar className="size-3" />}
            value={task.scheduled}
            onChange={(date) => updateTaskScheduled(task.id, date)}
            tooltip="Scheduled"
            variant="scheduled"
          />
          <DateButton
            icon={<Flag className="size-3" />}
            value={task.due}
            onChange={(date) => updateTaskDue(task.id, date)}
            tooltip="Due"
            variant="due"
          />
          <DateButton
            icon={<Snowflake className="size-3" />}
            value={task.deferUntil}
            onChange={(date) => updateTaskDeferUntil(task.id, date)}
            tooltip="Defer"
            variant="defer"
          />
        </div>
      </div>

      {/* Notes - fills remaining space with card background */}
      <div className="flex-1 min-h-0 overflow-hidden p-3 pt-0">
        <div className="h-full bg-card rounded-lg border overflow-hidden">
          <MilkdownEditor
            editorKey={task.id}
            defaultValue={task.notes ?? ""}
            onChange={(value) => updateTaskNotes(task.id, value)}
            className="h-full"
          />
        </div>
      </div>

      {/* Footer - Metadata */}
      <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
        <span>Created {formatShortDate(task.createdAt)}</span>
        <span>Updated {formatShortDate(task.updatedAt)}</span>
        {task.completedAt && <span>Completed {formatShortDate(task.completedAt)}</span>}
        <span className="font-mono opacity-50">{task.id}</span>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Searchable Select (Popover + Command pattern)
// -----------------------------------------------------------------------------

interface SearchableSelectProps {
  value: string | undefined
  options: { value: string; label: string }[]
  placeholder: string
  displayValue?: string
  icon?: React.ReactNode
  onChange: (value: string | undefined) => void
  emptyText: string
}

function SearchableSelect({
  value,
  options,
  placeholder,
  displayValue,
  icon,
  onChange,
  emptyText,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-between min-w-0 h-8"
          />
        }
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          <span className={cn("truncate", !displayValue && "text-muted-foreground")}>
            {displayValue || placeholder}
          </span>
        </span>
        <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search...`} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(undefined)
                    setOpen(false)
                  }}
                >
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={value === option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {icon}
                  {option.label}
                  {value === option.value && (
                    <Check className="ml-auto size-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// -----------------------------------------------------------------------------
// Date Button
// -----------------------------------------------------------------------------

interface DateButtonProps {
  icon: React.ReactNode
  value: string | undefined
  onChange: (date: string | undefined) => void
  tooltip: string
  variant: "scheduled" | "due" | "defer"
}

const dateButtonStyles = {
  scheduled: {
    base: "text-muted-foreground bg-muted/50 hover:bg-muted",
    active: "text-muted-foreground bg-muted/80",
  },
  due: {
    base: "text-destructive/70 bg-destructive/5 hover:bg-destructive/10",
    active: "text-destructive bg-destructive/10",
  },
  defer: {
    base: "text-status-icebox/70 bg-status-icebox/5 hover:bg-status-icebox/10",
    active: "text-status-icebox bg-status-icebox/10",
  },
}

function DateButton({ icon, value, onChange, tooltip, variant }: DateButtonProps) {
  const [open, setOpen] = React.useState(false)
  const styles = dateButtonStyles[variant]

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"))
    } else {
      onChange(undefined)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-1 px-2 text-xs font-normal border-0",
              value ? styles.active : styles.base
            )}
            title={tooltip}
          />
        }
      >
        {icon}
        <span>{value ? format(new Date(value), "MMM d") : tooltip}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <CalendarComponent
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={handleSelect}
        />
        {value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatShortDate(isoString: string): string {
  try {
    return format(new Date(isoString), "MMM d")
  } catch {
    return isoString
  }
}
