import { useState } from "react"
import { AppSidebar } from "@/components/sidebar/left-sidebar"
import { MainContent } from "@/components/main-content"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppDataProvider, useAppData } from "@/context/app-data-context"
import { TaskDetailProvider, useTaskDetail } from "@/context/task-detail-context"
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel"
import type { Selection } from "@/types/selection"

function AppContent() {
  const [selection, setSelection] = useState<Selection | null>(null)
  const { getAreaById, getProjectById } = useAppData()

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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{getHeaderTitle(selection)}</h1>
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
