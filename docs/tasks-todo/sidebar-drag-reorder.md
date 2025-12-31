# Sidebar Drag & Reorder Implementation Plan

## Overview

Implement drag-and-drop reordering for the sidebar, enabling:

1. Reordering projects within an area
2. Reordering areas themselves
3. Moving a project from one area to another (changes entity data)

## Library Choice

**@dnd-kit** - Selected for:

- Best React 19 compatibility among options
- Smallest bundle size (~19 kB)
- Hooks-based API aligns with shadcn/React patterns
- Built-in keyboard support (matches keyboard-first UI principle)
- First-class support for sortable lists and cross-container moves

## Architecture

### Two Separate Concerns

**1. Entity Data (mutable)** - The actual app data including project-to-area assignments

- Wrapped in React context (`AppDataProvider`)
- Moving a project between areas modifies `project.areaId` here
- Eventually syncs to backend/files

**2. Display Order (separate)** - The order items appear in the sidebar

- Stored in `SidebarOrder` state
- Reordering areas/projects updates this
- Eventually persists to separate ordering file

This separation is critical because:

- Reordering within an area = display preference only
- Moving to different area = actual data change + display update
- In final Tauri app, these persist to different places

### Data Structures

```typescript
// src/types/sidebar-order.ts

interface SidebarOrder {
  // Order of areas in the sidebar (array of area IDs)
  areaOrder: string[]

  // Order of projects within each area (areaId -> array of projectIds)
  // Key "__orphan__" holds order for projects with no area
  projectOrder: Record<string, string[]>
}

// Drag item identification (prefixed to avoid collisions)
type DragItemType = 'area' | 'project'
interface DragItem {
  type: DragItemType
  id: string // Original ID (e.g., "health-1")
  dragId: string // Prefixed ID for dnd-kit (e.g., "project-health-1")
  containerId: string | null // Area ID or null for orphans
}
```

### State Management

**AppDataProvider** - Mutable entity data:

```typescript
// src/context/app-data-context.tsx

interface AppDataContextValue {
  data: AppData
  updateProjectArea: (projectId: string, newAreaId: string | null) => void
  // Future: other mutations as needed
}
```

**useSidebarOrder** - Display ordering:

```typescript
// src/hooks/use-sidebar-order.ts

function useSidebarOrder() {
  const { data } = useAppData()
  const [order, setOrder] = useState<SidebarOrder>(() =>
    initializeOrderFromData(data)
  )

  return {
    order,
    reorderAreas: (activeId: string, overId: string) => { ... },
    reorderProjectsInArea: (areaId: string, activeId: string, overId: string) => { ... },
    moveProjectToArea: (projectId: string, toAreaId: string | null, insertIndex?: number) => { ... },
  }
}
```

## Implementation Steps

### Step 1: Install Dependencies

```bash
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Step 2: Create AppDataProvider Context

Create `src/context/app-data-context.tsx`:

1. Initialize state from static `appData` import
2. Expose `data` (current state) and mutation functions
3. `updateProjectArea(projectId, newAreaId)` - modifies project's `areaId`

```typescript
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => structuredClone(appData))

  const updateProjectArea = useCallback((projectId: string, newAreaId: string | null) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, areaId: newAreaId ?? undefined } : p
      )
    }))
  }, [])

  return (
    <AppDataContext.Provider value={{ data, updateProjectArea }}>
      {children}
    </AppDataContext.Provider>
  )
}
```

Update helper functions to accept `data` parameter instead of reading from static import, OR create hook versions that read from context.

### Step 3: Create Type Definitions

Create `src/types/sidebar-order.ts` with:

- `SidebarOrder` interface
- `DragItem` type for tracking active drag
- Constants for special keys (e.g., `ORPHAN_CONTAINER = "__orphan__"`)

### Step 4: Create Order Management Hook

Create `src/hooks/use-sidebar-order.ts`:

1. **Initialize from data**: Derive initial order from context data
   - `areaOrder`: `data.areas.map(a => a.id)`
   - `projectOrder[areaId]`: Projects filtered by area
   - `projectOrder["__orphan__"]`: Projects with no area

2. **Sync on data changes**: If a project's area changes externally, update order arrays

3. **Reorder functions**:
   - `reorderAreas(activeId, overId)` - Move area in areaOrder array
   - `reorderProjectsInArea(containerId, activeId, overId)` - Move project within same container
   - `moveProjectToArea(projectId, toAreaId, insertIndex)` - Cross-container move:
     1. Remove from source container's order array
     2. Add to target container's order array at insertIndex
     3. Call `updateProjectArea()` to update entity data

### Step 5: Create Draggable Components

#### DraggableArea Component

```typescript
// src/components/sidebar/draggable-area.tsx

function DraggableArea({ area, children, isSelected, onSelect }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `area-${area.id}`,  // Prefixed ID
    data: { type: 'area', id: area.id } as DragItem,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Collapsible ref={setNodeRef} style={style} {...attributes}>
      <SidebarGroupLabel
        {...listeners}  // Drag handle on the label
        onClick={onSelect}
        // ... existing props
      >
        {/* Area content */}
      </SidebarGroupLabel>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
```

#### DraggableProject Component

```typescript
// src/components/sidebar/draggable-project.tsx

function DraggableProject({
  project,
  containerId,
  isSelected,
  onSelect,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `project-${project.id}`, // Prefixed ID
    data: { type: 'project', id: project.id, containerId } as DragItem,
  })

  // ... similar structure
}
```

### Step 6: Update Sidebar Component

Modify `left-sidebar.tsx`:

**Key changes:**

1. **Read from context** instead of static import:

   ```typescript
   const { data } = useAppData()
   const { order, reorderAreas, reorderProjectsInArea, moveProjectToArea } =
     useSidebarOrder()
   ```

2. **Configure sensors with activation constraint** (fixes click vs drag conflict):

   ```typescript
   const sensors = useSensors(
     useSensor(PointerSensor, {
       activationConstraint: {
         distance: 8, // Must move 8px before drag starts
       },
     }),
     useSensor(KeyboardSensor, {
       coordinateGetter: sortableKeyboardCoordinates,
     })
   )
   ```

3. **Use custom collision detection** (fixes nested sortables):

   ```typescript
   import { pointerWithin, rectIntersection } from '@dnd-kit/core'

   // Custom strategy that handles nested containers
   const collisionDetection = useCallback((args) => {
     // First check if over a droppable container
     const pointerCollisions = pointerWithin(args)
     if (pointerCollisions.length > 0) return pointerCollisions
     // Fall back to rect intersection
     return rectIntersection(args)
   }, [])
   ```

4. **Wrap with DndContext**:

   ```typescript
   <DndContext
     sensors={sensors}
     collisionDetection={collisionDetection}
     onDragStart={handleDragStart}
     onDragOver={handleDragOver}
     onDragEnd={handleDragEnd}
   >
   ```

5. **Always render "No Area" section** (fixes disappearing drop target):

   ```typescript
   // Remove the early return when empty
   <DroppableContainer id="__orphan__">
     <SidebarGroupLabel>No Area</SidebarGroupLabel>
     {order.projectOrder["__orphan__"]?.length === 0 ? (
       <EmptyDropZone />  // Visible drop target even when empty
     ) : (
       <SortableContext items={order.projectOrder["__orphan__"] ?? []}>
         {/* projects */}
       </SortableContext>
     )}
   </DroppableContainer>
   ```

6. **Disable DnD in collapsed mode**:

   ```typescript
   const { state } = useSidebar()
   const isCollapsed = state === 'collapsed'

   // Pass to DndContext or conditionally render without it
   <DndContext
     sensors={isCollapsed ? [] : sensors}  // No sensors = no drag
     // ...
   >
   ```

### Step 7: Implement Drag Handlers

```typescript
const [activeItem, setActiveItem] = useState<DragItem | null>(null)

function handleDragStart(event: DragStartEvent) {
  const { active } = event
  setActiveItem(active.data.current as DragItem)
}

function handleDragOver(event: DragOverEvent) {
  const { active, over } = event
  if (!over) return

  const activeData = active.data.current as DragItem
  const overData = over.data.current as DragItem | undefined

  // Only handle project cross-container moves here
  if (activeData.type !== 'project') return

  const activeContainer = activeData.containerId
  const overContainer = overData?.containerId ?? over.id // Might be dropping on container itself

  if (activeContainer !== overContainer) {
    // Move to new container (updates both order and entity data)
    moveProjectToArea(activeData.id, overContainer as string | null)
  }
}

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  setActiveItem(null)

  if (!over) return

  const activeData = active.data.current as DragItem
  const overData = over.data.current as DragItem

  if (activeData.type === 'area' && overData?.type === 'area') {
    if (active.id !== over.id) {
      reorderAreas(activeData.id, overData.id)
    }
  } else if (activeData.type === 'project' && overData?.type === 'project') {
    if (
      active.id !== over.id &&
      activeData.containerId === overData.containerId
    ) {
      reorderProjectsInArea(activeData.containerId!, activeData.id, overData.id)
    }
  }
}
```

### Step 8: Add Visual Feedback

```typescript
<DragOverlay dropAnimation={dropAnimation}>
  {activeItem?.type === 'area' && (
    <AreaDragPreview area={getAreaById(activeItem.id)} />
  )}
  {activeItem?.type === 'project' && (
    <ProjectDragPreview project={getProjectById(activeItem.id)} />
  )}
</DragOverlay>
```

**CSS for drag states** (add to components):

```typescript
// On draggable items
className={cn(
  "transition-shadow",
  isDragging && "opacity-50 shadow-lg ring-2 ring-primary/20",
  isOver && "bg-accent/50"
)}
```

**Empty drop zone for "No Area":**

```typescript
function EmptyDropZone() {
  return (
    <div className="h-8 mx-2 my-1 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
      <span className="text-xs text-muted-foreground">Drop here</span>
    </div>
  )
}
```

### Step 9: Keyboard Support

Already configured in Step 6 via `KeyboardSensor`. Enables:

- Tab to focus draggable items
- Space/Enter to pick up
- Arrow keys to move
- Space/Enter to drop
- Escape to cancel

### Step 10: Handle Edge Cases

1. **Collapsed areas**: When dropping a project on a collapsed area header, add to end of that area's project list

2. **Empty areas**: Show subtle drop indicator when hovering over area with no projects

3. **Drag constraints**: Projects can only be dropped into project containers (not onto the nav items section)

4. **Self-drop**: Ignore drops where active === over

## File Structure

```
src/
├── components/
│   └── sidebar/
│       ├── left-sidebar.tsx       # Updated with DndContext
│       ├── draggable-area.tsx     # New - sortable area wrapper
│       ├── draggable-project.tsx  # New - sortable project wrapper
│       └── drag-overlay.tsx       # New - visual feedback during drag
├── context/
│   └── app-data-context.tsx       # New - mutable app data state
├── hooks/
│   └── use-sidebar-order.ts       # New - display order management
└── types/
    └── sidebar-order.ts           # New - type definitions
```

## Testing Checklist

- [ ] Reorder projects within an area (drag up/down)
- [ ] Reorder areas (drag up/down)
- [ ] Move project from Area A to Area B (verify areaId changes)
- [ ] Move project from "No Area" to an area
- [ ] Move project from an area to "No Area"
- [ ] "No Area" section visible even when empty
- [ ] Click on area header still toggles collapse (not interpreted as drag)
- [ ] Click on area header still selects area
- [ ] Keyboard navigation works (Tab, Space, Arrows, Escape)
- [ ] Drag preview appears and follows cursor
- [ ] Drop indicator shows insertion point
- [ ] Cancelled drag returns to original position
- [ ] Collapsed areas can receive drops
- [ ] Collapsed sidebar disables drag entirely
- [ ] Selection state preserved after reorder
- [ ] No ID collisions between areas and projects
- [ ] Performance acceptable with current data set

## Migration Notes

Components currently importing from `@/data/app-data` need updating:

- `left-sidebar.tsx` → use `useAppData()` context
- `main-content.tsx` → use `useAppData()` context
- View components → use `useAppData()` context

Helper functions (`getProjectsByAreaId`, etc.) should either:

- Accept `data` as parameter, OR
- Be converted to hooks that read from context

## Future Considerations

- **Persistence**: Hook into Tauri backend to save order to file
- **Undo/Redo**: Track order history for undo support
- **Task reordering**: Same pattern applies to task lists
- **Animation polish**: Fine-tune spring/easing curves
- **Touch support**: Test and optimize for touch devices
- **Drag constraints**: Prevent dragging areas into project zones
