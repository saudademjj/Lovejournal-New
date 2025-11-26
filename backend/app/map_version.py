from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import MetaKV

MAP_VERSION_KEY = "map_version"


async def get_map_version(session: AsyncSession) -> int:
    """
    Ensure map version row exists and return current version as int.
    """
    res = await session.execute(select(MetaKV).where(MetaKV.key == MAP_VERSION_KEY))
    record = res.scalars().first()
    if not record:
        record = MetaKV(key=MAP_VERSION_KEY, value="1")
        session.add(record)
        await session.commit()
        return 1
    try:
        return int(record.value)
    except (TypeError, ValueError):
        return 1


async def bump_map_version(session: AsyncSession) -> int:
    """
    Increase map data version, used to bust caches on any data change.
    """
    res = await session.execute(select(MetaKV).where(MetaKV.key == MAP_VERSION_KEY).with_for_update())
    record = res.scalars().first()
    if not record:
        record = MetaKV(key=MAP_VERSION_KEY, value="1")
        session.add(record)
        await session.commit()
        return 1
    try:
        next_ver = int(record.value or "0") + 1
    except (TypeError, ValueError):
        next_ver = 1
    record.value = str(next_ver)
    await session.commit()
    await session.refresh(record)
    return next_ver
