export type TimelineType = "entry" | "photo" | "keydate";

export interface TimelineItem {
  id: number;
  type: TimelineType;
  timestamp: string;
  content?: string;
  caption?: string;
  title?: string;
  location?: string | null;
  location_coords?: string | null;
  tags: string[];
  image?: string;
}

export interface TimelineResponse {
  items: TimelineItem[];
  page: number;
  has_more: boolean;
}

export interface User {
  id: number;
  username: string;
  last_login_at?: string | null;
}

export interface MapMarker {
  id: number;
  kind: TimelineType;
  lat: number;
  lng: number;
  label: string;
  timestamp: string;
  snippet: string;
  image?: string | null;
  adcode?: string | null;
}

export interface MapResponse {
  markers: MapMarker[];
  version: number;
  unchanged?: boolean;
}
