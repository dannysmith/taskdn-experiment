import { useState, useCallback, useEffect } from "react"
import { arrayMove } from "@dnd-kit/sortable"
import type { Task } from "@/types/data"
import type { CalendarOrder } from "@/types/calendar-order"

interface UseCalendarOrderOptions {
  /** Tasks to derive initial order from */
  tasks: Task[]
  /** The dates to track order for (e.g., days of the week) */
  dates: string[]
  /** Function to get tasks for a specific date */
  getTasksForDate: (date: string) => Task[]
}

/**
 * Hook to manage calendar task display order.
 * Separates display ordering from entity data.
 * Order is preserved when dragging within a day.
 */
export function useCalendarOrder({
  tasks,
  dates,
  getTasksForDate,
}: UseCalendarOrderOptions) {
  // Initialize order from current data
  const [order, setOrder] = useState<CalendarOrder>(() =>
    initializeOrderFromData()
  )

  function initializeOrderFromData(): CalendarOrder {
    const taskOrderByDate: Record<string, string[]> = {}

    for (const date of dates) {
      const dayTasks = getTasksForDate(date)
      taskOrderByDate[date] = dayTasks.map((t) => t.id)
    }

    return { taskOrderByDate }
  }

  // Re-initialize when dates change (e.g., navigating to different week)
  useEffect(() => {
    setOrder(initializeOrderFromData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.join(",")])

  // Sync order when tasks change (e.g., task added/removed)
  // Add new tasks to end, remove deleted tasks from order
  useEffect(() => {
    setOrder((prev) => {
      const newOrderByDate: Record<string, string[]> = {}
      let changed = false

      for (const date of dates) {
        const currentTaskIds = getTasksForDate(date).map((t) => t.id)
        const existingOrder = prev.taskOrderByDate[date] ?? []

        // Keep existing order for tasks that still exist
        const preservedOrder = existingOrder.filter((id) =>
          currentTaskIds.includes(id)
        )

        // Find new tasks not in order yet
        const newTaskIds = currentTaskIds.filter(
          (id) => !existingOrder.includes(id)
        )

        // Append new tasks to end
        const finalOrder = [...preservedOrder, ...newTaskIds]

        newOrderByDate[date] = finalOrder

        if (
          finalOrder.length !== existingOrder.length ||
          !finalOrder.every((id, i) => id === existingOrder[i])
        ) {
          changed = true
        }
      }

      return changed ? { taskOrderByDate: newOrderByDate } : prev
    })
  }, [tasks, dates, getTasksForDate])

  // Reorder tasks within the same day
  const reorderTasksInDay = useCallback(
    (date: string, activeId: string, overId: string) => {
      setOrder((prev) => {
        const dayOrder = prev.taskOrderByDate[date] ?? []
        const oldIndex = dayOrder.indexOf(activeId)
        const newIndex = dayOrder.indexOf(overId)

        if (oldIndex === -1 || newIndex === -1) return prev

        return {
          ...prev,
          taskOrderByDate: {
            ...prev.taskOrderByDate,
            [date]: arrayMove(dayOrder, oldIndex, newIndex),
          },
        }
      })
    },
    []
  )

  // Move task to a different day (updates order only - caller handles entity update)
  const moveTaskToDay = useCallback(
    (
      taskId: string,
      fromDate: string,
      toDate: string,
      insertIndex?: number
    ) => {
      setOrder((prev) => {
        const fromOrder = [...(prev.taskOrderByDate[fromDate] ?? [])]
        const toOrder = [...(prev.taskOrderByDate[toDate] ?? [])]

        // Remove from source day
        const sourceIndex = fromOrder.indexOf(taskId)
        if (sourceIndex !== -1) {
          fromOrder.splice(sourceIndex, 1)
        }

        // Add to target day at specified index or end
        const targetIndex = insertIndex ?? toOrder.length
        toOrder.splice(targetIndex, 0, taskId)

        return {
          ...prev,
          taskOrderByDate: {
            ...prev.taskOrderByDate,
            [fromDate]: fromOrder,
            [toDate]: toOrder,
          },
        }
      })
    },
    []
  )

  // Get ordered task IDs for a date
  const getOrderedTaskIds = useCallback(
    (date: string): string[] => {
      return order.taskOrderByDate[date] ?? []
    },
    [order.taskOrderByDate]
  )

  // Get ordered tasks for a date (returns Task objects)
  const getOrderedTasks = useCallback(
    (date: string, allTasksForDate: Task[]): Task[] => {
      const orderedIds = order.taskOrderByDate[date] ?? []
      const taskMap = new Map(allTasksForDate.map((t) => [t.id, t]))

      // Return tasks in order, filtering out any IDs that don't have matching tasks
      return orderedIds
        .map((id) => taskMap.get(id))
        .filter((t): t is Task => t !== undefined)
    },
    [order.taskOrderByDate]
  )

  // Get insert index when dropping on a task
  const getInsertIndex = useCallback(
    (date: string, overTaskId: string): number => {
      const dayOrder = order.taskOrderByDate[date] ?? []
      const index = dayOrder.indexOf(overTaskId)
      return index === -1 ? dayOrder.length : index
    },
    [order.taskOrderByDate]
  )

  return {
    order,
    reorderTasksInDay,
    moveTaskToDay,
    getOrderedTaskIds,
    getOrderedTasks,
    getInsertIndex,
  }
}
