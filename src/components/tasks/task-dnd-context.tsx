import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove } from '@dnd-kit/sortable'

import type { Task } from '@/types/data'
import { TaskDragPreview } from './task-list'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TaskDragData {
  type: 'task'
  taskId: string
  projectId: string
}

interface EmptyProjectData {
  type: 'empty-project'
  projectId: string
}

type DropTargetData = TaskDragData | EmptyProjectData

interface DragPreviewState {
  taskId: string
  task: Task
  sourceProjectId: string
  currentProjectId: string
  overTaskId: string | null
}

interface TaskDndContextValue {
  dragPreview: DragPreviewState | null
  lastDroppedTaskId: string | null
  clearLastDroppedTaskId: () => void
}

const TaskDndReactContext = React.createContext<TaskDndContextValue>({
  dragPreview: null,
  lastDroppedTaskId: null,
  clearLastDroppedTaskId: () => {},
})

export function useTaskDragPreview() {
  return React.useContext(TaskDndReactContext)
}

interface TaskDndContextProps {
  children: React.ReactNode
  /** All tasks organized by projectId */
  tasksByProject: Map<string, Task[]>
  /** Called when a task is moved to a different project */
  onTaskMove: (
    taskId: string,
    fromProjectId: string,
    toProjectId: string
  ) => void
  /** Called when tasks are reordered within the same project */
  onTasksReorder: (projectId: string, reorderedTasks: Task[]) => void
  /** Get a task by its ID */
  getTaskById: (taskId: string) => Task | undefined
}

// -----------------------------------------------------------------------------
// TaskDndContext - Shared context for cross-project drag
// -----------------------------------------------------------------------------

/**
 * A shared DndContext for multiple project task lists.
 * Handles both same-project reordering and cross-project moves.
 * Uses onDragOver to provide visual feedback during cross-project drags.
 */
export function TaskDndContext({
  children,
  tasksByProject,
  onTaskMove,
  onTasksReorder,
  getTaskById,
}: TaskDndContextProps) {
  const [dragPreview, setDragPreview] = React.useState<DragPreviewState | null>(
    null
  )
  const [lastDroppedTaskId, setLastDroppedTaskId] = React.useState<
    string | null
  >(null)

  const clearLastDroppedTaskId = React.useCallback(() => {
    setLastDroppedTaskId(null)
  }, [])

  // Sensors for drag and drop - only PointerSensor
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Drop animation
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } },
    }),
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as TaskDragData | undefined
    if (data?.type === 'task') {
      const task = getTaskById(data.taskId)
      if (task) {
        setDragPreview({
          taskId: data.taskId,
          task,
          sourceProjectId: data.projectId,
          currentProjectId: data.projectId,
          overTaskId: null,
        })
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (!dragPreview) return

    const { over } = event
    if (!over) return

    const overData = over.data.current as DropTargetData | undefined
    if (!overData) return

    // Handle both task and empty-project targets
    const newProjectId = overData.projectId
    const newOverTaskId = overData.type === 'task' ? overData.taskId : null

    // Update preview to show which project/task we're hovering over
    // Only update if something actually changed to avoid unnecessary re-renders
    if (
      newProjectId !== dragPreview.currentProjectId ||
      newOverTaskId !== dragPreview.overTaskId
    ) {
      setDragPreview((prev) =>
        prev
          ? {
              ...prev,
              currentProjectId: newProjectId,
              overTaskId: newOverTaskId,
            }
          : null
      )
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!dragPreview) return

    const { active, over } = event

    if (!over) {
      setDragPreview(null)
      return
    }

    const activeData = active.data.current as TaskDragData | undefined
    const overData = over.data.current as DropTargetData | undefined

    if (!activeData || activeData.type !== 'task') {
      setDragPreview(null)
      return
    }

    // Determine target project from where we dropped
    const targetProjectId = overData?.projectId ?? dragPreview.sourceProjectId

    if (targetProjectId !== dragPreview.sourceProjectId) {
      // Cross-project move (including drops on empty projects)
      onTaskMove(
        dragPreview.taskId,
        dragPreview.sourceProjectId,
        targetProjectId
      )
      setLastDroppedTaskId(dragPreview.taskId)
    } else if (overData?.type === 'task' && active.id !== over.id) {
      // Same-project reorder (only when dropping on another task)
      const projectTasks = tasksByProject.get(targetProjectId) ?? []
      const oldIndex = projectTasks.findIndex((t) => t.id === activeData.taskId)
      const newIndex = projectTasks.findIndex((t) => t.id === overData.taskId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(projectTasks, oldIndex, newIndex)
        onTasksReorder(targetProjectId, newTasks)
        setLastDroppedTaskId(activeData.taskId)
      }
    }

    setDragPreview(null)
  }

  const handleDragCancel = () => {
    setDragPreview(null)
  }

  const contextValue: TaskDndContextValue = {
    dragPreview,
    lastDroppedTaskId,
    clearLastDroppedTaskId,
  }

  return (
    <TaskDndReactContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={dropAnimation}>
          {dragPreview && <TaskDragPreview task={dragPreview.task} />}
        </DragOverlay>
      </DndContext>
    </TaskDndReactContext.Provider>
  )
}

// -----------------------------------------------------------------------------
// Helper: Check if a task should show a drop indicator
// -----------------------------------------------------------------------------

/**
 * Returns whether to show a drop indicator above this task.
 * Used for visual feedback during cross-project drag.
 */
export function shouldShowDropIndicator(
  taskId: string,
  projectId: string,
  dragPreview: DragPreviewState | null
): boolean {
  if (!dragPreview) return false

  // Only show indicator if dragging to a different project
  if (dragPreview.sourceProjectId === dragPreview.currentProjectId) return false

  // Show indicator on the task we're hovering over in the target project
  return (
    dragPreview.currentProjectId === projectId &&
    dragPreview.overTaskId === taskId
  )
}
