import * as React from 'react'
import { ListTodo } from 'lucide-react'

// TODO(tauri-integration): Migrate to TanStack Query
import { useAppData } from '@/context/app-data-context'
import { useTaskDetail } from '@/context/task-detail-context'
import { useViewMode } from '@/context/view-mode-context'
import { ProjectTaskGroup } from '@/components/tasks/project-task-group'
import { SectionTaskGroup } from '@/components/tasks/section-task-group'
import { TaskDndContext } from '@/components/tasks/task-dnd-context'
import { ProjectCard } from '@/components/cards/project-card'
import { CollapsibleNotesSection } from '@/components/ui/collapsible-notes'
import { AreaKanbanBoard, useAreaCollapsedColumns } from '@/components/kanban'
import type { Task, Project } from '@/types/data'

/** Active statuses for project cards grid */
const ACTIVE_STATUSES: Project['status'][] = [
  'in-progress',
  'ready',
  'planning',
  'blocked',
]

interface AreaViewProps {
  areaId: string
  onNavigateToProject: (projectId: string) => void
}

export function AreaView({ areaId, onNavigateToProject }: AreaViewProps) {
  const { viewMode } = useViewMode('area')
  const { collapsedColumns, toggleColumn } = useAreaCollapsedColumns()

  const {
    getAreaById,
    getProjectsByAreaId,
    getTasksByProjectId,
    getAreaDirectTasks,
    getProjectCompletion,
    getTaskById,
    createTask,
    updateTaskTitle,
    updateTaskStatus,
    updateTaskScheduled,
    updateTaskDue,
    updateTaskProject,
    toggleTaskStatus,
    reorderProjectTasks,
    moveTaskToProject,
  } = useAppData()
  const { openTask } = useTaskDetail()

  const area = getAreaById(areaId)
  const projects = getProjectsByAreaId(areaId)
  const areaDirectTasks = getAreaDirectTasks(areaId)

  // Split projects into active (for grid) and all (for task groups)
  const activeProjects = React.useMemo(() => {
    return projects.filter((p) => ACTIVE_STATUSES.includes(p.status))
  }, [projects])

  // Build tasksByProject map for TaskDndContext
  const tasksByProject = React.useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const project of projects) {
      map.set(project.id, getTasksByProjectId(project.id))
    }
    return map
  }, [projects, getTasksByProjectId])

  // Get task counts for ProjectCard
  const getTaskCounts = React.useCallback(
    (projectId: string) => {
      const tasks = tasksByProject.get(projectId) ?? []
      const completedTaskCount = tasks.filter(
        (t) => t.status === 'done' || t.status === 'dropped'
      ).length
      return { taskCount: tasks.length, completedTaskCount }
    },
    [tasksByProject]
  )

  // Factory function to create task creation handlers for each project
  const makeCreateTaskHandler = React.useCallback(
    (projectId: string) => (afterTaskId: string | null) => {
      return createTask({
        projectId,
        insertAfterId: afterTaskId ?? undefined,
      })
    },
    [createTask]
  )

  // Handler for creating area-direct tasks (no project)
  const handleCreateAreaDirectTask = React.useCallback(
    (afterTaskId: string | null) => {
      return createTask({
        areaId,
        insertAfterId: afterTaskId ?? undefined,
      })
    },
    [createTask, areaId]
  )

  if (!area) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Area not found.</p>
      </div>
    )
  }

  const handleTasksReorder = (projectId: string, reorderedTasks: Task[]) => {
    reorderProjectTasks(
      projectId,
      reorderedTasks.map((t) => t.id)
    )
  }

  const handleTaskMove = (
    taskId: string,
    _fromProjectId: string,
    toProjectId: string
  ) => {
    moveTaskToProject(taskId, toProjectId)
  }

  return (
    <div className="space-y-8">
      {/* Area Notes (collapsible) */}
      {area.notes && (
        <CollapsibleNotesSection notes={area.notes} title="About this area" />
      )}

      {/* Active Projects Grid */}
      {activeProjects.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Active Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => {
              const completion = getProjectCompletion(project.id)
              const { taskCount, completedTaskCount } = getTaskCounts(
                project.id
              )
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  completion={completion}
                  taskCount={taskCount}
                  completedTaskCount={completedTaskCount}
                  onClick={() => onNavigateToProject(project.id)}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Projects/Tasks Content */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          {viewMode === 'list' ? 'All Projects' : 'Tasks by Status'}
        </h2>

        {viewMode === 'list' ? (
          <TaskDndContext
            tasksByProject={tasksByProject}
            onTaskMove={handleTaskMove}
            onTasksReorder={handleTasksReorder}
            getTaskById={getTaskById}
          >
            <div className="space-y-4">
              {/* Area-direct tasks (tasks in this area but not in any project) */}
              {areaDirectTasks.length > 0 && (
                <SectionTaskGroup
                  sectionId={`area-${areaId}-direct`}
                  title="Loose Tasks"
                  icon={<ListTodo className="size-4" />}
                  tasks={areaDirectTasks}
                  onTasksReorder={() => {
                    // Reordering area-direct tasks not yet supported
                  }}
                  onTaskTitleChange={(taskId, newTitle) =>
                    updateTaskTitle(taskId, newTitle)
                  }
                  onTaskStatusToggle={(taskId) => toggleTaskStatus(taskId)}
                  onTaskOpenDetail={openTask}
                  onCreateTask={handleCreateAreaDirectTask}
                  showScheduled={true}
                  showDue={true}
                  defaultExpanded={true}
                />
              )}

              {projects.map((project) => {
                const tasks = tasksByProject.get(project.id) ?? []
                const completion = getProjectCompletion(project.id)

                return (
                  <ProjectTaskGroup
                    key={project.id}
                    project={project}
                    tasks={tasks}
                    completion={completion}
                    onOpenProject={() => onNavigateToProject(project.id)}
                    onTasksReorder={(reordered) =>
                      handleTasksReorder(project.id, reordered)
                    }
                    onTaskTitleChange={(taskId, newTitle) =>
                      updateTaskTitle(taskId, newTitle)
                    }
                    onTaskStatusToggle={(taskId) => toggleTaskStatus(taskId)}
                    onTaskOpenDetail={openTask}
                    onCreateTask={makeCreateTaskHandler(project.id)}
                    showScheduled={true}
                    showDue={true}
                  />
                )
              })}

              {projects.length === 0 && areaDirectTasks.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No projects or tasks in this area yet.
                </p>
              )}
            </div>
          </TaskDndContext>
        ) : (
          <AreaKanbanBoard
            projects={projects}
            tasksByProject={tasksByProject}
            areaDirectTasks={areaDirectTasks}
            collapsedColumns={collapsedColumns}
            onColumnCollapseChange={toggleColumn}
            onTaskStatusChange={updateTaskStatus}
            onTaskProjectChange={updateTaskProject}
            getTaskById={getTaskById}
            onTaskTitleChange={updateTaskTitle}
            onTaskScheduledChange={updateTaskScheduled}
            onTaskDueChange={updateTaskDue}
            onTaskEditClick={openTask}
            onProjectClick={onNavigateToProject}
          />
        )}
      </section>
    </div>
  )
}
