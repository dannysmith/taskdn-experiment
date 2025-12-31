import { useState, useMemo } from "react"
import { AppSidebar } from "@/components/sidebar/left-sidebar"
import { MainContent } from "@/components/main-content"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppDataProvider, useAppData } from "@/context/app-data-context"
import { TaskDetailProvider, useTaskDetail } from "@/context/task-detail-context"
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel"
import { ProjectStatusBadges } from "@/components/projects/project-status-badges"
import { ProjectStatusPill } from "@/components/projects/project-status-pill"
import type { Selection } from "@/types/selection"

function AppContent() {
  const [selection, setSelection] = useState<Selection | null>(null)
  const { getAreaById, getProjectById, getProjectsByAreaId, updateProjectStatus } = useAppData()

  // Get project status counts for the current area (if viewing an area)
  const projectStatusCounts = useMemo(() => {
    if (selection?.type !== "area") return null
    const projects = getProjectsByAreaId(selection.id)
    const counts: Record<string, number> = {}
    for (const project of projects) {
      const status = project.status ?? "planning"
      counts[status] = (counts[status] ?? 0) + 1
    }
    return counts
  }, [selection, getProjectsByAreaId])

  // Get current project (if viewing a project)
  const currentProject = useMemo(() => {
    if (selection?.type !== "project") return null
    return getProjectById(selection.id) ?? null
  }, [selection, getProjectById])

  function getHeaderTitle(selection: Selection | null): string {
    if (!selection) return "Dashboard"

    switch (selection.type) {
      case "nav":
        switch (selection.id) {
          case "today": return "Today"
          case "this-week": return "This Week"
          case "inbox": return "Inbox"
          case "calendar": return "Calendar"
        }
        break
      case "area":
        return getAreaById(selection.id)?.title ?? "Area"
      case "project":
        return getProjectById(selection.id)?.title ?? "Project"
    }
    return "Dashboard"
  }

  const { isOpen: isDetailOpen } = useTaskDetail()

  return (
    <SidebarProvider>
      <AppSidebar selection={selection} onSelectionChange={setSelection} />
      <SidebarInset className="flex flex-col overflow-hidden min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <h1 className="text-xl font-semibold">{getHeaderTitle(selection)}</h1>
          {projectStatusCounts && (
            <ProjectStatusBadges counts={projectStatusCounts} />
          )}
          {currentProject && (
            <ProjectStatusPill
              status={currentProject.status ?? "planning"}
              onStatusChange={(newStatus) => updateProjectStatus(currentProject.id, newStatus)}
            />
          )}
        </header>
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto p-6">
            <MainContent selection={selection} onSelectionChange={setSelection} />
          </main>
          {isDetailOpen && (
            <aside className="w-[400px] border-l bg-background flex-shrink-0 overflow-hidden">
              <TaskDetailPanel />
            </aside>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function App() {
  return (
    <AppDataProvider>
      <TaskDetailProvider>
        <AppContent />
      </TaskDetailProvider>
    </AppDataProvider>
  )
}

export default App
