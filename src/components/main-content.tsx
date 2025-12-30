import type { Selection } from "@/types/selection"
import { TodayView } from "@/components/views/today-view"
import { WeekView } from "@/components/views/week-view"
import { InboxView } from "@/components/views/inbox-view"
import { CalendarView } from "@/components/views/calendar-view"
import { AreaView } from "@/components/views/area-view"
import { ProjectView } from "@/components/views/project-view"

interface MainContentProps {
  selection: Selection | null
  onSelectionChange: (selection: Selection) => void
}

export function MainContent({ selection, onSelectionChange }: MainContentProps) {
  if (!selection) {
    return (
      <div className="text-muted-foreground text-sm">
        Select a project from the sidebar to get started.
      </div>
    )
  }

  switch (selection.type) {
    case "nav":
      switch (selection.id) {
        case "today":
          return <TodayView />
        case "this-week":
          return <WeekView />
        case "inbox":
          return <InboxView />
        case "calendar":
          return <CalendarView />
      }
      break
    case "area":
      return (
        <AreaView
          areaId={selection.id}
          onNavigateToProject={(projectId) =>
            onSelectionChange({ type: "project", id: projectId })
          }
        />
      )
    case "project":
      return <ProjectView projectId={selection.id} />
  }
}
