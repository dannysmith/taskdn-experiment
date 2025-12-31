import * as React from 'react'

import { useAppData } from '@/context/app-data-context'
import { useTaskDetail } from '@/context/task-detail-context'
import { DraggableTaskList } from '@/components/tasks/task-list'
import type { Task } from '@/types/data'

export function InboxView() {
  const {
    data,
    getProjectById,
    getAreaById,
    createTask,
    updateTaskTitle,
    toggleTaskStatus,
  } = useAppData()
  const { openTask } = useTaskDetail()

  // Get all tasks with inbox status
  const inboxTasks = React.useMemo(() => {
    return data.tasks.filter((t) => t.status === 'inbox')
  }, [data.tasks])

  // Get context name (project or area) for a task
  const getContextName = React.useCallback(
    (task: Task): string | undefined => {
      if (task.projectId) {
        const project = getProjectById(task.projectId)
        return project?.title
      }
      if (task.areaId) {
        const area = getAreaById(task.areaId)
        return area?.title
      }
      return undefined
    },
    [getProjectById, getAreaById]
  )

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

  const handleCreateTask = React.useCallback(
    (afterTaskId: string | null) => {
      return createTask({
        status: 'inbox',
        insertAfterId: afterTaskId ?? undefined,
      })
    },
    [createTask]
  )

  return (
    <div className="space-y-4">
      {inboxTasks.length > 0 ? (
        <DraggableTaskList
          tasks={inboxTasks}
          projectId="inbox"
          onTasksReorder={handleReorder}
          onTaskTitleChange={handleTitleChange}
          onTaskStatusToggle={handleStatusToggle}
          onTaskOpenDetail={handleOpenDetail}
          onCreateTask={handleCreateTask}
          getContextName={getContextName}
          showScheduled={true}
          showDue={true}
        />
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Inbox is empty.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Newly captured tasks will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
