import type { Project, ProjectStatus } from '@/types/data'
import { useViewMode, type ViewModeKey } from '@/store/view-mode-store'
import { ProjectStatusBadges } from '@/components/projects/project-status-badges'
import { ProjectStatusPill } from '@/components/projects/project-status-pill'
import { ViewToggle } from '@/components/ui/view-toggle'

interface ViewHeaderProps {
  title: string
  projectStatusCounts?: Record<string, number> | null
  currentProject?: Project | null
  viewModeKey?: ViewModeKey | null
  onProjectStatusChange?: (projectId: string, status: ProjectStatus) => void
}

export function ViewHeader({
  title,
  projectStatusCounts,
  currentProject,
  viewModeKey,
  onProjectStatusChange,
}: ViewHeaderProps) {
  return (
    <header className="@container flex h-14 shrink-0 items-center gap-2 @[400px]:gap-3 border-b px-3 @[400px]:px-4">
      <h1 className="text-lg @[400px]:text-xl font-semibold truncate shrink-0">{title}</h1>
      {projectStatusCounts && (
        <div className="hidden @[500px]:block overflow-hidden">
          <ProjectStatusBadges counts={projectStatusCounts} />
        </div>
      )}
      {currentProject && onProjectStatusChange && (
        <ProjectStatusPill
          status={currentProject.status ?? 'planning'}
          onStatusChange={(newStatus) =>
            onProjectStatusChange(currentProject.id, newStatus)
          }
        />
      )}
      {/* View mode toggle - pushed to right */}
      {viewModeKey && (
        <div className="ml-auto shrink-0">
          <HeaderViewToggle viewModeKey={viewModeKey} />
        </div>
      )}
    </header>
  )
}

/** Small component to use the view mode hook (can't use hooks conditionally) */
function HeaderViewToggle({ viewModeKey }: { viewModeKey: ViewModeKey }) {
  const { viewMode, setViewMode, availableModes } = useViewMode(viewModeKey)
  return (
    <ViewToggle
      value={viewMode}
      onChange={setViewMode}
      availableModes={availableModes}
    />
  )
}
