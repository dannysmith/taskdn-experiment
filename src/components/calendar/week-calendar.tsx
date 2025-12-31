import * as React from "react"
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
} from "@dnd-kit/core"
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types/data"
import {
  parseCalendarTaskDragId,
  type CalendarTaskDragData,
  type DayDropData,
} from "@/types/calendar-order"
import { useCalendarOrder } from "@/hooks/use-calendar-order"
import { Button } from "@/components/ui/button"
import { DayColumn } from "./day-column"
import { TaskCardDragPreview } from "./draggable-task-card"

interface DragState {
  taskId: string
  task: Task
  sourceDate: string
  currentOverDate: string | null
}

interface TaskContext {
  projectName?: string
  areaName?: string
  projectId?: string
  areaId?: string
}

// -----------------------------------------------------------------------------
// WeekCalendar Component
// -----------------------------------------------------------------------------

interface WeekCalendarProps {
  tasks: Task[]
  /** Get task by ID */
  getTaskById: (taskId: string) => Task | undefined
  /** Get context (project/area names and IDs) for a task */
  getTaskContext?: (task: Task) => TaskContext
  /** Called when a task's scheduled date is changed via drag-drop */
  onTaskScheduleChange: (taskId: string, newDate: string | undefined) => void
  /** Called when a task's status is changed */
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void
  /** Called when a task's title is changed */
  onTaskTitleChange: (taskId: string, newTitle: string) => void
  /** Called when a task's due date is changed */
  onTaskDueChange: (taskId: string, date: string | undefined) => void
  /** Called when a task should be opened in detail view */
  onTaskOpenDetail?: (taskId: string) => void
  /** Called when navigating to a project */
  onNavigateToProject?: (projectId: string) => void
  /** Called when navigating to an area */
  onNavigateToArea?: (areaId: string) => void
  className?: string
}

/**
 * A week calendar view with drag-and-drop task scheduling.
 * Tasks can be dragged between days to change their scheduled date.
 */
export function WeekCalendar({
  tasks,
  getTaskById,
  getTaskContext,
  onTaskScheduleChange,
  onTaskStatusChange,
  onTaskTitleChange,
  onTaskDueChange,
  onTaskOpenDetail,
  onNavigateToProject,
  onNavigateToArea,
  className,
}: WeekCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  )
  const [dragState, setDragState] = React.useState<DragState | null>(null)

  // Generate the 7 days of the current week
  const weekDays = React.useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    })
  }, [currentWeekStart])

  // Date strings for the week (used by order hook)
  const weekDateStrings = React.useMemo(
    () => weekDays.map((d) => format(d, "yyyy-MM-dd")),
    [weekDays]
  )

  // Group tasks by their scheduled date (raw, unordered)
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, Task[]>()

    // Initialize all days of the week
    for (const day of weekDays) {
      map.set(format(day, "yyyy-MM-dd"), [])
    }

    // Filter to only scheduled tasks that fall within this week
    for (const task of tasks) {
      if (!task.scheduled) continue
      if (task.status === "done" || task.status === "dropped") continue

      const taskDate = new Date(task.scheduled)
      const matchingDay = weekDays.find((day) => isSameDay(day, taskDate))
      if (matchingDay) {
        const dateKey = format(matchingDay, "yyyy-MM-dd")
        const existing = map.get(dateKey) ?? []
        map.set(dateKey, [...existing, task])
      }
    }

    return map
  }, [tasks, weekDays])

  // Get tasks for a specific date (callback for order hook)
  const getTasksForDate = React.useCallback(
    (date: string): Task[] => tasksByDate.get(date) ?? [],
    [tasksByDate]
  )

  // Calendar order management (for within-day reordering)
  const { getOrderedTasks, reorderTasksInDay, moveTaskToDay, getInsertIndex } =
    useCalendarOrder({
      tasks,
      dates: weekDateStrings,
      getTasksForDate,
    })

  // Navigation handlers
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1))
  }

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  // DnD Sensors
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
      styles: { active: { opacity: "0.5" } },
    }),
  }

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as CalendarTaskDragData | undefined
    if (data?.type === "calendar-task") {
      const task = getTaskById(data.taskId)
      if (task) {
        setDragState({
          taskId: data.taskId,
          task,
          sourceDate: data.sourceDate,
          currentOverDate: null,
        })
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (!dragState) return

    const { over } = event
    if (!over) {
      setDragState((prev) => prev ? { ...prev, currentOverDate: null } : null)
      return
    }

    const overData = over.data.current as DayDropData | CalendarTaskDragData | undefined
    if (!overData) return

    // Determine which date we're over
    let overDate: string | null = null
    if (overData.type === "day") {
      overDate = overData.date
    } else if (overData.type === "calendar-task") {
      // If hovering over another task, use its date
      overDate = overData.sourceDate
    }

    if (overDate !== dragState.currentOverDate) {
      setDragState((prev) => prev ? { ...prev, currentOverDate: overDate } : null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!dragState) return

    const { active, over } = event
    if (!over) {
      setDragState(null)
      return
    }

    const overData = over.data.current as
      | DayDropData
      | CalendarTaskDragData
      | undefined
    if (!overData) {
      setDragState(null)
      return
    }

    // Parse the active item to get taskId
    const activeId = active.id as string
    const parsedActive = parseCalendarTaskDragId(activeId)
    if (!parsedActive) {
      setDragState(null)
      return
    }

    const { taskId: activeTaskId } = parsedActive
    const sourceDate = dragState.sourceDate

    // Determine target date and handling based on drop target type
    if (overData.type === "day") {
      // Dropped on a day container (not on a specific task)
      const targetDate = overData.date

      if (targetDate !== sourceDate) {
        // Cross-day move: update scheduled date and add to end of target day
        moveTaskToDay(activeTaskId, sourceDate, targetDate)
        onTaskScheduleChange(activeTaskId, targetDate)
      }
      // If same day and dropped on container, no reorder needed
    } else if (overData.type === "calendar-task") {
      // Dropped on another task
      const targetDate = overData.sourceDate
      const overTaskId = overData.taskId

      if (targetDate === sourceDate) {
        // Within-day reorder: just update order
        if (activeTaskId !== overTaskId) {
          reorderTasksInDay(sourceDate, activeTaskId, overTaskId)
        }
      } else {
        // Cross-day move with specific position
        const insertIndex = getInsertIndex(targetDate, overTaskId)
        moveTaskToDay(activeTaskId, sourceDate, targetDate, insertIndex)
        onTaskScheduleChange(activeTaskId, targetDate)
      }
    }

    setDragState(null)
  }

  const handleDragCancel = () => {
    setDragState(null)
  }

  // Month/year display
  const monthYear = format(currentWeekStart, "MMMM yyyy")

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-lg font-semibold">{monthYear}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 h-full">
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const rawTasks = tasksByDate.get(dateKey) ?? []
              const orderedTasks = getOrderedTasks(dateKey, rawTasks)
              const isDropTarget = dragState?.currentOverDate === dateKey

              return (
                <DayColumn
                  key={dateKey}
                  date={day}
                  tasks={orderedTasks}
                  getTaskContext={getTaskContext}
                  onTaskStatusChange={onTaskStatusChange}
                  onTaskTitleChange={onTaskTitleChange}
                  onTaskScheduledChange={onTaskScheduleChange}
                  onTaskDueChange={onTaskDueChange}
                  onTaskOpenDetail={onTaskOpenDetail}
                  onNavigateToProject={onNavigateToProject}
                  onNavigateToArea={onNavigateToArea}
                  isDropTarget={isDropTarget}
                />
              )
            })}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={dropAnimation}>
          {dragState && <TaskCardDragPreview task={dragState.task} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
