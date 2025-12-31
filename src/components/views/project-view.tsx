import * as React from 'react'

// TODO(tauri-integration): Migrate to TanStack Query
import { useAppData } from '@/context/app-data-context'
import { useTaskDetail } from '@/context/task-detail-context'
import { useViewMode } from '@/context/view-mode-context'
import { DraggableTaskList } from '@/components/tasks/task-list'
import { CollapsibleNotesSection } from '@/components/ui/collapsible-notes'
import { KanbanBoard, useCollapsedColumns } from '@/components/kanban'
import type { Task } from '@/types/data'

interface ProjectViewProps {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const { viewMode } = useViewMode('project')
  const { collapsedColumns, toggleColumn } = useCollapsedColumns()

  const {
    getProjectById,
    getTaskById,
    getAreaById,
    getTasksByProjectId,
    createTask,
    updateTaskTitle,
    updateTaskStatus,
    updateTaskScheduled,
    updateTaskDue,
    toggleTaskStatus,
    reorderProjectTasks,
  } = useAppData()
  const { openTask } = useTaskDetail()

  const project = getProjectById(projectId)
  const tasks = getTasksByProjectId(projectId)

  const handleCreateTask = React.useCallback(
    (afterTaskId: string | null) => {
      return createTask({
        projectId,
        insertAfterId: afterTaskId ?? undefined,
      })
    },
    [createTask, projectId]
  )

  if (!project) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    )
  }

  const handleTasksReorder = (reorderedTasks: Task[]) => {
    reorderProjectTasks(
      projectId,
      reorderedTasks.map((t) => t.id)
    )
  }

  const handleTaskTitleChange = (taskId: string, newTitle: string) => {
    updateTaskTitle(taskId, newTitle)
  }

  const handleTaskStatusToggle = (taskId: string) => {
    toggleTaskStatus(taskId)
  }

  return (
    <div className="space-y-6">
      {/* Project Notes (collapsible) */}
      {project.notes && (
        <CollapsibleNotesSection
          notes={project.notes}
          title="About this project"
        />
      )}

      {/* Tasks Section */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Tasks
        </h2>

        {viewMode === 'list' ? (
          <>
            <DraggableTaskList
              tasks={tasks}
              projectId={projectId}
              onTasksReorder={handleTasksReorder}
              onTaskTitleChange={handleTaskTitleChange}
              onTaskStatusToggle={handleTaskStatusToggle}
              onTaskOpenDetail={openTask}
              onCreateTask={handleCreateTask}
            />
            {tasks.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No tasks in this project yet.
              </p>
            )}
          </>
        ) : (
          <KanbanBoard
            tasks={tasks}
            collapsedColumns={collapsedColumns}
            onColumnCollapseChange={toggleColumn}
            onTaskStatusChange={updateTaskStatus}
            onTasksReorder={(_status, reorderedTasks) => {
              // For project view, we reorder by project
              reorderProjectTasks(
                projectId,
                reorderedTasks.map((t) => t.id)
              )
            }}
            getTaskById={getTaskById}
            getAreaName={(areaId) => getAreaById(areaId)?.title}
            onTaskTitleChange={updateTaskTitle}
            onTaskScheduledChange={updateTaskScheduled}
            onTaskDueChange={updateTaskDue}
            onTaskEditClick={openTask}
            onCreateTask={(status) => createTask({ projectId, status })}
          />
        )}
      </section>
    </div>
  )
}
