import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ProjectStatusIndicator, getProjectTitleClass } from "@/components/sidebar/draggable-project"
import type { Project, ProjectStatus } from "@/types/data"

interface ProjectHeaderProps {
  project: Project
  completion: number
  isExpanded: boolean
  onToggleExpand: () => void
  onOpenProject: () => void
}

/**
 * Get a human-readable label for project status
 */
function getStatusLabel(status: ProjectStatus | undefined): string {
  switch (status) {
    case "planning":
      return "Planning"
    case "ready":
      return "Ready"
    case "in-progress":
      return "In Progress"
    case "blocked":
      return "Blocked"
    case "paused":
      return "Paused"
    case "done":
      return "Done"
    default:
      return "In Progress"
  }
}

/**
 * Get badge variant based on project status
 */
function getStatusBadgeVariant(status: ProjectStatus | undefined): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "blocked":
      return "destructive"
    case "done":
    case "paused":
      return "secondary"
    case "planning":
    case "ready":
      return "outline"
    case "in-progress":
    default:
      return "default"
  }
}

/**
 * A section header for a project, showing status indicator, title, and status badge.
 * - Click to expand/collapse
 * - Double-click to open project view
 */
export function ProjectHeader({
  project,
  completion,
  isExpanded,
  onToggleExpand,
  onOpenProject,
}: ProjectHeaderProps) {
  const handleClick = () => {
    onToggleExpand()
  }

  const handleDoubleClick = () => {
    onOpenProject()
  }

  const statusLabel = getStatusLabel(project.status)
  const badgeVariant = getStatusBadgeVariant(project.status)

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-1 cursor-pointer select-none",
        "border-b border-border/60",
        "hover:bg-muted/30 transition-colors"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Expand/collapse chevron */}
      <ChevronRight
        className={cn(
          "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
          isExpanded && "rotate-90"
        )}
      />

      {/* Status indicator (progress circle or icon) */}
      <ProjectStatusIndicator status={project.status} completion={completion} />

      {/* Project title */}
      <span
        className={cn(
          "font-semibold text-sm truncate flex-1",
          getProjectTitleClass(project.status)
        )}
      >
        {project.title}
      </span>

      {/* Status badge */}
      <Badge variant={badgeVariant} className="text-[10px] h-4 px-1.5">
        {statusLabel}
      </Badge>
    </div>
  )
}
