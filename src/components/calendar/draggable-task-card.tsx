import * as React from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types/data"
import { TaskCard } from "@/components/cards/task-card"

interface DraggableTaskCardProps {
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
 * A draggable wrapper around TaskCard for use in calendar views.
 * Enables drag-and-drop to move tasks between days.
 */
export function DraggableTaskCard({
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
}: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `calendar-task-${date}-${task.id}`,
    data: {
      type: "calendar-task",
      taskId: task.id,
      sourceDate: date,
    },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing",
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
