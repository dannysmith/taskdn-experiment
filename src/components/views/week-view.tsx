import * as React from 'react'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'

// TODO(tauri-integration): Migrate to TanStack Query
import { useAppData } from '@/context/app-data-context'
import { useTaskDetail } from '@/context/task-detail-context'
import { useViewMode } from '@/context/view-mode-context'
import { WeekCalendar } from '@/components/calendar/week-calendar'
import { KanbanBoard, useCollapsedColumns } from '@/components/kanban'
import type { Task, TaskStatus } from '@/types/data'

interface WeekViewProps {
  onNavigateToProject?: (projectId: string) => void
  onNavigateToArea?: (areaId: string) => void
}

export function WeekView({
  onNavigateToProject,
  onNavigateToArea,
}: WeekViewProps) {
  const { viewMode } = useViewMode('this-week')
  const { collapsedColumns, toggleColumn } = useCollapsedColumns()

  const {
    data,
    getTaskById,
    getProjectById,
    getAreaById,
    createTask,
    updateTaskStatus,
    updateTaskTitle,
    updateTaskScheduled,
    updateTaskDue,
  } = useAppData()
  const { openTask } = useTaskDetail()

  // Filter tasks for this week (scheduled or due within the week)
  const thisWeekTasks = React.useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const interval = { start: weekStart, end: weekEnd }

    return data.tasks.filter((task) => {
      // Exclude done and dropped tasks from Kanban (but calendar may still show them)
      if (
        viewMode === 'kanban' &&
        (task.status === 'done' || task.status === 'dropped')
      ) {
        return false
      }

      // Check if scheduled date is within this week
      if (task.scheduled) {
        try {
          const scheduledDate = parseISO(task.scheduled)
          if (isWithinInterval(scheduledDate, interval)) {
            return true
          }
        } catch {
          // Invalid date, skip
        }
      }

      // Check if due date is within this week
      if (task.due) {
        try {
          const dueDate = parseISO(task.due)
          if (isWithinInterval(dueDate, interval)) {
            return true
          }
        } catch {
          // Invalid date, skip
        }
      }

      return false
    })
  }, [data.tasks, viewMode])

  // Get context (project/area names and IDs) for a task
  const getTaskContext = React.useCallback(
    (task: Task) => {
      let projectName: string | undefined
      let areaName: string | undefined
      let projectId: string | undefined
      let areaId: string | undefined

      if (task.projectId) {
        const project = getProjectById(task.projectId)
        if (project) {
          projectName = project.title
          projectId = project.id
          // Get area from project if not directly set on task
          if (project.areaId) {
            const area = getAreaById(project.areaId)
            if (area) {
              areaName = area.title
              areaId = area.id
            }
          }
        }
      }

      // Direct area on task overrides project's area
      if (task.areaId) {
        const area = getAreaById(task.areaId)
        if (area) {
          areaName = area.title
          areaId = area.id
        }
      }

      return { projectName, areaName, projectId, areaId }
    },
    [getProjectById, getAreaById]
  )

  const handleScheduleChange = React.useCallback(
    (taskId: string, newDate: string | undefined) => {
      updateTaskScheduled(taskId, newDate)
    },
    [updateTaskScheduled]
  )

  const handleStatusChange = React.useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      updateTaskStatus(taskId, newStatus)
    },
    [updateTaskStatus]
  )

  const handleTitleChange = React.useCallback(
    (taskId: string, newTitle: string) => {
      updateTaskTitle(taskId, newTitle)
    },
    [updateTaskTitle]
  )

  const handleDueChange = React.useCallback(
    (taskId: string, date: string | undefined) => {
      updateTaskDue(taskId, date)
    },
    [updateTaskDue]
  )

  const handleOpenDetail = React.useCallback(
    (taskId: string) => {
      openTask(taskId)
    },
    [openTask]
  )

  return (
    <div className="h-full flex flex-col">
      {viewMode === 'calendar' ? (
        <WeekCalendar
          tasks={data.tasks}
          getTaskById={getTaskById}
          getTaskContext={getTaskContext}
          onTaskScheduleChange={handleScheduleChange}
          onTaskStatusChange={handleStatusChange}
          onTaskTitleChange={handleTitleChange}
          onTaskDueChange={handleDueChange}
          onTaskOpenDetail={handleOpenDetail}
          onNavigateToProject={onNavigateToProject}
          onNavigateToArea={onNavigateToArea}
          onCreateTask={(scheduledDate) =>
            createTask({ scheduled: scheduledDate })
          }
          className="flex-1"
        />
      ) : (
        <KanbanBoard
          tasks={thisWeekTasks}
          collapsedColumns={collapsedColumns}
          onColumnCollapseChange={toggleColumn}
          onTaskStatusChange={handleStatusChange}
          getTaskById={getTaskById}
          getProjectName={(projectId) => getProjectById(projectId)?.title}
          getAreaName={(areaId) => getAreaById(areaId)?.title}
          onTaskTitleChange={handleTitleChange}
          onTaskScheduledChange={handleScheduleChange}
          onTaskDueChange={handleDueChange}
          onTaskEditClick={handleOpenDetail}
          onProjectClick={onNavigateToProject}
          onAreaClick={onNavigateToArea}
          onCreateTask={(status) => createTask({ status })}
        />
      )}
    </div>
  )
}
