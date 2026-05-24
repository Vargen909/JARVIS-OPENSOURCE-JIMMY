"""FastAPI entrypoint for B.O.B."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import __version__
from .config import assistant_name, host, port
from .db import get_db, init_db
from .engines import list_engines
from .models import User
from .routes.api_keys import router as api_keys_router
from .routes.briefing import router as briefing_router
from .routes.chat import router as chat_router
from .routes.engines import router as engines_router
from .routes.memory import router as memory_router
from .routes.plugins import router as plugins_router
from .routes.safety import router as safety_router
from .routes.settings import router as settings_router
from .routes.speech import router as speech_router
from .routes.users import router as users_router
from .schemas import AppInfo
from fastapi import Depends


def create_app() -> FastAPI:
    init_db()
    app = FastAPI(title=f"{assistant_name()} API", version=__version__)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {"name": assistant_name(), "version": __version__, "ok": True}

    @app.get("/info", response_model=AppInfo)
    def info(db: Session = Depends(get_db)):
        count = db.query(User).count()
        return AppInfo(
            name=assistant_name(),
            version=__version__,
            user_count=count,
            needs_onboarding=count == 0,
            engines=list_engines(),
        )

    app.include_router(users_router)
    app.include_router(memory_router)
    app.include_router(chat_router)
    app.include_router(engines_router)
    app.include_router(briefing_router)
    app.include_router(plugins_router)
    app.include_router(api_keys_router)
    app.include_router(safety_router)
    app.include_router(settings_router)
    app.include_router(speech_router)
    return app


app = create_app()


def main() -> None:
    import uvicorn
    uvicorn.run("bob.main:app", host=host(), port=port(), reload=False)


if __name__ == "__main__":
    main()
