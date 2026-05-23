# Jarvis — Open-Source Personal AI Assistant

An open-source, plug-and-play personal AI assistant. Multi-user, multi-engine,
private by default. Comes with a modern web UI, encrypted local memory,
operating modes, daily briefings, and onboarding out of the box.

> Configurable assistant — name, language, modes, and engines all switchable per profile.

---

## Features

- **Multi-user profiles** with roles (admin, standard, child) and isolated, encrypted memory
- **Multi-engine** — Ollama (local), OpenAI, Claude, DeepSeek, Kimi
- **Operating modes** — Work, Personal, Family, Creative, Study, Custom
- **Performance modes** — Optimal, Performance, Balanced, Economy, Multitask
- **Security strictness** — Strict, Balanced, Relaxed (per user)
- **Confidential / Incognito mode** — nothing is saved this session
- **Child mode** — content filter, no system tools, age-band tone
- **Personal memory** — "remember this" notes, encrypted at rest
- **Project context** — link a folder/repo per mode
- **Daily briefing** — per user, generated on demand
- **Plugins skeleton** — `/backend/plugins/*/manifest.json`
- **Voice input** — browser SpeechRecognition (Chrome/Edge)
- **Beautiful, modern UI** — Next.js + Tailwind, dark glassmorphism

---

## Architecture

```
.
├── jarvis.config.yaml         # canonical assistant profile (system prompt, name, model)
├── engines.yaml               # engine registry (ids, models, key envs, privacy)
├── .env.example               # copy to .env and fill engine keys
├── backend/                   # FastAPI + SQLite + per-user encrypted memory
│   ├── jarvis/
│   │   ├── main.py            # API entrypoint
│   │   ├── config.py          # loads yaml/env
│   │   ├── db.py / models.py  # SQLAlchemy + SQLite
│   │   ├── security.py        # Fernet encryption helper
│   │   ├── services.py        # prompt assembly + engine selection
│   │   ├── engines/           # ollama, openai/deepseek/kimi, anthropic
│   │   └── routes/            # users, memory, chat, engines, briefing, plugins
│   ├── plugins/               # drop-in plugin folders with manifest.json
│   └── requirements.txt
├── frontend/                  # Next.js 14 (App Router) + Tailwind + framer-motion
│   ├── app/
│   ├── components/            # onboarding, chat, sidebar, settings, memory drawer
│   └── lib/                   # api client, types, utils
└── scripts/                   # cross-platform start scripts
```

The backend serves a JSON API on `http://127.0.0.1:8765`. The frontend talks
to it via `NEXT_PUBLIC_API_URL`. System actions always run **locally** through
the backend regardless of which engine generates text.

---

## Quick start

### Prereqs

- Python 3.10+ (3.11+ recommended)
- Node.js 18+
- (Optional, recommended for privacy) [Ollama](https://ollama.com) — `ollama serve` and `ollama pull llama3.1`

### 1. Configure

```bash
cp .env.example .env
# Open .env and add only the keys for the engines you want.
# Ollama needs no key.
```

### 2. Start the backend

**Windows (PowerShell):**

```powershell
.\scripts\start-backend.ps1
```

**macOS / Linux:**

```bash
chmod +x scripts/*.sh
./scripts/start-backend.sh
```

Backend runs on `http://127.0.0.1:8765`. Try `GET /info` — it should return engine availability.

### 3. Start the frontend

In a second terminal:

**Windows:**

```powershell
.\scripts\start-frontend.ps1
```

**macOS / Linux:**

```bash
./scripts/start-frontend.sh
```

Open `http://localhost:3000`. The first run will guide you through onboarding
(language, name, profile, security, engine).

---

## Engine setup

| Engine     | Key in `.env`         | Notes                               |
| ---------- | --------------------- | ----------------------------------- |
| Ollama     | none                  | Run `ollama serve` locally          |
| OpenAI     | `OPENAI_API_KEY`      | GPT-4o family                       |
| Anthropic  | `ANTHROPIC_API_KEY`   | Claude family                       |
| DeepSeek   | `DEEPSEEK_API_KEY`    | OpenAI-compatible                   |
| Kimi       | `MOONSHOT_API_KEY`    | OpenAI-compatible (Moonshot)        |

Models per engine are listed in `engines.yaml` and exposed in the UI.

---

## Operations

Day-to-day scripts live in `scripts/`. They are idempotent — safe to run
twice. Override default ports with `JARVIS_PORT` and `JARVIS_FRONTEND_PORT`.

| Task                        | Windows (PowerShell)                       | macOS / Linux                          |
| --------------------------- | ------------------------------------------ | -------------------------------------- |
| Start backend (foreground)  | `.\scripts\start-backend.ps1`              | `./scripts/start-backend.sh`           |
| Start backend (detached)    | `.\scripts\start-backend.ps1 -Detached`    | (use `nohup` or `start-all.sh`)        |
| Start frontend (dev)        | `.\scripts\start-frontend.ps1`             | `./scripts/start-frontend.sh`          |
| Start frontend (prod)       | `.\scripts\start-frontend-prod.ps1`        | `./scripts/start-frontend-prod.sh`     |
| Verify production build     | `.\scripts\build-frontend.ps1`             | `./scripts/build-frontend.sh`          |
| Start everything            | `.\scripts\start-all.ps1`                  | `./scripts/start-all.sh`               |
| Stop backend                | `.\scripts\stop-backend.ps1`               | `./scripts/stop-backend.sh`            |
| Stop frontend               | `.\scripts\stop-frontend.ps1`              | `./scripts/stop-frontend.sh`           |
| Stop everything             | `.\scripts\stop-all.ps1`                   | `./scripts/stop-all.sh`                |
| Health check                | `.\scripts\health-check.ps1`               | `./scripts/health-check.sh`            |

Health-check exits `0` on success and prints engine availability:

```text
Jarvis health check -> http://127.0.0.1:8765
  [OK ] root             200
  [OK ] info             200
  [OK ] safety/config    200
  [OK ] engines          200
Engines: ollama(ok), openai(off), claude(ok), deepseek(off), kimi(off)
All checks passed.
```

## Desktop packaging (groundwork)

Jarvis is *prepared* to be wrapped as a desktop app (Tauri / Electron /
PWA) but ships **no wrapper code yet**. The groundwork is documented here:

- [`docs/architecture.md`](docs/architecture.md) — process layout, HTTP contract, stable APIs
- [`docs/runtime-layout.md`](docs/runtime-layout.md) — directories, ports, env vars
- [`docs/desktop-packaging.md`](docs/desktop-packaging.md) — recommended approach + checklist

Pick a wrapper later and follow the checklist; the existing scripts are
exactly the lifecycle hooks any wrapper needs.

---

## Safety contract

The behavior contract lives in `jarvis.config.yaml` under `system:`. Highlights:

- Never modify own source code
- Never delete/move/alter files without explicit confirmation
- Never cross OS user scope or mix profile data
- Honesty over hallucination — fail-safe recovery if unsure

---

## Roadmap (next steps)

- [ ] Streaming responses in the UI
- [ ] Tool-use for safe file/web actions (gated by security level)
- [ ] Real plugin loader (sandbox + permissions)
- [ ] Project-context indexer (README, file list, recent commits)
- [ ] Server-side TTS for voice replies
- [ ] Scheduled daily briefings (background worker)
- [ ] Per-engine usage cost tracking

PRs welcome.

---

## License

Open source. Choose what fits your project (MIT recommended).
