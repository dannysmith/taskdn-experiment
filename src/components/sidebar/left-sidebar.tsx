import * as React from "react"
import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { useAppData } from "@/context/app-data-context"
import { useSidebarOrder } from "@/hooks/use-sidebar-order"
import { DraggableArea } from "./draggable-area"
import { DraggableProject } from "./draggable-project"
import type { Selection, NavId } from "@/types/selection"
import { getDragId, ORPHAN_CONTAINER_ID } from "@/types/sidebar-order"
import type { DragItem } from "@/types/sidebar-order"

// -----------------------------------------------------------------------------
// Nav Items
// -----------------------------------------------------------------------------

const navItems: { id: NavId; name: string; icon: typeof SunIcon; iconClass: string }[] = [
  { id: "today", name: "Today", icon: SunIcon, iconClass: "text-icon-today" },
  { id: "this-week", name: "This Week", icon: CalendarDaysIcon, iconClass: "text-icon-week" },
  { id: "inbox", name: "Inbox", icon: InboxIcon, iconClass: "text-icon-inbox" },
  { id: "calendar", name: "Calendar", icon: CalendarIcon, iconClass: "text-icon-calendar" },
]

// -----------------------------------------------------------------------------
// App Sidebar
// -----------------------------------------------------------------------------

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selection: Selection | null
  onSelectionChange: (selection: Selection) => void
}

export function AppSidebar({ selection, onSelectionChange, ...props }: AppSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const { getProjectCompletion } = useAppData()
  const {
    orderedAreas,
    orderedOrphanProjects,
    getOrderedProjects,
    reorderAreas,
    reorderProjectsInArea,
    moveProjectToArea,
  } = useSidebarOrder()

  // Track active drag item
  const [activeItem, setActiveItem] = useState<DragItem | null>(null)

  // Sensors with activation constraint (8px to distinguish click from drag)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Custom collision detection for nested sortables
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // First check pointer-based collisions
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    // Fall back to rect intersection
    return rectIntersection(args)
  }, [])

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragItem | undefined
    if (data) {
      setActiveItem(data)
    }
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeData = active.data.current as DragItem | undefined
      const overData = over.data.current as DragItem | undefined

      if (!activeData || activeData.type !== "project") return

      // Determine target container
      let overContainerId: string | null = null

      if (overData?.type === "project") {
        overContainerId = overData.containerId
      } else if (overData?.type === "area") {
        // Dropping on an area header - use that area as container
        overContainerId = overData.id
      } else {
        // Might be dropping on the orphan container itself
        const overId = over.id.toString()
        if (overId === ORPHAN_CONTAINER_ID) {
          overContainerId = ORPHAN_CONTAINER_ID
        }
      }

      if (overContainerId === null) return

      const activeContainerId = activeData.containerId ?? ORPHAN_CONTAINER_ID

      // Cross-container move
      if (activeContainerId !== overContainerId) {
        moveProjectToArea(activeData.id, activeContainerId, overContainerId)
      }
    },
    [moveProjectToArea]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveItem(null)

      if (!over || active.id === over.id) return

      const activeData = active.data.current as DragItem | undefined
      const overData = over.data.current as DragItem | undefined

      if (!activeData || !overData) return

      // Reorder areas
      if (activeData.type === "area" && overData.type === "area") {
        reorderAreas(activeData.id, overData.id)
      }

      // Reorder projects within same container
      if (
        activeData.type === "project" &&
        overData.type === "project" &&
        activeData.containerId === overData.containerId
      ) {
        const containerId = activeData.containerId ?? ORPHAN_CONTAINER_ID
        reorderProjectsInArea(containerId, activeData.id, overData.id)
      }
    },
    [reorderAreas, reorderProjectsInArea]
  )

  // Get drag item IDs for SortableContext
  const areaIds = orderedAreas.map((a) => getDragId("area", a.id))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4">
        <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
          Taskdn
        </span>
      </SidebarHeader>

      <DndContext
        sensors={isCollapsed ? [] : sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SidebarContent className="gap-0 py-2">
          {/* Navigation Items */}
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

          {/* Sortable Areas */}
          <SortableContext items={areaIds} strategy={verticalListSortingStrategy}>
            {orderedAreas.map((area) => {
              const projects = getOrderedProjects(area.id)
              const projectIds = projects.map((p) => getDragId("project", p.id))

              return (
                <DraggableArea
                  key={area.id}
                  area={area}
                  isSelected={selection?.type === "area" && selection.id === area.id}
                  onSelect={() => onSelectionChange({ type: "area", id: area.id })}
                >
                  <SidebarMenu>
                    <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
                      {projects.map((project) => (
                        <DraggableProject
                          key={project.id}
                          project={project}
                          containerId={area.id}
                          isSelected={selection?.type === "project" && selection.id === project.id}
                          onSelect={() => onSelectionChange({ type: "project", id: project.id })}
                          completion={getProjectCompletion(project.id)}
                        />
                      ))}
                    </SortableContext>
                  </SidebarMenu>
                </DraggableArea>
              )
            })}
          </SortableContext>

          {/* No Area Section (always visible for drop target) */}
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
                    {orderedOrphanProjects.length === 0 ? (
                      <SidebarMenuItem>
                        <div className="h-8 mx-2 my-1 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Drop here</span>
                        </div>
                      </SidebarMenuItem>
                    ) : (
                      <SortableContext
                        items={orderedOrphanProjects.map((p) => getDragId("project", p.id))}
                        strategy={verticalListSortingStrategy}
                      >
                        {orderedOrphanProjects.map((project) => (
                          <DraggableProject
                            key={project.id}
                            project={project}
                            containerId={ORPHAN_CONTAINER_ID}
                            isSelected={selection?.type === "project" && selection.id === project.id}
                            onSelect={() =>
                              onSelectionChange({ type: "project", id: project.id })
                            }
                            completion={getProjectCompletion(project.id)}
                          />
                        ))}
                      </SortableContext>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && <DragPreview item={activeItem} />}
        </DragOverlay>
      </DndContext>

      <SidebarRail />
    </Sidebar>
  )
}

// -----------------------------------------------------------------------------
// Drag Preview
// -----------------------------------------------------------------------------

function DragPreview({ item }: { item: DragItem }) {
  const { getAreaById, getProjectById } = useAppData()

  if (item.type === "area") {
    const area = getAreaById(item.id)
    if (!area) return null

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-sidebar rounded-md shadow-lg border border-border">
        <FolderIcon className="size-4 text-icon-folder" />
        <span className="font-semibold text-sm">{area.title}</span>
      </div>
    )
  }

  if (item.type === "project") {
    const project = getProjectById(item.id)
    if (!project) return null

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-sidebar rounded-md shadow-lg border border-border">
        <span className="text-sm">{project.title}</span>
      </div>
    )
  }

  return null
}
