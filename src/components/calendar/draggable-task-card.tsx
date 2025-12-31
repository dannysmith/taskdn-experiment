import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types/data"
import {
  getCalendarTaskDragId,
  type CalendarTaskDragData,
} from "@/types/calendar-order"
import { TaskCard } from "@/components/cards/task-card"

interface SortableTaskCardProps {
  task: Task
  date: string
  /** Project name for context */
  projectName?: string
  /** Area name for context */
  areaName?: string
  onStatusChange?: (newStatus: TaskStatus) => void
  onTitleChange?: (newTitle: string) => void
  onScheduledChange?: (date: string | undefined) => void
  onDueChange?: (date: string | undefined) => void
  onEditClick?: () => void
  onProjectClick?: () => void
  onAreaClick?: () => void
}

/**
 * A sortable wrapper around TaskCard for use in calendar views.
 * Enables drag-and-drop to reorder within a day or move between days.
 */
export function SortableTaskCard({
  task,
  date,
  projectName,
  areaName,
  onStatusChange,
  onTitleChange,
  onScheduledChange,
  onDueChange,
  onEditClick,
  onProjectClick,
  onAreaClick,
}: SortableTaskCardProps) {
  const dragData: CalendarTaskDragData = {
    type: "calendar-task",
    taskId: task.id,
    sourceDate: date,
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getCalendarTaskDragId(date, task.id),
    data: dragData,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50 z-50"
      )}
    >
      <TaskCard
        task={task}
        projectName={projectName}
        areaName={areaName}
        onStatusChange={onStatusChange}
        onTitleChange={onTitleChange}
        onScheduledChange={onScheduledChange}
        onDueChange={onDueChange}
        onEditClick={onEditClick}
        onProjectClick={onProjectClick}
        onAreaClick={onAreaClick}
      />
    </div>
  )
}

// Keep the old name as an alias for backwards compatibility during migration
export const DraggableTaskCard = SortableTaskCard

/**
 * Drag preview for TaskCard shown in the DragOverlay.
 * Uses the same TaskCard component for visual consistency.
 */
export function TaskCardDragPreview({ task }: { task: Task }) {
  return (
    <div className="max-w-[280px] shadow-xl">
      <TaskCard task={task} />
    </div>
  )
}
