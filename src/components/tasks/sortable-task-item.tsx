import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'
import { TaskItem, type TaskItemProps } from './task-item'
import { useTaskDragPreview } from './task-dnd-context'

export interface SortableTaskItemProps extends Omit<TaskItemProps, 'className'> {
  /** Unique drag ID for this item (should be unique across all containers) */
  dragId: string
  /** Container ID for cross-container drag detection */
  containerId: string
  className?: string
}

/**
 * A sortable wrapper for TaskItem that provides drag-and-drop functionality.
 * Follows the SortableKanbanCard pattern for consistent, smooth DnD behavior.
 */
export function SortableTaskItem({
  task,
  dragId,
  containerId,
  className,
  isEditing,
  ...taskItemProps
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId,
    data: {
      type: 'task',
      taskId: task.id,
      projectId: containerId,
    },
  })

  // Check if we should show a gap before this item (cross-container drag)
  const { crossContainerHover } = useTaskDragPreview()
  const showGapBefore =
    crossContainerHover?.targetContainerId === containerId &&
    crossContainerHover?.insertBeforeId === task.id

  const style: React.CSSProperties = {
    // Always apply transforms - no suppression during cross-container drag
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Only apply drag listeners when NOT editing to prevent interference with input
  const dragProps = isEditing ? {} : { ...attributes, ...listeners }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      className={cn(
        'touch-manipulation',
        isDragging && 'opacity-50',
        // CSS gap animation for cross-container drag
        showGapBefore && 'mt-10 transition-[margin] duration-150 ease-out',
        className
      )}
    >
      <TaskItem
        task={task}
        isEditing={isEditing}
        {...taskItemProps}
      />
    </div>
  )
}
