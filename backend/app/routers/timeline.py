from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..models import Entry, KeyDate, Photo
from ..schemas import TagResponse, TimelineEntry, TimelineResponse
from ..utils import extract_tags

router = APIRouter(prefix="/api", tags=["timeline"])
settings = get_settings()


def split_tags(text: str | None) -> list[str]:
    if not text:
        return []
    return [t.strip() for t in text.split(",") if t.strip()]


def matches_text(search: str, *parts: Optional[str]) -> bool:
    if not search:
        return True
    blob = " ".join([p or "" for p in parts]).lower()
    return search in blob


def matches_tag(tag: str, tags_text: Optional[str]) -> bool:
    if not tag:
        return True
    if not tags_text:
        return False
    return tag in [t.strip().lower() for t in tags_text.split(",") if t.strip()]


async def build_timeline(
    session: AsyncSession, search: str, type_filter: str, tag: str
) -> list[TimelineEntry]:
    search = (search or "").strip().lower()
    type_filter = (type_filter or "all").lower()
    tag = (tag or "").strip().lower()

    include_entry = type_filter in ("all", "entry", "text")
    include_photo = type_filter in ("all", "photo", "img", "image")
    include_keydate = type_filter in ("all", "keydate", "date", "anniversary")

    timeline: list[TimelineEntry] = []

    if include_entry:
        res = await session.execute(select(Entry))
        for e in res.scalars():
            if not matches_tag(tag, e.tags):
                continue
            if matches_text(search, e.content, e.location):
                timeline.append(
                    TimelineEntry(
                        id=e.id,
                        type="entry",
                        timestamp=e.created_at or datetime.now(),
                        content=e.content,
                        location=e.location,
                        tags=split_tags(e.tags),
                    )
                )

    if include_keydate:
        res = await session.execute(select(KeyDate))
        for k in res.scalars():
            if not matches_tag(tag, k.tags):
                continue
            if matches_text(search, k.title, k.location):
                timeline.append(
                    TimelineEntry(
                        id=k.id,
                        type="keydate",
                        timestamp=k.date,
                        title=k.title,
                        location=k.location,
                        tags=split_tags(k.tags),
                    )
                )

    if include_photo:
        res = await session.execute(select(Photo))
        for p in res.scalars():
            if not matches_tag(tag, p.tags):
                continue
            if matches_text(search, p.caption, p.filename, p.location):
                timeline.append(
                    TimelineEntry(
                        id=p.id,
                        type="photo",
                        timestamp=p.created_at or datetime.now(),
                        caption=p.caption,
                        location=p.location,
                        tags=split_tags(p.tags),
                        image=f"/uploads/{p.filename}",
                    )
                )

    timeline.sort(key=lambda x: x.timestamp, reverse=True)
    return timeline


@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    q: str = "",
    type: str = "all",
    tag: str = "",
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    timeline = await build_timeline(session, q, type, tag)
    total = len(timeline)
    start = (page - 1) * per_page
    end = start + per_page
    items = timeline[start:end]
    has_more = end < total
    return TimelineResponse(items=items, page=page, has_more=has_more)


@router.get("/tags", response_model=TagResponse)
async def get_tags(session: AsyncSession = Depends(get_session)):
    all_tags = set()
    for model in (Entry, Photo, KeyDate):
        res = await session.execute(select(model.tags))
        for tags_text, in res:
            if not tags_text:
                continue
            for t in split_tags(tags_text):
                if t:
                    all_tags.add(t)
    return TagResponse(tags=sorted(all_tags))
