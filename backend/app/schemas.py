from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True


class EntryBase(BaseModel):
    content: str
    created_at: Optional[datetime] = None
    location: Optional[str] = None
    location_coords: Optional[str] = None


class EntryCreate(EntryBase):
    pass


class EntryUpdate(BaseModel):
    content: Optional[str] = None
    created_at: Optional[datetime] = None
    location: Optional[str] = None
    location_coords: Optional[str] = None


class PhotoBase(BaseModel):
    caption: Optional[str] = None
    created_at: Optional[datetime] = None
    location: Optional[str] = None


class KeyDateBase(BaseModel):
    title: str
    date: Optional[datetime] = None
    location: Optional[str] = None
    location_coords: Optional[str] = None


class KeyDateUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    location_coords: Optional[str] = None


class TimelineEntry(BaseModel):
    id: int
    type: Literal["entry", "photo", "keydate"]
    timestamp: datetime
    content: Optional[str] = None
    caption: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    image: Optional[str] = None


class TimelineResponse(BaseModel):
    items: list[TimelineEntry]
    page: int
    has_more: bool


class TagResponse(BaseModel):
    tags: list[str]


class MapMarker(BaseModel):
    id: int
    kind: Literal["entry", "photo", "keydate"]
    lat: float
    lng: float
    label: str
    timestamp: str
    snippet: str
    image: Optional[str] = None


class MapResponse(BaseModel):
    markers: list[MapMarker]
    version: int = 1
    unchanged: bool = False
