import * as React from "react"

import { useAppData } from "@/context/app-data-context"
import { useTaskDetail } from "@/context/task-detail-context"
import { ProjectTaskGroup } from "@/components/tasks/project-task-group"
import { TaskDndContext } from "@/components/tasks/task-dnd-context"
import { ProjectCard } from "@/components/cards/project-card"
import type { Task, Project } from "@/types/data"

/** Active statuses for project cards grid */
const ACTIVE_STATUSES: Project["status"][] = ["in-progress", "ready", "planning", "blocked"]

interface AreaViewProps {
  areaId: string
  onNavigateToProject: (projectId: string) => void
}

export function AreaView({ areaId, onNavigateToProject }: AreaViewProps) {
  const {
    getAreaById,
    getProjectsByAreaId,
    getTasksByProjectId,
    getProjectCompletion,
    getTaskById,
    updateTaskTitle,
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

  return (
    <div className="space-y-8">
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

      {/* Projects with their tasks - wrapped in shared DndContext */}
      <TaskDndContext
        tasksByProject={tasksByProject}
        onTaskMove={handleTaskMove}
        onTasksReorder={handleTasksReorder}
        getTaskById={getTaskById}
      >
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            All Projects
          </h2>
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
        </section>
      </TaskDndContext>
    </div>
  )
}
