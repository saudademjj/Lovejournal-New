import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..deps import get_current_user
from ..models import Entry, KeyDate, Photo, User
from ..schemas import EntryCreate, EntryUpdate, KeyDateBase, KeyDateUpdate, TimelineEntry
from ..utils import GeoHelper, extract_tags, parse_datetime

router = APIRouter(prefix="/api", tags=["entries"])
settings = get_settings()


def _ensure_upload_dir() -> Path:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    return settings.upload_dir


async def _get_geo_helper(request: Request) -> GeoHelper:
    helper = getattr(request.app.state, "geo_helper", None)
    if helper:
        return helper
    helper = GeoHelper(settings.amap_key)
    request.app.state.geo_helper = helper
    return helper


def _format_tags(*parts: str | None) -> str | None:
    tags = extract_tags(*parts)
    return ",".join(tags) if tags else None


def _timeline_entry_from_entry(entry: Entry) -> TimelineEntry:
    return TimelineEntry(
        id=entry.id,
        type="entry",
        timestamp=entry.created_at or datetime.now(),
        content=entry.content,
        location=entry.location,
        tags=[t for t in (entry.tags or "").split(",") if t],
    )


@router.post("/entries", response_model=TimelineEntry, status_code=status.HTTP_201_CREATED)
async def create_entry(
    payload: EntryCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    geo_helper = await _get_geo_helper(request)
    location = await geo_helper.merge_location_and_coords(payload.location, None)
    tags = _format_tags(payload.content, location)
    entry = Entry(content=payload.content, created_at=payload.created_at or datetime.now(), location=location, tags=tags)
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return _timeline_entry_from_entry(entry)


@router.put("/entries/{entry_id}", response_model=TimelineEntry)
async def update_entry(
    entry_id: int,
    payload: EntryUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    entry = await session.get(Entry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    geo_helper = await _get_geo_helper(request)
    location = await geo_helper.merge_location_and_coords(payload.location, None)
    if payload.content:
        entry.content = payload.content
    if payload.created_at:
        entry.created_at = payload.created_at
    entry.location = location
    entry.tags = _format_tags(entry.content, location)
    await session.commit()
    await session.refresh(entry)
    return _timeline_entry_from_entry(entry)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    entry = await session.get(Entry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await session.delete(entry)
    await session.commit()
    return {"ok": True}


@router.post("/keydates", response_model=TimelineEntry, status_code=status.HTTP_201_CREATED)
async def create_keydate(
    payload: KeyDateBase,
    request: Request,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    geo_helper = await _get_geo_helper(request)
    location = await geo_helper.merge_location_and_coords(payload.location, None)
    date = payload.date or datetime.now()
    kd = KeyDate(title=payload.title, date=date, location=location, tags=_format_tags(payload.title, location))
    session.add(kd)
    await session.commit()
    await session.refresh(kd)
    return TimelineEntry(
        id=kd.id,
        type="keydate",
        timestamp=kd.date,
        title=kd.title,
        location=kd.location,
        tags=[t for t in (kd.tags or "").split(",") if t],
    )


@router.put("/keydates/{keydate_id}", response_model=TimelineEntry)
async def update_keydate(
    keydate_id: int,
    payload: KeyDateUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    kd = await session.get(KeyDate, keydate_id)
    if not kd:
        raise HTTPException(status_code=404, detail="Key date not found")
    geo_helper = await _get_geo_helper(request)
    location = await geo_helper.merge_location_and_coords(payload.location, None)
    if payload.title:
        kd.title = payload.title
    if payload.date:
        kd.date = payload.date
    kd.location = location
    kd.tags = _format_tags(kd.title, location)
    await session.commit()
    await session.refresh(kd)
    return TimelineEntry(
        id=kd.id,
        type="keydate",
        timestamp=kd.date,
        title=kd.title,
        location=kd.location,
        tags=[t for t in (kd.tags or "").split(",") if t],
    )


@router.delete("/keydates/{keydate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_keydate(
    keydate_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    kd = await session.get(KeyDate, keydate_id)
    if not kd:
        raise HTTPException(status_code=404, detail="Key date not found")
    await session.delete(kd)
    await session.commit()
    return {"ok": True}


@router.post("/photos", response_model=TimelineEntry, status_code=status.HTTP_201_CREATED)
async def create_photo(
    request: Request,
    caption: str = Form(""),
    custom_date: str | None = Form(None),
    location: str | None = Form(None),
    location_coords: str | None = Form(None),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    geo_helper = await _get_geo_helper(request)
    merged_location = await geo_helper.merge_location_and_coords(location, location_coords)
    dt = parse_datetime(custom_date)

    upload_dir = _ensure_upload_dir()
    ext = os.path.splitext(file.filename)[1].lower()
    save_name = f"{uuid.uuid4().hex}{ext}"
    dest = upload_dir / save_name
    content = await file.read()
    dest.write_bytes(content)

    photo = Photo(
        filename=save_name,
        caption=caption or None,
        created_at=dt,
        location=merged_location,
        tags=_format_tags(caption, merged_location),
    )
    session.add(photo)
    await session.commit()
    await session.refresh(photo)
    return TimelineEntry(
        id=photo.id,
        type="photo",
        timestamp=photo.created_at or datetime.now(),
        caption=photo.caption,
        location=photo.location,
        tags=[t for t in (photo.tags or "").split(",") if t],
        image=f"/uploads/{photo.filename}",
    )


@router.put("/photos/{photo_id}", response_model=TimelineEntry)
async def update_photo(
    photo_id: int,
    request: Request,
    caption: str = Form(""),
    custom_date: str | None = Form(None),
    location: str | None = Form(None),
    location_coords: str | None = Form(None),
    file: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    photo = await session.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    geo_helper = await _get_geo_helper(request)
    merged_location = await geo_helper.merge_location_and_coords(location, location_coords)
    dt = parse_datetime(custom_date)
    photo.caption = caption or photo.caption
    photo.created_at = dt or photo.created_at
    photo.location = merged_location

    upload_dir = _ensure_upload_dir()
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        save_name = f"{uuid.uuid4().hex}{ext}"
        dest = upload_dir / save_name
        dest.write_bytes(await file.read())
        # remove old file
        old_path = upload_dir / photo.filename
        if old_path.exists():
            try:
                old_path.unlink()
            except OSError:
                pass
        photo.filename = save_name

    photo.tags = _format_tags(photo.caption, photo.location)
    await session.commit()
    await session.refresh(photo)
    return TimelineEntry(
        id=photo.id,
        type="photo",
        timestamp=photo.created_at or datetime.now(),
        caption=photo.caption,
        location=photo.location,
        tags=[t for t in (photo.tags or "").split(",") if t],
        image=f"/uploads/{photo.filename}",
    )


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    photo = await session.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    upload_dir = _ensure_upload_dir()
    img_path = upload_dir / photo.filename
    if img_path.exists():
        try:
            img_path.unlink()
        except OSError:
            pass
    await session.delete(photo)
    await session.commit()
    return {"ok": True}
