import { getAreaById, getProjectsByAreaId } from "@/data/app-data"

interface AreaViewProps {
  areaId: string
}

export function AreaView({ areaId }: AreaViewProps) {
  const area = getAreaById(areaId)

  if (!area) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Area not found.</p>
      </div>
    )
  }

  const projects = getProjectsByAreaId(areaId)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{area.title}</h1>
      <p className="text-muted-foreground">
        {projects.length} project{projects.length !== 1 ? "s" : ""} in this area.
      </p>
    </div>
  )
}
