import { useAppData } from "@/context/app-data-context"
import { DraggableTaskList } from "@/components/tasks/task-list"
import type { Task } from "@/types/data"

interface ProjectViewProps {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const {
    getProjectById,
    getAreaById,
    getProjectCompletion,
    getTasksByProjectId,
    updateTaskTitle,
    toggleTaskStatus,
    reorderProjectTasks,
  } = useAppData()

  const project = getProjectById(projectId)

  if (!project) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    )
  }

  const area = project.areaId ? getAreaById(project.areaId) : undefined
  const completion = getProjectCompletion(projectId)
  const tasks = getTasksByProjectId(projectId)

  const handleTasksReorder = (reorderedTasks: Task[]) => {
    reorderProjectTasks(projectId, reorderedTasks.map(t => t.id))
  }

  const handleTaskTitleChange = (taskId: string, newTitle: string) => {
    updateTaskTitle(taskId, newTitle)
  }

  const handleTaskStatusToggle = (taskId: string) => {
    toggleTaskStatus(taskId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {area && (
          <p className="text-sm text-muted-foreground mb-1">{area.title}</p>
        )}
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {completion}% complete
        </p>
      </div>

      {/* Task List */}
      <DraggableTaskList
        tasks={tasks}
        projectId={projectId}
        onTasksReorder={handleTasksReorder}
        onTaskTitleChange={handleTaskTitleChange}
        onTaskStatusToggle={handleTaskStatusToggle}
      />
    </div>
  )
}
