import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronRight, FolderIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { Area } from "@/types/data"
import { getDragId } from "@/types/sidebar-order"
import type { DragItem } from "@/types/sidebar-order"

interface DraggableAreaProps {
  area: Area
  isSelected: boolean
  onSelect: () => void
  children: React.ReactNode
}

export function DraggableArea({
  area,
  isSelected,
  onSelect,
  children,
}: DraggableAreaProps) {
  const dragId = getDragId("area", area.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: dragId,
    data: {
      type: "area",
      id: area.id,
      containerId: null,
    } satisfies DragItem,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "opacity-50 z-50",
        isOver && "ring-2 ring-primary/20 ring-inset rounded-md"
      )}
    >
      <Collapsible
        defaultOpen
        className="group/collapsible group-data-[collapsible=icon]:hidden"
      >
        <SidebarGroup className="py-0">
          <SidebarGroupLabel
            render={<CollapsibleTrigger />}
            className={cn(
              "group/label gap-2 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer select-none",
              isSelected && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
            onClick={onSelect}
            {...attributes}
            {...listeners}
          >
            <FolderIcon className="text-icon-folder" />
            <span className="truncate">{area.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>{children}</SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </div>
  )
}
