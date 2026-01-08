import * as React from 'react'

// TODO(tauri-integration): Migrate to TanStack Query
import { useAppData } from '@/context/app-data-context'
import type { Task } from '@/types/data'
import { useTaskDetailStore } from '@/store/task-detail-store'
import { useInboxOrder } from '@/hooks/use-inbox-order'
import { DraggableTaskList } from '@/components/tasks/task-list'
import { EmptyState } from '@/components/ui/empty-state'

export function InboxView() {
  const {
    data,
    createTask,
    updateTaskTitle,
    toggleTaskStatus,
    getTaskContextName,
  } = useAppData()
  const { openTask } = useTaskDetailStore()

  // Get all tasks with inbox status
  const inboxTasks = React.useMemo(() => {
    return data.tasks.filter((t) => t.status === 'inbox')
  }, [data.tasks])

  // Manage display order for inbox tasks
  const { setOrder, getOrderedTasks } = useInboxOrder(inboxTasks)
  const orderedInboxTasks = getOrderedTasks()

  const handleReorder = React.useCallback(
    (reorderedTasks: Task[]) => {
      setOrder(reorderedTasks)
    },
    [setOrder]
  )

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
      {orderedInboxTasks.length > 0 ? (
        <DraggableTaskList
          tasks={orderedInboxTasks}
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
        <EmptyState
          title="Inbox is empty."
          description="Newly captured tasks will appear here."
        />
      )}
    </div>
  )
}
