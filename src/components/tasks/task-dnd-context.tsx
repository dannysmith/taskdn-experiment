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
  type UniqueIdentifier,
} from '@dnd-kit/core'
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
  sourceContainerId: string
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
  /**
   * Get the visual order of items for a container during drag.
   * Returns drag IDs (not task IDs) for use with SortableContext.
   * Falls back to null when not dragging (caller should use entity data).
   */
  getVisualItems: (containerId: string) => UniqueIdentifier[] | null
}

// Exported for reuse by other DnD contexts (e.g., TodayDndContext)
export const TaskDndReactContext = React.createContext<TaskDndContextValue>({
  dragPreview: null,
  lastDroppedTaskId: null,
  clearLastDroppedTaskId: () => {},
  getVisualItems: () => null,
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
  /**
   * Called when items (tasks or headings) are reordered within a container.
   * Passes the drag IDs so the caller can calculate the new order.
   */
  onItemsReorder?: (
    containerId: string,
    activeId: string,
    overId: string
  ) => void
  /** Get a task by its ID */
  getTaskById: (taskId: string) => Task | undefined
  /** Get a heading by its ID (optional, for heading drag preview) */
  getHeadingById?: (headingId: string) => Heading | undefined
}

// -----------------------------------------------------------------------------
// Helper: Generate drag ID from container and task ID
// -----------------------------------------------------------------------------

function makeDragId(containerId: string, taskId: string): string {
  return `task-${containerId}-${taskId}`
}

function extractTaskIdFromDragId(dragId: string): string | null {
  // Format: task-{containerId}-{taskId}
  const match = dragId.match(/^task-.+-(.+)$/)
  return match ? match[1] : null
}

// -----------------------------------------------------------------------------
// TaskDndContext - Shared context for cross-project drag
// -----------------------------------------------------------------------------

/**
 * A shared DndContext for multiple project task lists.
 * Handles both same-project reordering and cross-project moves.
 *
 * Key improvement: Uses visual order state during drag to enable smooth
 * cross-container animations. Items shift naturally between containers
 * instead of using transform suppression.
 */
export function TaskDndContext({
  children,
  tasksByProject,
  onTaskMove,
  onTasksReorder,
  onItemsReorder,
  getTaskById,
  getHeadingById,
}: TaskDndContextProps) {
  const [dragPreview, setDragPreview] = React.useState<DragPreviewState | null>(
    null
  )
  const [lastDroppedTaskId, setLastDroppedTaskId] = React.useState<
    string | null
  >(null)

  // Visual order state during drag: Map<containerId, dragId[]>
  // This is separate from entity data and only exists during drag
  const [visualItemsByContainer, setVisualItemsByContainer] = React.useState<
    Map<string, UniqueIdentifier[]> | null
  >(null)

  const clearLastDroppedTaskId = React.useCallback(() => {
    setLastDroppedTaskId(null)
  }, [])

  // Get visual items for a container (used by SortableContexts)
  const getVisualItems = React.useCallback(
    (containerId: string): UniqueIdentifier[] | null => {
      if (!visualItemsByContainer) return null
      return visualItemsByContainer.get(containerId) ?? null
    },
    [visualItemsByContainer]
  )

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
          sourceContainerId: data.projectId,
        })

        // Initialize visual order from entity data
        const initialVisualOrder = new Map<string, UniqueIdentifier[]>()
        for (const [containerId, tasks] of tasksByProject) {
          initialVisualOrder.set(
            containerId,
            tasks.map((t) => makeDragId(containerId, t.id))
          )
        }
        setVisualItemsByContainer(initialVisualOrder)
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
    if (!dragPreview || dragPreview.type !== 'task') return
    if (!visualItemsByContainer) return

    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as TaskDragData | undefined
    const overData = over.data.current as DropTargetData | undefined
    if (!activeData || activeData.type !== 'task') return
    if (!overData) return

    // Determine target container
    const targetContainerId =
      overData.type === 'heading' ? overData.containerId : overData.projectId
    const sourceContainerId = dragPreview.sourceContainerId

    // Find current container of the dragged item (may have moved during drag)
    let currentContainerId = sourceContainerId
    for (const [containerId, items] of visualItemsByContainer) {
      if (items.includes(active.id)) {
        currentContainerId = containerId
        break
      }
    }

    // If moving to a different container, update visual order
    if (currentContainerId !== targetContainerId) {
      setVisualItemsByContainer((prev) => {
        if (!prev) return prev

        const newMap = new Map(prev)

        // Remove from current container
        const currentItems = newMap.get(currentContainerId) ?? []
        const filteredCurrentItems = currentItems.filter(
          (id) => id !== active.id
        )
        newMap.set(currentContainerId, filteredCurrentItems)

        // Add to target container
        const targetItems = [...(newMap.get(targetContainerId) ?? [])]

        // Find insertion position
        // IMPORTANT: Use active.id (the original drag ID), NOT a new drag ID.
        // active.id never changes during drag - dnd-kit tracks items by this ID.
        if (overData.type === 'task') {
          // Insert at the position of the hovered task
          const targetDragId = makeDragId(targetContainerId, overData.taskId)
          const overIndex = targetItems.indexOf(targetDragId)
          if (overIndex !== -1) {
            targetItems.splice(overIndex, 0, active.id)
          } else {
            // Fallback: append at end
            targetItems.push(active.id)
          }
        } else {
          // Empty container or heading - append at end
          targetItems.push(active.id)
        }

        newMap.set(targetContainerId, targetItems)
        return newMap
      })
    } else if (overData.type === 'task') {
      // Same container - reorder within
      const overDragId = makeDragId(targetContainerId, overData.taskId)
      if (active.id !== overDragId) {
        setVisualItemsByContainer((prev) => {
          if (!prev) return prev

          const newMap = new Map(prev)
          const items = [...(newMap.get(targetContainerId) ?? [])]
          const oldIndex = items.indexOf(active.id)
          const newIndex = items.indexOf(overDragId)

          if (oldIndex !== -1 && newIndex !== -1) {
            newMap.set(targetContainerId, arrayMove(items, oldIndex, newIndex))
          }
          return newMap
        })
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!dragPreview) {
      setVisualItemsByContainer(null)
      return
    }

    const { active, over } = event

    if (!over) {
      setDragPreview(null)
      setVisualItemsByContainer(null)
      return
    }

    // Handle heading drags
    if (dragPreview.type === 'heading') {
      const overData = over.data.current as DropTargetData | undefined

      // Determine target container from where we dropped
      const targetContainerId =
        overData?.type === 'heading'
          ? overData.containerId
          : (overData?.projectId ?? dragPreview.containerId)

      // Headings can only reorder within their own container
      if (
        targetContainerId === dragPreview.containerId &&
        active.id !== over.id &&
        onItemsReorder
      ) {
        onItemsReorder(
          dragPreview.containerId,
          String(active.id),
          String(over.id)
        )
      }

      setDragPreview(null)
      setVisualItemsByContainer(null)
      return
    }

    // Handle task drags
    const activeData = active.data.current as TaskDragData | undefined
    const overData = over.data.current as DropTargetData | undefined

    if (!activeData || activeData.type !== 'task') {
      setDragPreview(null)
      setVisualItemsByContainer(null)
      return
    }

    // Find final container of the dragged item from visual state
    // Since we keep active.id consistent, we can search for it directly
    let finalContainerId = dragPreview.sourceContainerId
    if (visualItemsByContainer) {
      for (const [containerId, items] of visualItemsByContainer) {
        if (items.includes(active.id)) {
          finalContainerId = containerId
          break
        }
      }
    }

    // Determine insertion position from final visual order
    const finalItems = visualItemsByContainer?.get(finalContainerId) ?? []
    const draggedIndex = finalItems.findIndex((id) => id === active.id)
    let insertBeforeTaskId: string | null = null
    if (draggedIndex !== -1 && draggedIndex < finalItems.length - 1) {
      insertBeforeTaskId = extractTaskIdFromDragId(
        String(finalItems[draggedIndex + 1])
      )
    }

    if (finalContainerId !== dragPreview.sourceContainerId) {
      // Cross-project move
      onTaskMove(
        dragPreview.taskId,
        dragPreview.sourceContainerId,
        finalContainerId,
        insertBeforeTaskId
      )
      setLastDroppedTaskId(dragPreview.taskId)
    } else if (active.id !== over.id) {
      // Same-container reorder
      if (onItemsReorder) {
        // Use items reorder callback (for mixed containers with headings)
        onItemsReorder(finalContainerId, String(active.id), String(over.id))
        setLastDroppedTaskId(activeData.taskId)
      } else if (overData?.type === 'task') {
        // Fall back to task-only reorder
        const projectTasks = tasksByProject.get(finalContainerId) ?? []
        const oldIndex = projectTasks.findIndex(
          (t) => t.id === activeData.taskId
        )
        const newIndex = projectTasks.findIndex((t) => t.id === overData.taskId)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newTasks = arrayMove(projectTasks, oldIndex, newIndex)
          onTasksReorder(finalContainerId, newTasks)
          setLastDroppedTaskId(activeData.taskId)
        }
      }
    }

    setDragPreview(null)
    setVisualItemsByContainer(null)
  }

  const handleDragCancel = () => {
    setDragPreview(null)
    setVisualItemsByContainer(null)
  }

  const contextValue: TaskDndContextValue = {
    dragPreview,
    lastDroppedTaskId,
    clearLastDroppedTaskId,
    getVisualItems,
  }

  return (
    <TaskDndReactContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        // Removed restrictToVerticalAxis - items move freely for better UX
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
// Deprecated - kept for backward compatibility during migration
// -----------------------------------------------------------------------------

/**
 * @deprecated No longer needed - transforms are always applied now.
 * The visual order state in TaskDndContext handles cross-container moves.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function shouldShowDropIndicator(
  _taskId: string,
  _projectId: string,
  _dragPreview: DragPreviewState | null
): boolean {
  // Always return false - natural item shifting replaces drop indicators
  return false
}
