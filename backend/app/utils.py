import re
from datetime import datetime
from typing import Optional

import httpx

tag_pattern = re.compile(r"#([\w\u4e00-\u9fa5]+)")
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
        self.coord_number_re = re.compile(r"(-?\d+(?:\.\d+)?)")
        self.geocode_cache: dict[str, GeoResult | None] = {}
        self.reverse_cache: dict[str, str | None] = {}

    def parse_coords_from_location(self, location_text: str | None) -> GeoResult | None:
        """
        解析位置文本中的坐标。

        支持的格式：
        - "经度,纬度" (高德格式，如 "87.617733,43.792818")
        - "纬度,经度" (通用格式，会自动检测并交换)
        - 混合文本如 "87.617733,43.792818 乌鲁木齐"

        返回: (lat, lng, adcode) 或 None
        """
        if not location_text:
            return None
        text = str(location_text).replace("，", ",")
        nums = self.coord_number_re.findall(text)
        if len(nums) < 2:
            return None
        try:
            # 默认假设输入是高德格式：经度,纬度 (lng,lat)
            first = float(nums[0])
            second = float(nums[1])

            # 判断坐标顺序：
            # 经度范围: -180 到 180
            # 纬度范围: -90 到 90
            # 如果第一个数的绝对值 > 90，则它是经度（高德格式）
            # 如果第一个数的绝对值 <= 90 且第二个数的绝对值 > 90，则是纬度在前

            if abs(first) > 90:
                # 第一个是经度，第二个是纬度 (高德格式 lng,lat)
                lng, lat = first, second
            elif abs(second) > 90:
                # 第一个是纬度，第二个是经度 (lat,lng)
                lat, lng = first, second
            else:
                # 两个都在 -90 到 90 之间，默认按高德格式处理 (lng,lat)
                # 因为我们主要使用高德API
                lng, lat = first, second

            # 最终验证
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                return None

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
                    # 高德API返回格式: "经度,纬度"
                    lng, lat = float(nums[0]), float(nums[1])
                    result = (lat, lng, adcode)
                except ValueError:
                    result = None

        self.geocode_cache[location_text] = result
        return result

    async def reverse_geocode(self, lat: float, lng: float) -> str | None:
        key = f"{lat:.6f},{lng:.6f}"
        if key in self.reverse_cache:
            return self.reverse_cache[key]
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # 高德逆地理编码API参数格式: location=经度,纬度
                resp = await client.get(
                    "https://restapi.amap.com/v3/geocode/regeo",
                    params={"key": self.amap_key, "location": f"{lng},{lat}"},
                )
                data = resp.json()
                adcode = (
                    data.get("regeocode", {})
                    .get("addressComponent", {})
                    .get("adcode")
                )
        except Exception:
            adcode = None
        if adcode:
            adcode = str(adcode).strip() or None
        else:
            adcode = None
        self.reverse_cache[key] = adcode
        return adcode

    async def resolve_location(self, location_text: str | None) -> GeoResult | None:
        coords = self.parse_coords_from_location(location_text)
        if coords:
            lat, lng, _ = coords
            adcode = await self.reverse_geocode(lat, lng)
            return lat, lng, adcode
        return await self.geocode_location(location_text or "")

    async def merge_location_and_coords(self, location_text: str | None, coords_text: str | None):
        location_text = (location_text or "").strip()
        coords_text = (coords_text or "").strip()

        def parse_coords_text(text: str) -> GeoResult | None:
            """
            解析坐标文本，支持多种格式。
            高德API返回格式为 "经度,纬度"，前端AUTO按钮也使用此格式。
            """
            nums = self.coord_number_re.findall(text.replace("，", ","))
            if len(nums) < 2:
                return None
            try:
                first = float(nums[0])
                second = float(nums[1])

                # 智能判断坐标顺序
                if abs(first) > 90:
                    # 第一个超过90，必定是经度 (高德格式)
                    lng, lat = first, second
                elif abs(second) > 90:
                    # 第二个超过90，是经度在后 (lat,lng格式)
                    lat, lng = first, second
                else:
                    # 都在±90内，默认高德格式 (lng,lat)
                    lng, lat = first, second

                # 验证范围
                if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                    return None

                return lat, lng, None
            except ValueError:
                return None

        coords_pair = parse_coords_text(coords_text) if coords_text else None
        if not coords_pair and location_text:
            coords_pair = await self.resolve_location(location_text)

        if coords_pair:
            lat, lng = coords_pair[0], coords_pair[1]
            # 存储格式：使用纬度,经度的格式（与数据库字段一致）
            coords_str = f"{lat:.6f},{lng:.6f}"
            if location_text:
                return f"{coords_str} {location_text}"
            return coords_str

        return location_text or None
