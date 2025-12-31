import { useDroppable } from "@dnd-kit/core"
import { format, isToday, isWeekend } from "date-fns"

import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types/data"
import { DraggableTaskCard } from "./draggable-task-card"

interface TaskContext {
  projectName?: string
  areaName?: string
  projectId?: string
  areaId?: string
}

interface DayColumnProps {
  date: Date
  tasks: Task[]
  /** Function to get context (project/area names and IDs) for a task */
  getTaskContext?: (task: Task) => TaskContext
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onTaskTitleChange: (taskId: string, newTitle: string) => void
  onTaskScheduledChange: (taskId: string, date: string | undefined) => void
  onTaskDueChange: (taskId: string, date: string | undefined) => void
  onTaskOpenDetail?: (taskId: string) => void
  onNavigateToProject?: (projectId: string) => void
  onNavigateToArea?: (areaId: string) => void
  /** Whether this column is being dragged over */
  isDropTarget?: boolean
}

/**
 * A single day column in the week calendar.
 * Acts as a droppable container for tasks.
 */
export function DayColumn({
  date,
  tasks,
  getTaskContext,
  onTaskStatusChange,
  onTaskTitleChange,
  onTaskScheduledChange,
  onTaskDueChange,
  onTaskOpenDetail,
  onNavigateToProject,
  onNavigateToArea,
  isDropTarget = false,
}: DayColumnProps) {
  const dateString = format(date, "yyyy-MM-dd")
  const isCurrentDay = isToday(date)
  const isWeekendDay = isWeekend(date)

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateString}`,
    data: {
      type: "day",
      date: dateString,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-[400px] border-r border-border/50 last:border-r-0",
        isWeekendDay && "bg-muted/20",
        (isOver || isDropTarget) && "bg-primary/5"
      )}
    >
      {/* Day header */}
      <div
        className={cn(
          "sticky top-0 z-10 px-2 py-2 border-b border-border/50 bg-background",
          isWeekendDay && "bg-muted/20"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {format(date, "EEE")}
          </span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              isCurrentDay && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center"
            )}
          >
            {format(date, "d")}
          </span>
        </div>
      </div>

      {/* Tasks container */}
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
        {tasks.map((task) => {
          const context = getTaskContext?.(task) ?? {}
          return (
            <DraggableTaskCard
              key={task.id}
              task={task}
              date={dateString}
              projectName={context.projectName}
              areaName={context.areaName}
              onStatusChange={(newStatus) => onTaskStatusChange(task.id, newStatus)}
              onTitleChange={(newTitle) => onTaskTitleChange(task.id, newTitle)}
              onScheduledChange={(date) => onTaskScheduledChange(task.id, date)}
              onDueChange={(date) => onTaskDueChange(task.id, date)}
              onEditClick={onTaskOpenDetail ? () => onTaskOpenDetail(task.id) : undefined}
              onProjectClick={
                context.projectId && onNavigateToProject
                  ? () => onNavigateToProject(context.projectId!)
                  : undefined
              }
              onAreaClick={
                context.areaId && onNavigateToArea
                  ? () => onNavigateToArea(context.areaId!)
                  : undefined
              }
            />
          )
        })}

        {/* Empty state / drop zone indicator */}
        {tasks.length === 0 && (
          <div
            className={cn(
              "h-full min-h-[100px] rounded-lg border-2 border-dashed border-transparent transition-colors",
              (isOver || isDropTarget) && "border-primary/30"
            )}
          />
        )}
      </div>
    </div>
  )
}
