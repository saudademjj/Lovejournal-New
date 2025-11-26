from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False, index=True
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)


class Entry(Base, TimestampMixin):
    __tablename__ = "entry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    adcode: Mapped[str | None] = mapped_column(String(12), nullable=True, index=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)


class KeyDate(Base):
    __tablename__ = "key_date"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    adcode: Mapped[str | None] = mapped_column(String(12), nullable=True, index=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False, index=True
    )
    lat: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)


class Photo(Base, TimestampMixin):
    __tablename__ = "photo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    adcode: Mapped[str | None] = mapped_column(String(12), nullable=True, index=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)


class MetaKV(Base):
    __tablename__ = "meta_kv"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), onupdate=func.now(), nullable=False, index=True
    )
