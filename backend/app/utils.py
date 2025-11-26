import re
from datetime import datetime
from typing import Optional

import httpx

tag_pattern = re.compile(r"#([\\w\\u4e00-\\u9fa5]+)")
GeoResult = tuple[float, float, str | None]


def extract_tags(*texts: Optional[str]) -> list[str]:
    found = set()
    for t in texts:
        if not t:
            continue
        for m in tag_pattern.findall(t):
            found.add(m.lower())
    return sorted(found)


def parse_datetime(value: Optional[str]) -> datetime:
    if not value:
        return datetime.now()
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return datetime.fromisoformat(value) if value else datetime.now()


class GeoHelper:
    def __init__(self, amap_key: str):
        self.amap_key = amap_key
        self.coord_number_re = re.compile(r"(-?\\d+(?:\\.\\d+)?)")
        self.geocode_cache: dict[str, GeoResult | None] = {}

    def parse_coords_from_location(self, location_text: str | None) -> GeoResult | None:
        if not location_text:
            return None
        text = str(location_text).replace("，", ",")
        nums = self.coord_number_re.findall(text)
        if len(nums) < 2:
            return None
        try:
            lat = float(nums[0])
            lng = float(nums[1])
            if abs(lat) > 90 and abs(lng) <= 90:
                # swap if reversed
                lat, lng = lng, lat
            return lat, lng, None
        except ValueError:
            return None

    async def geocode_location(self, location_text: str) -> GeoResult | None:
        if not location_text:
            return None
        if location_text in self.geocode_cache:
            return self.geocode_cache[location_text]

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://restapi.amap.com/v3/geocode/geo",
                    params={"key": self.amap_key, "address": location_text},
                )
                data = resp.json()
        except Exception:
            data = {}

        result = None
        geocodes = data.get("geocodes") or [] if isinstance(data, dict) else []
        if data.get("status") == "1" and geocodes:
            loc = geocodes[0].get("location", "")
            adcode = (
                str(
                    geocodes[0].get("addressComponent", {}).get("adcode")
                    or geocodes[0].get("adcode")
                    or ""
                ).strip()
                or None
            )
            nums = self.coord_number_re.findall(loc)
            if len(nums) >= 2:
                try:
                    lng, lat = float(nums[0]), float(nums[1])
                    result = (lat, lng, adcode)
                except ValueError:
                    result = None

        self.geocode_cache[location_text] = result
        return result

    async def resolve_location(self, location_text: str | None) -> GeoResult | None:
        coords = self.parse_coords_from_location(location_text)
        if coords:
            return coords
        return await self.geocode_location(location_text or "")

    async def merge_location_and_coords(self, location_text: str | None, coords_text: str | None):
        location_text = (location_text or "").strip()
        coords_text = (coords_text or "").strip()

        def parse_coords_text(text: str) -> GeoResult | None:
            nums = self.coord_number_re.findall(text.replace("，", ","))
            if len(nums) < 2:
                return None
            try:
                lat = float(nums[0])
                lng = float(nums[1])
                if abs(lat) > 90 and abs(lng) <= 90:
                    lat, lng = lng, lat
                return lat, lng, None
            except ValueError:
                return None

        coords_pair = parse_coords_text(coords_text) if coords_text else None
        if not coords_pair and location_text:
            coords_pair = await self.resolve_location(location_text)

        if coords_pair:
            lat, lng = coords_pair[0], coords_pair[1]
            coords_str = f"{lat:.6f},{lng:.6f}"
            if location_text:
                return f"{coords_str} {location_text}"
            return coords_str

        return location_text or None
