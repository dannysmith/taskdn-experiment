import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAppData } from '@/context/app-data-context'
import { useTaskDetail } from '@/context/task-detail-context'
import { useViewMode } from '@/context/view-mode-context'
import { DraggableTaskList } from '@/components/tasks/task-list'
import { MarkdownPreview } from '@/components/ui/markdown-preview'
import { KanbanBoard, useCollapsedColumns } from '@/components/kanban'
import type { Task } from '@/types/data'

interface ProjectViewProps {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const [notesExpanded, setNotesExpanded] = React.useState(false)
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
        <section className="bg-muted/30 rounded-lg border border-border/50">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
          >
            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground shrink-0 transition-transform duration-200',
                !notesExpanded && '-rotate-90'
              )}
            />
            <span className="text-sm font-medium text-muted-foreground">
              About this project
            </span>
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              notesExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="px-4 pb-4">
              <MarkdownPreview
                content={project.notes}
                className="text-muted-foreground"
              />
            </div>
          </div>
          {/* Collapsed preview - show first line or two */}
          {!notesExpanded && (
            <div className="px-4 pb-3 -mt-1">
              <p className="text-sm text-muted-foreground/70 line-clamp-2">
                {project.notes
                  .split('\n')
                  .filter((line) => line.trim() && !line.startsWith('#'))
                  .slice(0, 2)
                  .join(' ')}
              </p>
            </div>
          )}
        </section>
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
