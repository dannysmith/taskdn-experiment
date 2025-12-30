import * as React from "react"
import {
  Ban,
  CalendarIcon,
  CalendarDaysIcon,
  ChevronRight,
  CircleCheck,
  CirclePause,
  FolderIcon,
  InboxIcon,
  SunIcon,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ProgressCircle } from "@/components/ui/progress-circle"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  appData,
  getProjectsByAreaId,
  getOrphanProjects,
  getProjectCompletion,
} from "@/data/app-data"
import type { Project, ProjectStatus } from "@/types/data"
import type { Selection, NavId } from "@/types/selection"

/**
 * Renders the appropriate status indicator for a project.
 * - planning/ready: Orange progress circle
 * - in-progress: Blue progress circle
 * - blocked: Red ban icon
 * - paused: Grey pause icon
 * - done: Green checkmark
 */
function ProjectStatusIndicator({ project }: { project: Project }) {
  const status = project.status
  const completion = getProjectCompletion(project.id)

  // Icon size to match sidebar menu icons
  const iconClass = "size-4 shrink-0"

  switch (status) {
    case "blocked":
      return <Ban className={`${iconClass} text-status-blocked`} />
    case "paused":
      return <CirclePause className={`${iconClass} text-status-paused`} />
    case "done":
      return <CircleCheck className={`${iconClass} text-status-done`} />
    case "planning":
    case "ready":
      return (
        <ProgressCircle
          value={completion}
          size={16}
          strokeWidth={2}
          className={`${iconClass} text-status-planning`}
        />
      )
    case "in-progress":
    default:
      return (
        <ProgressCircle
          value={completion}
          size={16}
          strokeWidth={2}
          className={`${iconClass} text-status-in-progress`}
        />
      )
  }
}

/**
 * Returns additional CSS classes for project title based on status.
 */
function getProjectTitleClass(status: ProjectStatus | undefined): string {
  if (status === "done" || status === "paused") {
    return "text-muted-foreground"
  }
  return ""
}

const navItems: { id: NavId; name: string; icon: typeof SunIcon; iconClass: string }[] = [
  { id: "today", name: "Today", icon: SunIcon, iconClass: "text-icon-today" },
  { id: "this-week", name: "This Week", icon: CalendarDaysIcon, iconClass: "text-icon-week" },
  { id: "inbox", name: "Inbox", icon: InboxIcon, iconClass: "text-icon-inbox" },
  { id: "calendar", name: "Calendar", icon: CalendarIcon, iconClass: "text-icon-calendar" },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selection: Selection | null
  onSelectionChange: (selection: Selection) => void
}

export function AppSidebar({ selection, onSelectionChange, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4">
        <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
          Taskdn
        </span>
      </SidebarHeader>
      <SidebarContent className="gap-0 py-2">
        <SidebarGroup className="py-0">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  className="font-semibold"
                  tooltip={item.name}
                  isActive={selection?.type === "nav" && selection.id === item.id}
                  onClick={() => onSelectionChange({ type: "nav", id: item.id })}
                >
                  <item.icon className={item.iconClass} />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />
        {appData.areas.map((area) => {
          const projects = getProjectsByAreaId(area.id)
          return (
            <Collapsible
              key={area.id}
              defaultOpen
              className="group/collapsible group-data-[collapsible=icon]:hidden"
            >
              <SidebarGroup className="py-0">
                <SidebarGroupLabel
                  render={<CollapsibleTrigger />}
                  className={`group/label gap-2 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer ${
                    selection?.type === "area" && selection.id === area.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : ""
                  }`}
                  onClick={() => onSelectionChange({ type: "area", id: area.id })}
                >
                  <FolderIcon className="text-icon-folder" />
                  <span className="truncate">{area.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {projects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                          <SidebarMenuButton
                            className="pl-7"
                            tooltip={project.title}
                            isActive={selection?.type === "project" && selection.id === project.id}
                            onClick={() => onSelectionChange({ type: "project", id: project.id })}
                          >
                            <ProjectStatusIndicator project={project} />
                            <span className={`truncate ${getProjectTitleClass(project.status)}`}>
                              {project.title}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
        {/* No Area section for orphan projects */}
        {(() => {
          const orphanProjects = getOrphanProjects()
          if (orphanProjects.length === 0) return null
          return (
            <Collapsible
              defaultOpen
              className="group/collapsible group-data-[collapsible=icon]:hidden"
            >
              <SidebarGroup className="py-0">
                <SidebarGroupLabel
                  render={<CollapsibleTrigger />}
                  className="group/label gap-2 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                >
                  <FolderIcon className="text-icon-folder-none" />
                  <span className="truncate">No Area</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {orphanProjects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                          <SidebarMenuButton
                            className="pl-7"
                            tooltip={project.title}
                            isActive={selection?.type === "project" && selection.id === project.id}
                            onClick={() => onSelectionChange({ type: "project", id: project.id })}
                          >
                            <ProjectStatusIndicator project={project} />
                            <span className={`truncate ${getProjectTitleClass(project.status)}`}>
                              {project.title}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })()}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
