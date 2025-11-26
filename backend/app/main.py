import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .config import get_settings
from .database import Base, SessionLocal, engine
from .map_version import get_map_version
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
        # location 字段索引，避免地图查询全表扫描
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_entry_location ON entry (location)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_keydate_location ON key_date (location)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_photo_location ON photo (location)"))
    # 初始化地图版本号，保障缓存命中/失效逻辑正常
    async with SessionLocal() as session:
        await get_map_version(session)
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
