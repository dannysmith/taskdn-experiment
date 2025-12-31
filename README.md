# Taskdn UI Exploration

Design exploration for a personal task management app, inspired by Things 3. This is a **UI prototype** — no backend, no persistence. Mock data only.

> **Note**: This repository is a design exploration that will eventually be incorporated into [tdn-desktop](https://github.com/dannysmith/taskdn), a Tauri-based desktop app. Once integrated, this repo will remain as a historical artifact.

## What It Does

Manages three entity types:
- **Areas** — Ongoing life responsibilities (Health, Finance, etc.)
- **Projects** — Finishable efforts with a clear outcome
- **Tasks** — Single actionable items

Features include Today/Week/Inbox views, kanban boards, calendar views, drag-and-drop reordering, keyboard navigation, and markdown notes.

## Setup

```bash
bun install
bun dev
```

## Stack

React 19, TypeScript, Vite 7, Tailwind CSS v4, shadcn/ui (base-nova), @dnd-kit, Milkdown

## Documentation

- [AGENTS.md](./AGENTS.md) — Technical guidance for AI coding agents and contributors
- [docs/design-conventions.md](./docs/design-conventions.md) — Visual and interaction design system
