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
import type { Heading } from '@/types/headings'
import { TaskDragPreview } from './task-list'
import { HeadingDragPreview } from '@/components/headings'

// -----------------------------------------------------------------------------
// Loose Tasks Helpers
// -----------------------------------------------------------------------------

const LOOSE_TASKS_PREFIX = '__loose-tasks-'

/**
 * Creates a pseudo-project ID for loose tasks in an area.
 * Used to integrate loose tasks with the cross-project drag system.
 */
export function getLooseTasksProjectId(areaId: string): string {
  return `${LOOSE_TASKS_PREFIX}${areaId}__`
}

/**
 * Checks if a project ID is a loose tasks pseudo-project.
 */
export function isLooseTasksProjectId(projectId: string): boolean {
  return projectId.startsWith(LOOSE_TASKS_PREFIX)
}

/**
 * Extracts the area ID from a loose tasks pseudo-project ID.
 * Returns undefined if not a loose tasks project ID.
 */
export function getAreaIdFromLooseTasksProjectId(
  projectId: string
): string | undefined {
  if (!isLooseTasksProjectId(projectId)) return undefined
  return projectId.slice(LOOSE_TASKS_PREFIX.length, -2) // Remove prefix and trailing __
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TaskDragData {
  type: 'task'
  taskId: string
  projectId: string
}

interface HeadingDragData {
  type: 'heading'
  headingId: string
  containerId: string
}

interface EmptyProjectData {
  type: 'empty-project'
  projectId: string
}

type DragItemData = TaskDragData | HeadingDragData
type DropTargetData = TaskDragData | HeadingDragData | EmptyProjectData

interface TaskDragPreviewState {
  type: 'task'
  taskId: string
  task: Task
  sourceProjectId: string
  currentProjectId: string
  overTaskId: string | null
}

interface HeadingDragPreviewState {
  type: 'heading'
  headingId: string
  heading: Heading
  containerId: string
}

type DragPreviewState = TaskDragPreviewState | HeadingDragPreviewState

interface TaskDndContextValue {
  dragPreview: DragPreviewState | null
  lastDroppedTaskId: string | null
  clearLastDroppedTaskId: () => void
}

// Exported for reuse by other DnD contexts (e.g., TodayDndContext)
export const TaskDndReactContext = React.createContext<TaskDndContextValue>({
  dragPreview: null,
  lastDroppedTaskId: null,
  clearLastDroppedTaskId: () => {},
})

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskDragPreview() {
  return React.useContext(TaskDndReactContext)
}

interface TaskDndContextProps {
  children: React.ReactNode
  /** All tasks organized by projectId */
  tasksByProject: Map<string, Task[]>
  /**
   * Called when a task is moved to a different project.
   * @param insertBeforeTaskId - Insert before this task, or null to append at end
   */
  onTaskMove: (
    taskId: string,
    fromProjectId: string,
    toProjectId: string,
    insertBeforeTaskId: string | null
  ) => void
  /** Called when tasks are reordered within the same project */
  onTasksReorder: (projectId: string, reorderedTasks: Task[]) => void
  /** Get a task by its ID */
  getTaskById: (taskId: string) => Task | undefined
  /** Get a heading by its ID (optional, for heading drag preview) */
  getHeadingById?: (headingId: string) => Heading | undefined
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
  getHeadingById,
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
    const data = event.active.data.current as DragItemData | undefined

    if (data?.type === 'task') {
      const task = getTaskById(data.taskId)
      if (task) {
        setDragPreview({
          type: 'task',
          taskId: data.taskId,
          task,
          sourceProjectId: data.projectId,
          currentProjectId: data.projectId,
          overTaskId: null,
        })
      }
    } else if (data?.type === 'heading' && getHeadingById) {
      const heading = getHeadingById(data.headingId)
      if (heading) {
        setDragPreview({
          type: 'heading',
          headingId: data.headingId,
          heading,
          containerId: data.containerId,
        })
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (!dragPreview) return

    // Headings don't participate in cross-section drag, so no preview update needed
    if (dragPreview.type === 'heading') return

    const { over } = event
    if (!over) return

    const overData = over.data.current as DropTargetData | undefined
    if (!overData) return

    // Only update for task drags - handle both task and empty-project targets
    const newProjectId =
      overData.type === 'heading' ? overData.containerId : overData.projectId
    const newOverTaskId = overData.type === 'task' ? overData.taskId : null

    // Update preview to show which project/task we're hovering over
    // Only update if something actually changed to avoid unnecessary re-renders
    if (
      newProjectId !== dragPreview.currentProjectId ||
      newOverTaskId !== dragPreview.overTaskId
    ) {
      setDragPreview((prev) =>
        prev && prev.type === 'task'
          ? {
              ...prev,
              currentProjectId: newProjectId,
              overTaskId: newOverTaskId,
            }
          : prev
      )
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!dragPreview) return

    // Heading drags are handled by SortableContext, just clear the preview
    if (dragPreview.type === 'heading') {
      setDragPreview(null)
      return
    }

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
    // Handle dropping on headings (use their containerId) or tasks/empty-projects
    const targetProjectId =
      overData?.type === 'heading'
        ? overData.containerId
        : overData?.projectId ?? dragPreview.sourceProjectId

    if (targetProjectId !== dragPreview.sourceProjectId) {
      // Cross-project move (including drops on empty projects)
      // Pass the overTaskId so the handler can insert at the correct position
      const insertBeforeTaskId =
        overData?.type === 'task' ? overData.taskId : null
      onTaskMove(
        dragPreview.taskId,
        dragPreview.sourceProjectId,
        targetProjectId,
        insertBeforeTaskId
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
          {dragPreview &&
            (dragPreview.type === 'task' ? (
              <TaskDragPreview task={dragPreview.task} />
            ) : (
              <HeadingDragPreview heading={dragPreview.heading} />
            ))}
        </DragOverlay>
      </DndContext>
    </TaskDndReactContext.Provider>
  )
}

// -----------------------------------------------------------------------------
// Helper: Check if a task should show a drop indicator
// -----------------------------------------------------------------------------

// Today view section IDs that have restricted drop targets
const TODAY_SECTION_IDS = new Set([
  'scheduled-today',
  'overdue-due-today',
  'became-available-today',
])

/**
 * Returns whether to show a drop indicator above this task.
 * Used for visual feedback during cross-project drag.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function shouldShowDropIndicator(
  taskId: string,
  projectId: string,
  dragPreview: DragPreviewState | null
): boolean {
  if (!dragPreview) return false

  // Only task drags can show drop indicators (not heading drags)
  if (dragPreview.type !== 'task') return false

  // Only show indicator if dragging to a different project
  if (dragPreview.sourceProjectId === dragPreview.currentProjectId) return false

  // For Today view: only show indicator when target is "scheduled-today"
  if (TODAY_SECTION_IDS.has(dragPreview.sourceProjectId)) {
    if (dragPreview.currentProjectId !== 'scheduled-today') return false
  }

  // Show indicator on the task we're hovering over in the target project
  return (
    dragPreview.currentProjectId === projectId &&
    dragPreview.overTaskId === taskId
  )
}
