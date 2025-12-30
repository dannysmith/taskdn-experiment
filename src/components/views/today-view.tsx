import { useAppData } from "@/context/app-data-context"
import { TaskCard } from "@/components/cards/task-card"
import { ProjectCard } from "@/components/cards/project-card"
import { AreaCard } from "@/components/cards/area-card"
import { CardGrid } from "@/components/cards/card-grid"
import type { Task } from "@/types/data"

interface TodayViewProps {
  onNavigateToProject?: (projectId: string) => void
  onNavigateToArea?: (areaId: string) => void
}

export function TodayView({
  onNavigateToProject,
  onNavigateToArea,
}: TodayViewProps) {
  const {
    data,
    getProjectById,
    getAreaById,
    getProjectCompletion,
    getTasksByProjectId,
    getProjectsByAreaId,
    updateTaskStatus,
    updateTaskTitle,
    updateTaskScheduled,
    updateTaskDue,
  } = useAppData()

  // Get tasks scheduled for today
  const today = new Date().toISOString().split("T")[0]
  const todayTasks = data.tasks.filter(
    (t) => t.scheduled === today && t.status !== "done" && t.status !== "dropped"
  )

  // Get some active projects for demo
  const activeProjects = data.projects.filter(
    (p) => p.status === "in-progress"
  ).slice(0, 6)

  // Get all active areas for demo
  const activeAreas = data.areas.filter((a) => a.status !== "archived")

  // Helper to get project and area info for a task
  const getTaskContext = (task: Task) => {
    let projectName: string | undefined
    let areaName: string | undefined
    let projectId: string | undefined
    let areaId: string | undefined

    if (task.projectId) {
      const project = getProjectById(task.projectId)
      if (project) {
        projectName = project.title
        projectId = project.id
        // Get area from project if not directly set on task
        if (project.areaId) {
          const area = getAreaById(project.areaId)
          if (area) {
            areaName = area.title
            areaId = area.id
          }
        }
      }
    }

    // Direct area on task overrides project's area
    if (task.areaId) {
      const area = getAreaById(task.areaId)
      if (area) {
        areaName = area.title
        areaId = area.id
      }
    }

    return { projectName, areaName, projectId, areaId }
  }

  const renderTaskCard = (task: Task) => {
    const { projectName, areaName, projectId, areaId } = getTaskContext(task)

    return (
      <TaskCard
        key={task.id}
        task={task}
        projectName={projectName}
        areaName={areaName}
        onStatusChange={(newStatus) => updateTaskStatus(task.id, newStatus)}
        onTitleChange={(newTitle) => updateTaskTitle(task.id, newTitle)}
        onScheduledChange={(date) => updateTaskScheduled(task.id, date)}
        onDueChange={(date) => updateTaskDue(task.id, date)}
        onProjectClick={projectId && onNavigateToProject
          ? () => onNavigateToProject(projectId)
          : undefined
        }
        onAreaClick={areaId && onNavigateToArea
          ? () => onNavigateToArea(areaId)
          : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Card component showcase
        </p>
      </div>

      {/* Task Cards Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Task Cards</h2>
        {todayTasks.length > 0 ? (
          <CardGrid minCardWidth={280}>
            {todayTasks.map(renderTaskCard)}
          </CardGrid>
        ) : (
          <p className="text-muted-foreground text-sm">
            No tasks scheduled for today. Here are some sample tasks:
          </p>
        )}

        {/* Show some sample tasks if none scheduled for today */}
        {todayTasks.length === 0 && (
          <CardGrid minCardWidth={280}>
            {data.tasks
              .filter((t) => t.status !== "done" && t.status !== "dropped")
              .slice(0, 6)
              .map(renderTaskCard)}
          </CardGrid>
        )}
      </section>

      {/* Project Cards Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Project Cards</h2>
        <CardGrid minCardWidth={280}>
          {activeProjects.map((project) => {
            const tasks = getTasksByProjectId(project.id)
            const completion = getProjectCompletion(project.id)
            const completedCount = tasks.filter(
              (t) => t.status === "done" || t.status === "dropped"
            ).length
            const area = project.areaId
              ? getAreaById(project.areaId)
              : undefined

            return (
              <ProjectCard
                key={project.id}
                project={project}
                completion={completion}
                taskCount={tasks.length}
                completedTaskCount={completedCount}
                areaName={area?.title}
                onClick={onNavigateToProject
                  ? () => onNavigateToProject(project.id)
                  : undefined
                }
                onAreaClick={area && onNavigateToArea
                  ? () => onNavigateToArea(area.id)
                  : undefined
                }
              />
            )
          })}
        </CardGrid>
      </section>

      {/* Area Cards Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Area Cards</h2>
        <CardGrid minCardWidth={300}>
          {activeAreas.map((area) => {
            const projects = getProjectsByAreaId(area.id)
            const activeProjectCount = projects.filter(
              (p) => p.status !== "done" && p.status !== "paused"
            ).length

            return (
              <AreaCard
                key={area.id}
                area={area}
                projectCount={projects.length}
                activeProjectCount={activeProjectCount}
                onClick={onNavigateToArea
                  ? () => onNavigateToArea(area.id)
                  : undefined
                }
              />
            )
          })}
        </CardGrid>
      </section>
    </div>
  )
}
