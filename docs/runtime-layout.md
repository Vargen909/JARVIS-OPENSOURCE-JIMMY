# Jarvis — Runtime Layout & Config

Single source of truth for *where things live at runtime* and *how to
configure them*. Read this before wrapping Jarvis as a desktop app —
the same paths/ports must be honored by the wrapper.

## Directories

| Path                              | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `jarvis.config.yaml`              | Assistant identity + system prompt     |
| `engines.yaml`                    | Engine + model registry                |
| `.env`                            | Secrets (API keys), runtime overrides  |
| `.jarvis_key`                     | Auto-generated Fernet key (do NOT ship)|
| `backend/data/jarvis.sqlite`      | App database (users, memory, history)  |
| `backend/plugins/`                | Plugin folders with `manifest.json`    |
| `jarvis.log`, `jarvis.log.err`    | Detached run logs (Windows scripts)    |
| `frontend/.next/`                 | Production frontend build output       |

When packaged as a desktop app, `data/`, `.env`, `.jarvis_key`, and
`plugins/` should be moved to a per-user app-data directory (e.g.
`%APPDATA%\Jarvis` on Windows, `~/Library/Application Support/Jarvis`
on macOS, `~/.config/jarvis` on Linux). The wrapper sets `JARVIS_DATA_DIR`
and the backend follows.

## Ports

| Service     | Default | Override env             |
| ----------- | ------- | ------------------------ |
| Backend     | `8765`  | `JARVIS_PORT`            |
| Frontend    | `3000`  | `JARVIS_FRONTEND_PORT`   |

A desktop wrapper should pick free ports at startup, set both env vars,
and inject `NEXT_PUBLIC_API_URL=http://127.0.0.1:<picked-backend-port>`
into the frontend build environment (or use `output: "standalone"` and
proxy in-process).

## Environment variables

### Engines

| Var                    | Used by                                |
| ---------------------- | -------------------------------------- |
| `OPENAI_API_KEY`       | OpenAI engine                          |
| `OPENAI_BASE_URL`      | OpenAI / OpenAI-compatible base URL    |
| `ANTHROPIC_API_KEY`    | Claude engine                          |
| `DEEPSEEK_API_KEY`     | DeepSeek (OpenAI-compatible)           |
| `MOONSHOT_API_KEY`     | Kimi (OpenAI-compatible)               |
| `OLLAMA_BASE_URL`      | Ollama, default `http://localhost:11434` |

### App

| Var                | Default          | Purpose                       |
| ------------------ | ---------------- | ----------------------------- |
| `JARVIS_HOST`      | `127.0.0.1`      | Backend bind host             |
| `JARVIS_PORT`      | `8765`           | Backend bind port             |
| `JARVIS_SECRET`    | (auto)           | Fernet seed if not generated  |

### Agent safety (see `docs/agent-safety.md` if/when added)

| Var                                | Default | Purpose                       |
| ---------------------------------- | ------- | ----------------------------- |
| `JARVIS_MAX_AGENT_LOOPS`           | 10      | Hard reasoning loop cap       |
| `JARVIS_MAX_TOOL_CALLS`            | 25      | Hard tool call cap            |
| `JARVIS_MAX_AGENT_RUNTIME_SECONDS` | 120     | Wall-clock cap per request    |
| `JARVIS_MAX_IDENTICAL_ERRORS`      | 3       | Repeated-error stop threshold |
| `JARVIS_MAX_IDENTICAL_PLANS`       | 3       | Recursive replan stop         |

## Lifecycle

1. Backend reads `jarvis.config.yaml`, `engines.yaml`, and `.env` once at
   start. Caches are cleared explicitly via `POST /settings/reload` so a
   running process can pick up new keys/configs without restart.
2. SQLite is opened lazily; `init_db()` runs at startup and is idempotent.
3. Encryption key is loaded from `JARVIS_SECRET` if set, otherwise
   generated and persisted to `.jarvis_key`.
4. Engine instances are built once and cached per process. They are
   rebuilt by `reload_runtime_config()` (called automatically when keys
   are saved through the UI).
5. Safety guard is created per request — never persists state.

## What is *not* runtime state

- Anything in `frontend/.next/` is build output and can be regenerated.
- `__pycache__/` is regenerated on every run.
- The `node_modules/` folder is dependency cache, not state.

A desktop installer can ship `.next/`, `.venv/`, and `node_modules/` as
read-only assets and keep `data/` + `.env` + `.jarvis_key` in writable
user storage.
