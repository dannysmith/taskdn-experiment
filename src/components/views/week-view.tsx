import * as React from "react"

import { useAppData } from "@/context/app-data-context"
import { useTaskDetail } from "@/context/task-detail-context"
import { WeekCalendar } from "@/components/calendar/week-calendar"
import type { Task, TaskStatus } from "@/types/data"

interface WeekViewProps {
  onNavigateToProject?: (projectId: string) => void
  onNavigateToArea?: (areaId: string) => void
}

export function WeekView({
  onNavigateToProject,
  onNavigateToArea,
}: WeekViewProps) {
  const {
    data,
    getTaskById,
    getProjectById,
    getAreaById,
    updateTaskStatus,
    updateTaskTitle,
    updateTaskScheduled,
    updateTaskDue,
  } = useAppData()
  const { openTask } = useTaskDetail()

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
        className="flex-1"
      />
    </div>
  )
}
