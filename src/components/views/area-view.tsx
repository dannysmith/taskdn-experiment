import * as React from "react"

import { useAppData } from "@/context/app-data-context"
import { ProjectTaskGroup } from "@/components/tasks/project-task-group"
import { TaskDndContext } from "@/components/tasks/task-dnd-context"
import type { Task } from "@/types/data"

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

  const area = getAreaById(areaId)

  if (!area) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Area not found.</p>
      </div>
    )
  }

  const projects = getProjectsByAreaId(areaId)

  // Build tasksByProject map for TaskDndContext
  const tasksByProject = React.useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const project of projects) {
      map.set(project.id, getTasksByProjectId(project.id))
    }
    return map
  }, [projects, getTasksByProjectId])

  const handleTasksReorder = (projectId: string, reorderedTasks: Task[]) => {
    reorderProjectTasks(projectId, reorderedTasks.map((t) => t.id))
  }

  const handleTaskMove = (taskId: string, _fromProjectId: string, toProjectId: string) => {
    moveTaskToProject(taskId, toProjectId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{area.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Projects with their tasks - wrapped in shared DndContext */}
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
    </div>
  )
}
