import { useState, useCallback, useEffect } from 'react'
import type { Task } from '@/types/data'

/** Section identifiers for Today view */
export type TodaySectionId =
  | 'scheduled-today'
  | 'overdue-due-today'
  | 'became-available-today'

interface TodaySections {
  scheduledToday: Task[]
  overdueOrDueToday: Task[]
  becameAvailableToday: Task[]
}

type SectionOrder = Record<TodaySectionId, string[]>

/**
 * Manages Today view task display order separately from entity data.
 *
 * This hook tracks the visual ordering of tasks within each Today section,
 * allowing drag-and-drop reordering. Order is preserved when tasks
 * are reordered, and the hook handles:
 * - Syncing order when task lists change
 * - Adding new tasks to the end of their sections
 * - Removing deleted tasks from the order
 *
 * @param sections - The current tasks for each Today section
 * @returns Object with ordered data and reorder functions per section
 */
export function useTodayOrder(sections: TodaySections) {
  // Initialize order from current section data
  const [sectionOrder, setSectionOrder] = useState<SectionOrder>(() => ({
    'scheduled-today': sections.scheduledToday.map((t) => t.id),
    'overdue-due-today': sections.overdueOrDueToday.map((t) => t.id),
    'became-available-today': sections.becameAvailableToday.map((t) => t.id),
  }))

  // Map section ID to tasks for sync
  const sectionToTasks: Record<TodaySectionId, Task[]> = {
    'scheduled-today': sections.scheduledToday,
    'overdue-due-today': sections.overdueOrDueToday,
    'became-available-today': sections.becameAvailableToday,
  }

  // Sync order when tasks change (added/removed)
  useEffect(() => {
    setSectionOrder((prev) => {
      let changed = false
      const newOrder: SectionOrder = { ...prev }

      for (const sectionId of Object.keys(sectionToTasks) as TodaySectionId[]) {
        const tasks = sectionToTasks[sectionId]
        const currentTaskIds = new Set(tasks.map((t) => t.id))
        const existingOrder = prev[sectionId] ?? []

        // Keep existing order for tasks that still exist
        const preservedOrder = existingOrder.filter((id) =>
          currentTaskIds.has(id)
        )

        // Find new tasks not in order yet
        const existingIds = new Set(existingOrder)
        const newTaskIds = tasks
          .filter((t) => !existingIds.has(t.id))
          .map((t) => t.id)

        // Append new tasks to end
        const finalOrder = [...preservedOrder, ...newTaskIds]

        if (
          finalOrder.length !== existingOrder.length ||
          !finalOrder.every((id, i) => id === existingOrder[i])
        ) {
          changed = true
          newOrder[sectionId] = finalOrder
        }
      }

      return changed ? newOrder : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sections.scheduledToday,
    sections.overdueOrDueToday,
    sections.becameAvailableToday,
  ])

  // Set section order directly (from reordered tasks array)
  const setSectionTaskOrder = useCallback(
    (sectionId: TodaySectionId, reorderedTasks: Task[]) => {
      setSectionOrder((prev) => ({
        ...prev,
        [sectionId]: reorderedTasks.map((t) => t.id),
      }))
    },
    []
  )

  // Get ordered tasks for a section (returns Task objects in display order)
  const getOrderedTasks = useCallback(
    (sectionId: TodaySectionId): Task[] => {
      const tasks = sectionToTasks[sectionId]
      const orderedIds = sectionOrder[sectionId] ?? []
      const taskMap = new Map(tasks.map((t) => [t.id, t]))

      return orderedIds
        .map((id) => taskMap.get(id))
        .filter((t): t is Task => t !== undefined)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sectionOrder,
      sections.scheduledToday,
      sections.overdueOrDueToday,
      sections.becameAvailableToday,
    ]
  )

  return {
    sectionOrder,
    setSectionTaskOrder,
    getOrderedTasks,
  }
}
