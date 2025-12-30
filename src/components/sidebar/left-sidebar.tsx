import * as React from "react"
import {
  CalendarIcon,
  CalendarDaysIcon,
  ChevronRight,
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
import { areas } from "@/data/areas-projects"

const navItems = [
  { name: "Today", icon: SunIcon, iconClass: "text-icon-today" },
  { name: "This Week", icon: CalendarDaysIcon, iconClass: "text-icon-week" },
  { name: "Inbox", icon: InboxIcon, iconClass: "text-icon-inbox" },
  { name: "Calendar", icon: CalendarIcon, iconClass: "text-icon-calendar" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  className="font-semibold"
                  tooltip={item.name}
                >
                  <item.icon className={item.iconClass} />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />
        {areas.map((area) => (
          <Collapsible
            key={area.id}
            defaultOpen
            className="group/collapsible group-data-[collapsible=icon]:hidden"
          >
            <SidebarGroup className="py-0">
              <SidebarGroupLabel
                render={<CollapsibleTrigger />}
                className="group/label gap-2 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
              >
                <FolderIcon className="text-icon-folder" />
                <span className="truncate">{area.name}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {area.projects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          size="sm"
                          className="pl-7"
                          tooltip={project.name}
                        >
                          <ProgressCircle
                            value={project.completion}
                            size={10}
                            strokeWidth={1.25}
                            className="!size-2.5 text-progress group-data-[collapsible=icon]:hidden"
                          />
                          <span className="truncate">{project.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
