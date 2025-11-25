import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        extra="ignore",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    secret_key: str = Field("change-me", env="SECRET_KEY")
    access_token_expire_minutes: int = Field(24 * 60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    database_url: str = Field(
        "postgresql+asyncpg://lovejournal:password@localhost:5432/lovejournal",
        env="DATABASE_URL",
    )
    upload_dir: Path = Field(default_factory=lambda: Path(os.getenv("UPLOAD_DIR", "uploads")))
    amap_key: str = Field("fd67dbc2f43a792a5a2aa190e3a49d92", env="AMAP_WEB_KEY")
    amap_js_code: str = Field("9a6053273e69e199acb91aae8add03c9", env="AMAP_JS_CODE")
    cors_origins: str = Field("*", env="CORS_ORIGINS")


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    settings.upload_dir = Path(settings.upload_dir).resolve()
    return settings
