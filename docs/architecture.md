# Jarvis — Architecture Overview

A short bird's-eye view of how Jarvis is split today, written so a future
desktop packager can wrap the whole thing without spelunking through code.

## Two processes

```
+---------------------+        HTTP/JSON         +-----------------------+
|  Frontend (Next.js) |  <------------------->   |  Backend (FastAPI)    |
|  http://:3000       |   NEXT_PUBLIC_API_URL    |  http://:8765         |
+---------------------+                          +-----------------------+
                                                          |
                                                          | local file IO
                                                          v
                                                 +-----------------------+
                                                 |  SQLite + .env        |
                                                 |  encrypted memory     |
                                                 |  plugins/ folder      |
                                                 +-----------------------+
```

- **Frontend** is a static Next.js app (App Router). It is the only thing
  the user looks at. It owns no secrets and no AI logic — it is a thin
  client that talks to the backend.
- **Backend** is a FastAPI app. It owns the database, the encryption key,
  the engine adapters, the safety guard, and the system prompt assembly.
- The two are decoupled by a stable JSON API. They can be packaged
  together (single window) or apart (browser tab + service).

## Backend layout

```
backend/jarvis/
├── main.py                # FastAPI app + router wiring
├── config.py              # YAML + .env loading (cached)
├── db.py / models.py      # SQLAlchemy + SQLite session helpers
├── security.py            # Fernet encryption helper
├── services.py            # prompt assembly, history, engine selection
├── runtime.py             # safe runtime config reload (no restart needed)
├── safety/                # AgentGuard + loop/tool/runtime/error guards
├── engines/               # ollama, openai_compat, anthropic adapters
└── routes/                # users, memory, chat, engines, briefing,
                           # plugins, api_keys, settings, safety
```

Public HTTP surface (stable, additive):

| Route                       | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `GET  /`                    | Liveness ping                                   |
| `GET  /info`                | Engine availability + onboarding state          |
| `GET  /engines`             | Engine + model catalog (id, label, good_for)    |
| `POST /engines/{id}/test`   | Lightweight connectivity probe (no secrets)    |
| `GET/POST /api-keys`        | List/save local API keys (writes `.env`)        |
| `POST /settings/reload`     | Re-read `.env` + rebuild engine instances       |
| `GET  /safety/config`       | Current AgentGuard limits                       |
| `GET/POST /users[…]`        | Profiles, memory, briefing, conversations       |
| `POST /chat`                | Main chat endpoint                              |

## Frontend layout

```
frontend/
├── app/                # Next.js App Router entry (layout, page, css)
├── components/         # app-shell, chat/, sidebar, panels/, settings
├── lib/                # api client, types, layout/palette stores
└── hooks/              # useWebView, …
```

The frontend reads exactly one env var: `NEXT_PUBLIC_API_URL`
(`http://127.0.0.1:8765` by default). All persistent UI preferences live in
`localStorage` so the backend can evolve independently.

## Stable contracts (don't break these)

1. The backend HTTP API on port `8765` is the only integration surface.
2. `engines.yaml` schema (`engines:` map keyed by id, `models:` list of
   `{id, label, good_for}`, `api_key_env`, `provider`).
3. `.env` contains the only secret values. No secret ever appears in
   responses or logs (see `safety/logging.py`).
4. `data/jarvis.sqlite` is the only persistent app database.
5. `.jarvis_key` (or `JARVIS_SECRET`) is the only encryption seed.

These five things are the surface a desktop wrapper needs to honor.
