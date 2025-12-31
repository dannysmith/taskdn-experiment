import * as React from "react"

import { useAppData } from "@/context/app-data-context"
import { useTaskDetail } from "@/context/task-detail-context"
import { MonthCalendar } from "@/components/calendar/month-calendar"
import type { TaskStatus } from "@/types/data"

export function CalendarView() {
  const {
    data,
    getTaskById,
    updateTaskStatus,
    updateTaskScheduled,
  } = useAppData()
  const { openTask } = useTaskDetail()

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

  const handleOpenDetail = React.useCallback(
    (taskId: string) => {
      openTask(taskId)
    },
    [openTask]
  )

  return (
    <div className="h-full flex flex-col">
      <MonthCalendar
        tasks={data.tasks}
        getTaskById={getTaskById}
        onTaskScheduleChange={handleScheduleChange}
        onTaskStatusChange={handleStatusChange}
        onTaskOpenDetail={handleOpenDetail}
        className="flex-1"
      />
    </div>
  )
}
