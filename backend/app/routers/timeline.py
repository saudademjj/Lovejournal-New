from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, literal, or_, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..models import Entry, KeyDate, Photo
from ..schemas import TagResponse, TimelineEntry, TimelineResponse

router = APIRouter(prefix="/api", tags=["timeline"])
settings = get_settings()


def split_tags(text: str | None) -> list[str]:
    if not text:
        return []
    return [t.strip() for t in text.split(",") if t.strip()]


async def build_timeline(
    session: AsyncSession,
    search: str,
    type_filter: str,
    tag: str,
    page: int | None = None,
    per_page: int | None = None,
) -> tuple[list[TimelineEntry], int]:
    search = (search or "").strip().lower()
    type_filter = (type_filter or "all").lower()
    tag = (tag or "").strip().lower()

    include_entry = type_filter in ("all", "entry", "text")
    include_photo = type_filter in ("all", "photo", "img", "image")
    include_keydate = type_filter in ("all", "keydate", "date", "anniversary")

    timeline: list[TimelineEntry] = []

    def tag_clause(column):
        wrapped = literal(",") + func.lower(func.coalesce(column, "")) + literal(",")
        return wrapped.like(f"%,{tag},%")

    selects = []

    if include_entry:
        stmt = select(
            Entry.id.label("id"),
            literal("entry").label("type"),
            func.coalesce(Entry.created_at, func.now()).label("timestamp"),
            Entry.content.label("content"),
            literal(None).label("caption"),
            literal(None).label("title"),
            Entry.location.label("location"),
            Entry.tags.label("tags"),
            literal(None).label("image"),
        )
        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(
                    func.lower(func.coalesce(Entry.content, "")).like(like),
                    func.lower(func.coalesce(Entry.location, "")).like(like),
                )
            )
        if tag:
            stmt = stmt.where(tag_clause(Entry.tags))
        selects.append(stmt)

    if include_keydate:
        stmt = select(
            KeyDate.id.label("id"),
            literal("keydate").label("type"),
            KeyDate.date.label("timestamp"),
            literal(None).label("content"),
            literal(None).label("caption"),
            KeyDate.title.label("title"),
            KeyDate.location.label("location"),
            KeyDate.tags.label("tags"),
            literal(None).label("image"),
        )
        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(
                    func.lower(func.coalesce(KeyDate.title, "")).like(like),
                    func.lower(func.coalesce(KeyDate.location, "")).like(like),
                )
            )
        if tag:
            stmt = stmt.where(tag_clause(KeyDate.tags))
        selects.append(stmt)

    if include_photo:
        stmt = select(
            Photo.id.label("id"),
            literal("photo").label("type"),
            func.coalesce(Photo.created_at, func.now()).label("timestamp"),
            literal(None).label("content"),
            Photo.caption.label("caption"),
            literal(None).label("title"),
            Photo.location.label("location"),
            Photo.tags.label("tags"),
            (literal("/uploads/") + Photo.filename).label("image"),
        )
        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(
                    func.lower(func.coalesce(Photo.caption, "")).like(like),
                    func.lower(func.coalesce(Photo.filename, "")).like(like),
                    func.lower(func.coalesce(Photo.location, "")).like(like),
                )
            )
        if tag:
            stmt = stmt.where(tag_clause(Photo.tags))
        selects.append(stmt)

    if not selects:
        return [], 0

    union_stmt = union_all(*selects).subquery()

    total = await session.scalar(select(func.count()).select_from(union_stmt)) or 0
    ordered = select(union_stmt).order_by(union_stmt.c.timestamp.desc())
    if page and per_page:
        ordered = ordered.offset((page - 1) * per_page).limit(per_page)

    res = await session.execute(ordered)
    rows = res.mappings().all()

    timeline = [
        TimelineEntry(
            id=row["id"],
            type=row["type"],
            timestamp=row["timestamp"] or datetime.now(),
            content=row.get("content"),
            caption=row.get("caption"),
            title=row.get("title"),
            location=row.get("location"),
            tags=split_tags(row.get("tags")),
            image=row.get("image"),
        )
        for row in rows
    ]

    return timeline, total


@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    q: str = "",
    type: str = "all",
    tag: str = "",
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    timeline, total = await build_timeline(session, q, type, tag, page, per_page)
    has_more = page * per_page < total
    return TimelineResponse(items=timeline, page=page, has_more=has_more)


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
