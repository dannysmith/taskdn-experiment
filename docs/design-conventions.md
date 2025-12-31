# Design Conventions

This document defines the visual and interaction conventions for Taskdn. The UI should:

- Feel clean and uncluttered
- Be visually consistent with itself
- Be predictable, intuitive, and learnable
- Feel fast
- Be keyboard-first — task apps are one of the few systems where even non-power users rely on the keyboard
- Use design patterns, interactions, shortcuts, and icons consistent with widely-used task management apps

---

## Entities

### Area

An ongoing responsibility or life domain. Never "finished."

| Property    | Description                                    |
| ----------- | ---------------------------------------------- |
| title       | Name of the area                               |
| status      | `active`, `archived`                           |
| type        | Category (e.g., "life-area", "work", "client") |
| description | Brief summary                                  |
| notes       | Markdown body content                          |

### Project

A finishable collection of tasks with a clear outcome.

| Property    | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| title       | Name of the project                                             |
| status      | `planning`, `ready`, `in-progress`, `paused`, `blocked`, `done` |
| areaId      | Parent area (optional)                                          |
| description | Brief summary                                                   |
| startDate   | When work begins                                                |
| endDate     | Target completion                                               |
| notes       | Markdown body content                                           |

### Task

A single actionable item.

| Property   | Description                                                             |
| ---------- | ----------------------------------------------------------------------- |
| title      | What needs to be done                                                   |
| status     | `inbox`, `icebox`, `ready`, `in-progress`, `blocked`, `dropped`, `done` |
| projectId  | Parent project (optional)                                               |
| areaId     | Direct area (optional, overrides project's area)                        |
| due        | Deadline                                                                |
| scheduled  | When to work on it                                                      |
| deferUntil | Hide until this date                                                    |
| notes      | Markdown body content                                                   |

---

## Colors

### Status Colors

| Status      | Color       | Meaning                 |
| ----------- | ----------- | ----------------------- |
| inbox       | Blue        | Needs processing        |
| planning    | Blue        | Being planned           |
| icebox      | Light blue  | Frozen/deferred         |
| ready       | Grey        | Waiting to start        |
| in-progress | Amber       | Active work             |
| paused      | Light amber | Temporarily on hold     |
| blocked     | Dark red    | Stuck, needs resolution |
| dropped     | Light red   | Abandoned               |
| done        | Green       | Complete                |

### Entity Accent Colors

| Entity  | Color  | Usage                              |
| ------- | ------ | ---------------------------------- |
| Project | Purple | Subtle tint on project UI elements |
| Area    | Teal   | Subtle tint on area UI elements    |

### UI Colors

| Purpose             | Color      |
| ------------------- | ---------- |
| Primary/Accent      | Blue       |
| Destructive actions | Bright red |
| Inactive/disabled   | Grey       |

---

## Icons

### Entity Icons

| Entity  | Icon            | Notes                                     |
| ------- | --------------- | ----------------------------------------- |
| Area    | Folder or Box   | Container metaphor                        |
| Project | Progress Circle | Shows completion percentage as filled arc |
| Task    | Status Checkbox | Rounded square, varies by status          |

### Task Status Icons

| Status      | Visual                 |
| ----------- | ---------------------- |
| ready       | Empty rounded square   |
| in-progress | Border with center dot |
| done        | Filled with checkmark  |
| blocked     | Filled with X          |
| dropped     | Grey with X            |
| icebox      | Border with snowflake  |
| inbox       | Border with inbox icon |

### Project Status Icons

| Status                       | Icon                      |
| ---------------------------- | ------------------------- |
| planning, ready, in-progress | Progress Circle (shows %) |
| paused                       | CirclePause               |
| blocked                      | Ban                       |
| done                         | CircleCheck               |

### UI Icons

| Icon         | Meaning                       |
| ------------ | ----------------------------- |
| Flag         | Priority / due date indicator |
| Calendar     | Date reference                |
| ChevronRight | Expand/collapse               |
| Sun          | Today view                    |
| CalendarDays | This Week view                |
| Inbox        | Inbox view                    |

---

## Components

### Cards

- **TaskCard** — Compact task display with status pill, project, dates
- **ProjectCard** — Project overview with progress bar, task count, area
- **AreaCard** — Area summary with project count

### List Items

- **TaskListItem** — Task row with checkbox, title, metadata; title is inline-editable
- **ProjectListItem** — Expandable project row containing tasks

### Lists

- **TaskList** — Ordered list of tasks, supports selection and reordering

### Views

- **KanbanBoard** — Column-per-status view with collapsible columns; supports drag-drop between statuses
- **CalendarView** — Month/week views showing scheduled tasks; drag tasks to reschedule

### Panels

- **TaskDetailPanel** — Right sidebar for editing task details (status, dates, project, area, notes)

---

## Interactions

### Selection & Navigation

- Arrow keys move selection through lists
- Enter on a selected item opens it for editing
- Escape clears selection or cancels editing

### Keyboard Shortcuts

- `Cmd+Up` / `Cmd+Down` — Reorder selected item
- `Cmd+Enter` — Complete task (toggle done)
- `Delete` / `Backspace` — Delete selected item (with confirmation if needed)

### Drag & Drop

- Tasks can be dragged to reorder within a list
- Tasks can be dragged between projects
- Projects can be dragged between areas

### Inline Editing

- Task titles are editable in place (click or press Enter)
- Editing should feel instant — no modal dialogs for title changes

---

## Dates

### Display Rules

- **Scheduled dates**: Shown in grey, calendar icon
- **Due dates**: Shown in red with flag icon; darker red if overdue
- **Relative format**: Use human-readable relative dates if within two weeks ("Today", "Tomorrow", "Mon", "in 5 days")
- **Absolute format**: Use short date format beyond two weeks ("Jan 15", "Mar 3")

### Behavior

- All displayed dates should be clickable to open a date picker
- Clearing a date removes it (nullable)
