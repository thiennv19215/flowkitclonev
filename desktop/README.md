# FlowKit Studio

Desktop GUI for the FlowKit backend. Currently runs as a web app (Vite dev server); will be wrapped with Tauri later.

## Stack

- Vite + React 18 + TypeScript (strict)
- TailwindCSS v3 + shadcn/ui pattern
- React Router v6
- TanStack Query v5
- Zustand (with localStorage persist)

## Prerequisites

- Node.js 18+ and npm
- FlowKit backend running at `http://127.0.0.1:8100`
  - Quick check: `curl -s http://127.0.0.1:8100/health` should return `{"extension_connected": true}`

## Setup

```bash
cd desktop
npm install
```

## Scripts

```bash
npm run dev       # start Vite dev server (default http://127.0.0.1:5173)
npm run build     # type-check then build for production
npm run preview   # preview production build
npm run lint      # eslint
```

## Configuration

The API base URL is stored in the Zustand `settings` store and persisted in
`localStorage` under the key `flowkit-studio-settings`. Default:
`http://127.0.0.1:8100`. Change it from the in-app **Settings** page.

## Project layout

```
src/
  main.tsx              entry, mounts React + providers
  App.tsx               router setup
  index.css             tailwind directives + dark theme CSS vars
  api/client.ts         fetch wrapper using base URL from settings
  components/
    ui/                 shadcn primitives (added per-feature)
    layout/AppLayout    skeleton (Outlet only for now)
  pages/                Dashboard, Image, Video, Storyboard, Settings
  store/settings.ts     Zustand store
  hooks/                (empty)
  lib/utils.ts          cn() helper
  types/                (empty)
```
