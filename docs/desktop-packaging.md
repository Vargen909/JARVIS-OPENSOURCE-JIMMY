# Jarvis — Future Desktop Packaging Guide

This document captures the design constraints and recommended approach for
turning Jarvis into a desktop app. **No desktop wrapper code lives in the
repo yet** — this is groundwork only. Pick one of the routes below when
the time comes.

> Read `docs/architecture.md` and `docs/runtime-layout.md` first. Those
> two files describe the surface a wrapper must respect.

## Three viable routes

| Route       | What you ship                                    | Pros                                     | Cons                                  |
| ----------- | ------------------------------------------------ | ---------------------------------------- | ------------------------------------- |
| **Tauri**   | Rust shell + system webview + bundled Python     | Tiny installer (<20 MB), native feel     | Need Rust toolchain, no Chromium      |
| **Electron**| Chromium + Node.js + bundled Python              | Familiar, mature, plugin ecosystem        | 100+ MB installer                     |
| **PWA**     | Browser PWA + native installer for backend only  | Zero shell maintenance                   | No deep OS integration                |

Recommended: **Tauri** if you want a polished, lightweight install.
**Electron** if you want fastest path to "click an icon and it runs".

## What stays the same

A desktop wrapper does **not** modify Jarvis's core. It does:

1. Spawn the Python backend as a child process on a free port.
2. Build/serve the Next.js frontend (or load it as static `out/` files).
3. Render the frontend in a webview window pointing at the local URL.
4. Forward window lifecycle events to graceful backend shutdown.

That's it. No fork of the Python code. No frontend rewrite.

## Pre-flight checklist (do these in order)

This repo is being prepared so each item is already true:

- [x] Backend exposes a stable HTTP contract (see `docs/architecture.md`)
- [x] Frontend reads a single env var (`NEXT_PUBLIC_API_URL`)
- [x] No secret leaves the backend (redaction in `safety/logging.py`)
- [x] Reliable Windows + Unix start/stop scripts in `scripts/`
- [x] Health-check script (`scripts/health-check.ps1` / `.sh`) for
      installer self-test and tray menu
- [x] Production frontend build verification (`scripts/build-frontend.*`)
- [x] Safety/loop guard so a runaway agent can't freeze the desktop UI
- [x] Settings reload endpoint so saving keys does not require restart

Outstanding items the wrapper itself owns:

- [ ] Pick free ports at runtime; set `JARVIS_PORT` + `JARVIS_FRONTEND_PORT`
- [ ] Resolve `JARVIS_DATA_DIR` to the OS-appropriate user-data folder and
      mirror `.env`, `data/`, `.jarvis_key`, `plugins/` into it
- [ ] Single-instance guard so double-clicking the icon focuses the
      existing window instead of starting a second backend
- [ ] System-tray icon: open window, run health-check, quit
- [ ] Auto-update channel (Tauri: `tauri-plugin-updater`, Electron:
      `electron-updater`)
- [ ] Code signing / notarization for Windows + macOS

## Backend lifecycle inside a wrapper

```text
on app start
  pick backend_port = next free TCP port >= 8765
  pick frontend_port = next free TCP port >= 3000
  set env JARVIS_PORT, JARVIS_FRONTEND_PORT, JARVIS_DATA_DIR
  spawn python -m jarvis.main (capture stdout/stderr to log)
  poll http://127.0.0.1:{backend_port}/ until 200 OK (timeout 10s)
  if not OK -> show error window with link to log

on window load
  navigate webview to http://127.0.0.1:{frontend_port}

on quit / window-all-closed
  send SIGTERM (or taskkill on Windows) to backend child
  wait up to 5s, then SIGKILL
  flush log
```

The existing `scripts/health-check.*` script is exactly the polling logic
above — call it from the wrapper at build time and at runtime.

## Frontend production mode

Use `next start` (already wired up via `scripts/start-frontend-prod.ps1`)
or `output: "export"` in `next.config.js` if you want pure static files.
Static export is simpler for a desktop bundle but disables server
components — the current Jarvis UI is mostly client components, so this
should work without changes when the time comes. Verify by running
`scripts/build-frontend.ps1` first.

## Data migration

Existing dev installs keep state in the repo:

- `backend/data/jarvis.sqlite`
- `.env`, `.jarvis_key`
- `backend/plugins/`

On first launch of a packaged build, the wrapper should detect a
co-located dev tree (env var `JARVIS_DEV_PATH` or installer flag) and
copy these files into `JARVIS_DATA_DIR` exactly once.

## Single-instance guard

Two backends on the same port crash. The wrapper must either:

- Hold an OS-level mutex (`Local\Jarvis.SingleInstance` on Windows,
  PID file in `JARVIS_DATA_DIR` elsewhere), or
- Use the framework's built-in `requestSingleInstanceLock()` (Electron)
  or `single-instance` plugin (Tauri).

`scripts/stop-backend.*` exists specifically so the wrapper can clean up
a stale process if the lock is held but the backend died.

## Smoke tests for installer pipeline

CI should run before producing any installer:

```bash
# Backend imports + lints
python -m py_compile $(git ls-files 'backend/**/*.py')

# Frontend builds clean
scripts/build-frontend.sh

# Backend boots and answers health probe
scripts/start-backend.sh &  # or .ps1 -Detached
sleep 3
scripts/health-check.sh
scripts/stop-backend.sh
```

The four scripts above are intentionally enough. Anything more belongs to
the wrapper, not to Jarvis.
