import {
  getProjectById,
  getAreaById,
  getProjectCompletion,
} from "@/data/app-data"

interface ProjectViewProps {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
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

  return (
    <div className="space-y-4">
      <div>
        {area && (
          <p className="text-sm text-muted-foreground mb-1">{area.title}</p>
        )}
        <h1 className="text-2xl font-semibold">{project.title}</h1>
      </div>
      <p className="text-muted-foreground">
        {completion}% complete
      </p>
    </div>
  )
}
