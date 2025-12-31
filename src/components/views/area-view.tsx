import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppData } from "@/context/app-data-context"
import { useTaskDetail } from "@/context/task-detail-context"
import { useViewMode } from "@/context/view-mode-context"
import { ProjectTaskGroup } from "@/components/tasks/project-task-group"
import { TaskDndContext } from "@/components/tasks/task-dnd-context"
import { ProjectCard } from "@/components/cards/project-card"
import { MarkdownPreview } from "@/components/ui/markdown-preview"
import { AreaKanbanBoard, useAreaCollapsedColumns } from "@/components/kanban"
import type { Task, Project } from "@/types/data"

/** Active statuses for project cards grid */
const ACTIVE_STATUSES: Project["status"][] = ["in-progress", "ready", "planning", "blocked"]

interface AreaViewProps {
  areaId: string
  onNavigateToProject: (projectId: string) => void
}

export function AreaView({ areaId, onNavigateToProject }: AreaViewProps) {
  const [notesExpanded, setNotesExpanded] = React.useState(false)
  const { viewMode } = useViewMode("area")
  const { collapsedColumns, toggleColumn } = useAreaCollapsedColumns()

  const {
    getAreaById,
    getProjectsByAreaId,
    getTasksByProjectId,
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

  if (!area) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Area not found.</p>
      </div>
    )
  }

  const projects = getProjectsByAreaId(areaId)

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
        (t) => t.status === "done" || t.status === "dropped"
      ).length
      return { taskCount: tasks.length, completedTaskCount }
    },
    [tasksByProject]
  )

  const handleTasksReorder = (projectId: string, reorderedTasks: Task[]) => {
    reorderProjectTasks(projectId, reorderedTasks.map((t) => t.id))
  }

  const handleTaskMove = (taskId: string, _fromProjectId: string, toProjectId: string) => {
    moveTaskToProject(taskId, toProjectId)
  }

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

  return (
    <div className="space-y-8">
      {/* Area Notes (collapsible) */}
      {area.notes && (
        <section className="bg-muted/30 rounded-lg border border-border/50">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
          >
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
                !notesExpanded && "-rotate-90"
              )}
            />
            <span className="text-sm font-medium text-muted-foreground">
              About this area
            </span>
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              notesExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-4 pb-4">
              <MarkdownPreview
                content={area.notes}
                className="text-muted-foreground"
              />
            </div>
          </div>
          {/* Collapsed preview - show first line or two */}
          {!notesExpanded && (
            <div className="px-4 pb-3 -mt-1">
              <p className="text-sm text-muted-foreground/70 line-clamp-2">
                {area.notes.split('\n').filter(line => line.trim() && !line.startsWith('#')).slice(0, 2).join(' ')}
              </p>
            </div>
          )}
        </section>
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
              const { taskCount, completedTaskCount } = getTaskCounts(project.id)
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
          {viewMode === "list" ? "All Projects" : "Tasks by Status"}
        </h2>

        {viewMode === "list" ? (
          <TaskDndContext
            tasksByProject={tasksByProject}
            onTaskMove={handleTaskMove}
            onTasksReorder={handleTasksReorder}
            getTaskById={getTaskById}
          >
            <div className="space-y-4">
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
                    onTasksReorder={(reordered) => handleTasksReorder(project.id, reordered)}
                    onTaskTitleChange={(taskId, newTitle) => updateTaskTitle(taskId, newTitle)}
                    onTaskStatusToggle={(taskId) => toggleTaskStatus(taskId)}
                    onTaskOpenDetail={openTask}
                    onCreateTask={makeCreateTaskHandler(project.id)}
                    showScheduled={true}
                    showDue={true}
                  />
                )
              })}

              {projects.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No projects in this area yet.
                </p>
              )}
            </div>
          </TaskDndContext>
        ) : (
          <AreaKanbanBoard
            projects={projects}
            tasksByProject={tasksByProject}
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
