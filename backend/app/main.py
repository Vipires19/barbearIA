from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError, app_error_handler, unhandled_error_handler
from app.core.logging import setup_logging
from app.db.redis import close_redis, init_redis
from app.db.session import AsyncSessionLocal
from app.services.admin_seed import seed_admin_if_missing
from app.middleware.request_logging import RequestLoggingMiddleware

setup_logging()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    await init_redis()
    async with AsyncSessionLocal() as session:
        await seed_admin_if_missing(session, settings)
    yield
    await close_redis()


def create_app() -> FastAPI:
    settings = get_settings()
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)

    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")

    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount(
        settings.media_url_prefix,
        StaticFiles(directory=str(upload_path)),
        name="uploads",
    )

    @app.get("/")
    async def root() -> dict[str, str]:
        return {"message": "Barbearia SaaS API", "docs": "/docs"}

    return app


app = create_app()
