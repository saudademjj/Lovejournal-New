import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import Base, engine
from .routers import auth as auth_router
from .routers import entries as entries_router
from .routers import map as map_router
from .routers import timeline as timeline_router
from .utils import GeoHelper

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    app.state.geo_helper = GeoHelper(settings.amap_key)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="LoveJournal", lifespan=lifespan)

    origins = [origin.strip() for origin in settings.cors_origins.split(",")] if settings.cors_origins else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router.router)
    app.include_router(timeline_router.router)
    app.include_router(entries_router.router)
    app.include_router(map_router.router)

    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
    return app


app = create_app()
