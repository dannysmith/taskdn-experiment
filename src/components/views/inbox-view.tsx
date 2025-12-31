import * as React from 'react'

// TODO(tauri-integration): Migrate to TanStack Query
import { useAppData } from '@/context/app-data-context'
import { useTaskDetail } from '@/context/task-detail-context'
import { DraggableTaskList } from '@/components/tasks/task-list'

export function InboxView() {
  const {
    data,
    createTask,
    updateTaskTitle,
    toggleTaskStatus,
    getTaskContextName,
  } = useAppData()
  const { openTask } = useTaskDetail()

  // Get all tasks with inbox status
  const inboxTasks = React.useMemo(() => {
    return data.tasks.filter((t) => t.status === 'inbox')
  }, [data.tasks])

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
          getContextName={getTaskContextName}
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
