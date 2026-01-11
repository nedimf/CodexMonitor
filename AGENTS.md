# CodexMonitor Agent Guide

## Project Summary
CodexMonitor is a macOS Tauri app that orchestrates Codex agents across local workspaces. The frontend is React + Vite; the backend is a Tauri Rust process that spawns `codex app-server` per workspace and streams JSON-RPC events.

## Key Paths

- `src/App.tsx`: composition root
- `src/components/`: presentational UI components
- `src/hooks/`: state + event wiring
- `src/services/tauri.ts`: Tauri IPC wrapper
- `src/styles/`: split CSS by area
- `src/types.ts`: shared types
- `src-tauri/src/lib.rs`: backend app-server client
- `src-tauri/tauri.conf.json`: window config + effects

## Architecture Guidelines

- **Composition root**: keep orchestration in `src/App.tsx`; avoid logic in components.
- **Components**: presentational only; props in, UI out; no Tauri IPC calls.
- **Hooks**: own state, side-effects, and event wiring (e.g., app-server events).
- **Services**: all Tauri IPC goes through `src/services/tauri.ts`.
- **Types**: shared UI data types live in `src/types.ts`.
- **Styles**: one CSS file per UI area in `src/styles/` (no global refactors in components).
- **Backend IPC**: add new commands in `src-tauri/src/lib.rs` and mirror them in the service.
- **App-server protocol**: do not send any requests before `initialize/initialized`.

## App-Server Flow

- Backend spawns `codex app-server` using the `codex` binary.
- Initializes with `initialize` request and `initialized` notification.
- Streams JSON-RPC notifications over stdout; request/response pairs use `id`.
- Approval requests arrive as server-initiated JSON-RPC requests.

## Workspace Persistence

- Workspaces are stored in `workspaces.json` under the app data directory.
- `list_workspaces` returns saved items; `add_workspace` persists and spawns a session.

## Running Locally

```bash
npm install
npm run tauri dev
```

## Common Changes

- UI layout or styling: update `src/components/*` and `src/styles/*`.
- App-server event handling: edit `src/hooks/useAppServerEvents.ts`.
- Tauri IPC: add wrappers in `src/services/tauri.ts` and implement in `src-tauri/src/lib.rs`.

## Notes

- The window uses `titleBarStyle: "Overlay"` and macOS private APIs for transparency.
- Avoid breaking the JSON-RPC format; app-server rejects requests before initialization.
