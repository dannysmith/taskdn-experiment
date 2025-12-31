import * as React from 'react'
import { Sun, Flag, Sunrise } from 'lucide-react'

// TODO(tauri-integration): Migrate to TanStack Query
import { useAppData } from '@/context/app-data-context'
import { useTaskDetailStore } from '@/store/task-detail-store'
import { SectionTaskGroup } from '@/components/tasks/section-task-group'
import { isOverdue, isToday } from '@/lib/date-utils'
import type { Task } from '@/types/data'

interface TodayViewProps {
  onNavigateToProject?: (projectId: string) => void
  onNavigateToArea?: (areaId: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TodayView(_props: TodayViewProps) {
  const {
    data,
    createTask,
    updateTaskTitle,
    toggleTaskStatus,
    getTaskContextName,
  } = useAppData()
  const { openTask } = useTaskDetailStore()

  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0]

  // Helper to check if task is active (not done/dropped)
  const isActiveTask = (task: Task) =>
    task.status !== 'done' && task.status !== 'dropped'

  // Section 1: Tasks scheduled for today
  const scheduledToday = React.useMemo(() => {
    return data.tasks.filter((t) => t.scheduled === today && isActiveTask(t))
  }, [data.tasks, today])

  // Section 2: Tasks overdue or due today (but NOT scheduled for today)
  const overdueOrDueToday = React.useMemo(() => {
    return data.tasks.filter((t) => {
      if (!isActiveTask(t)) return false
      // Skip if already in scheduled today section
      if (t.scheduled === today) return false
      // Include if due and (overdue or due today)
      if (t.due && (isOverdue(t.due) || isToday(t.due))) return true
      return false
    })
  }, [data.tasks, today])

  // Section 3: Tasks that became available today (deferUntil passed)
  const becameAvailableToday = React.useMemo(() => {
    return data.tasks.filter((t) => {
      if (!isActiveTask(t)) return false
      // Skip if already in other sections
      if (t.scheduled === today) return false
      if (t.due && (isOverdue(t.due) || isToday(t.due))) return false
      // Include if deferUntil is today (task became available)
      if (t.deferUntil && isToday(t.deferUntil)) return true
      return false
    })
  }, [data.tasks, today])

  // Reorder handlers (for now, these are no-ops since we don't persist section order)
  // Each section manages its own visual order
  const handleReorder = React.useCallback(() => {
    // Visual reorder only - not persisted
  }, [])

  const handleTitleChange = React.useCallback(
    (taskId: string, newTitle: string) => {
      updateTaskTitle(taskId, newTitle)
    },
    [updateTaskTitle]
  )

  const handleStatusToggle = React.useCallback(
    (taskId: string) => {
      toggleTaskStatus(taskId)
    },
    [toggleTaskStatus]
  )

  const handleOpenDetail = React.useCallback(
    (taskId: string) => {
      openTask(taskId)
    },
    [openTask]
  )

  // Create task handler for "Scheduled for Today" section
  const handleCreateScheduledTask = React.useCallback(
    (afterTaskId: string | null) => {
      return createTask({
        scheduled: today,
        insertAfterId: afterTaskId ?? undefined,
      })
    },
    [createTask, today]
  )

  // Create task handler for due/overdue section (set due date to today)
  const handleCreateDueTask = React.useCallback(
    (afterTaskId: string | null) => {
      return createTask({
        due: today,
        insertAfterId: afterTaskId ?? undefined,
      })
    },
    [createTask, today]
  )

  // Create task handler for "became available" section (schedule for today)
  const handleCreateAvailableTask = React.useCallback(
    (afterTaskId: string | null) => {
      return createTask({
        scheduled: today,
        insertAfterId: afterTaskId ?? undefined,
      })
    },
    [createTask, today]
  )

  // Check if there are any tasks to show
  const hasAnyTasks =
    scheduledToday.length > 0 ||
    overdueOrDueToday.length > 0 ||
    becameAvailableToday.length > 0

  return (
    <div className="space-y-6">
      {/* Scheduled for Today */}
      {scheduledToday.length > 0 && (
        <SectionTaskGroup
          sectionId="scheduled-today"
          title="Scheduled for Today"
          icon={<Sun className="size-4" />}
          tasks={scheduledToday}
          onTasksReorder={handleReorder}
          onTaskTitleChange={handleTitleChange}
          onTaskStatusToggle={handleStatusToggle}
          onTaskOpenDetail={handleOpenDetail}
          onCreateTask={handleCreateScheduledTask}
          getContextName={getTaskContextName}
          showScheduled={false}
          showDue={true}
          defaultExpanded={true}
        />
      )}

      {/* Overdue or Due Today */}
      {overdueOrDueToday.length > 0 && (
        <SectionTaskGroup
          sectionId="overdue-due-today"
          title="Overdue or Due Today"
          icon={<Flag className="size-4" />}
          tasks={overdueOrDueToday}
          onTasksReorder={handleReorder}
          onTaskTitleChange={handleTitleChange}
          onTaskStatusToggle={handleStatusToggle}
          onTaskOpenDetail={handleOpenDetail}
          onCreateTask={handleCreateDueTask}
          getContextName={getTaskContextName}
          showScheduled={true}
          showDue={true}
          defaultExpanded={true}
        />
      )}

      {/* Became Available Today */}
      {becameAvailableToday.length > 0 && (
        <SectionTaskGroup
          sectionId="became-available-today"
          title="Became Available Today"
          icon={<Sunrise className="size-4" />}
          tasks={becameAvailableToday}
          onTasksReorder={handleReorder}
          onTaskTitleChange={handleTitleChange}
          onTaskStatusToggle={handleStatusToggle}
          onTaskOpenDetail={handleOpenDetail}
          onCreateTask={handleCreateAvailableTask}
          getContextName={getTaskContextName}
          showScheduled={true}
          showDue={true}
          defaultExpanded={true}
        />
      )}

      {/* Empty state */}
      {!hasAnyTasks && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Nothing scheduled for today.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Schedule tasks to see them here.
          </p>
        </div>
      )}
    </div>
  )
}
