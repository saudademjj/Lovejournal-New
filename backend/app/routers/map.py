from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..models import Entry, KeyDate, Photo
from ..schemas import MapMarker, MapResponse
from ..utils import GeoHelper
from .timeline import build_timeline

router = APIRouter(prefix="/api", tags=["map"])
settings = get_settings()


def _extract_coords(location: str | None):
    """
    Robustly parse 'lat,lng ...' with minimal assumptions; no network requests.
    Returns (lat, lng) or None.
    """
    if not location:
        return None
    import re

    # Match signed decimals without double escaping so the pattern works as intended.
    nums = re.findall(r"-?\d+(?:\.\d+)?", str(location).replace("，", ","))
    if len(nums) < 2:
        return None
    try:
        lat = float(nums[0])
        lng = float(nums[1])
        # swap if reversed
        if abs(lat) > 90 and abs(lng) <= 90:
            lat, lng = lng, lat
        return lat, lng
    except ValueError:
        return None


@router.get("/map", response_model=MapResponse)
async def get_map(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    markers: list[MapMarker] = []

    # 使用时间轴构建的数据，统一过滤逻辑
    timeline = await build_timeline(session, "", "all", "")
    for node in timeline:
        loc_text = node.location
        coords = _extract_coords(loc_text)
        if not coords:
            continue
        lat, lng = coords
        markers.append(
            MapMarker(
                id=node.id,
                kind=node.type,  # type: ignore[arg-type]
                lat=lat,
                lng=lng,
                label=loc_text or "",
                timestamp=node.timestamp.strftime("%Y-%m-%d %H:%M"),
                snippet=(node.content or node.caption or node.title or "")[:120],
                image=node.image,
            )
        )

    return MapResponse(markers=markers)
