from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, literal, or_, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..map_version import get_map_version
from ..models import Entry, KeyDate, Photo
from ..schemas import MapMarker, MapResponse
from ..utils import GeoHelper

router = APIRouter(prefix="/api", tags=["map"])
settings = get_settings()
geo_helper = GeoHelper(settings.amap_key)


def _resolve_coords(location: str | None, lat: float | None, lng: float | None):
    if lat is not None and lng is not None:
        return float(lat), float(lng)
    parsed = geo_helper.parse_coords_from_location(location)
    if parsed:
        return float(parsed[0]), float(parsed[1])
    return None


def _tag_clause(column, tag: str):
    wrapped = literal(",") + func.lower(func.coalesce(column, "")) + literal(",")
    return wrapped.like(f"%,{tag},%")


async def _build_map_markers(
    session: AsyncSession, search: str, type_filter: str, tag: str, limit: int
) -> list[MapMarker]:
    search = (search or "").strip().lower()
    type_filter = (type_filter or "all").lower()
    tag = (tag or "").strip().lower()

    include_entry = type_filter in ("all", "entry", "text")
    include_photo = type_filter in ("all", "photo", "img", "image")
    include_keydate = type_filter in ("all", "keydate", "date", "anniversary")

    selects = []

    def add_select(
        model,
        type_label: str,
        ts_col,
        content_col,
        caption_col,
        title_col,
        location_col,
        tags_col,
        image_col,
        lat_col,
        lng_col,
        adcode_col,
    ):
        stmt = select(
            model.id.label("id"),
            literal(type_label).label("type"),
            ts_col.label("timestamp"),
            content_col.label("content"),
            caption_col.label("caption"),
            title_col.label("title"),
            location_col.label("location"),
            tags_col.label("tags"),
            image_col.label("image"),
            lat_col.label("lat"),
            lng_col.label("lng"),
            adcode_col.label("adcode"),
        ).where(
            or_(
                func.length(func.trim(location_col)) > 0,
                lat_col.is_not(None),
                lng_col.is_not(None),
            )
        )
        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(
                    func.lower(func.coalesce(content_col, "")).like(like),
                    func.lower(func.coalesce(title_col, "")).like(like),
                    func.lower(func.coalesce(caption_col, "")).like(like),
                    func.lower(func.coalesce(location_col, "")).like(like),
                )
            )
        if tag:
            stmt = stmt.where(_tag_clause(tags_col, tag))
        selects.append(stmt)

    if include_entry:
        add_select(
            Entry,
            "entry",
            func.coalesce(Entry.created_at, func.now()),
            Entry.content,
            literal(None),
            literal(None),
            Entry.location,
            Entry.tags,
            literal(None),
            Entry.lat,
            Entry.lng,
            Entry.adcode,
        )

    if include_keydate:
        add_select(
            KeyDate,
            "keydate",
            KeyDate.date,
            literal(None),
            literal(None),
            KeyDate.title,
            KeyDate.location,
            KeyDate.tags,
            literal(None),
            KeyDate.lat,
            KeyDate.lng,
            KeyDate.adcode,
        )

    if include_photo:
        add_select(
            Photo,
            "photo",
            func.coalesce(Photo.created_at, func.now()),
            literal(None),
            Photo.caption,
            literal(None),
            Photo.location,
            Photo.tags,
            (literal("/uploads/") + Photo.filename),
            Photo.lat,
            Photo.lng,
            Photo.adcode,
        )

    if not selects:
        return []

    union_stmt = union_all(*selects).subquery()
    ordered = select(union_stmt).order_by(union_stmt.c.timestamp.desc()).limit(limit)
    res = await session.execute(ordered)
    rows = res.mappings().all()

    markers: list[MapMarker] = []
    for row in rows:
        coords = _resolve_coords(row.get("location"), row.get("lat"), row.get("lng"))
        if not coords:
            continue
        lat, lng = coords
        snippet_src = row.get("content") or row.get("caption") or row.get("title") or ""
        ts = row.get("timestamp") or datetime.now()
        markers.append(
            MapMarker(
                id=row.get("id"),
                kind=row.get("type"),
                lat=lat,
                lng=lng,
                label=(row.get("location") or "").strip(),
                timestamp=ts.isoformat(),
                snippet=str(snippet_src)[:120],
                image=row.get("image"),
                adcode=row.get("adcode"),
            )
        )
    return markers


@router.get("/map", response_model=MapResponse)
async def get_map(
    q: str = "",
    type: str = "all",
    tag: str = "",
    limit: int = Query(800, ge=1, le=2000),
    since_version: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    current_version = await get_map_version(session)
    if since_version and since_version >= current_version:
        return MapResponse(markers=[], version=current_version, unchanged=True)

    markers = await _build_map_markers(session, q, type, tag, limit)
    return MapResponse(markers=markers, version=current_version, unchanged=False)
