import { create } from "zustand";
import { fetchMap, fetchTags, fetchTimeline } from "../lib/api";
import { MapMarker, TimelineItem } from "../lib/types";

type Filters = {
  q: string;
  type: "all" | "entry" | "photo" | "keydate";
  tag: string;
};

interface TimelineState {
  items: TimelineItem[];
  mapItems: MapMarker[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  mapLoading: boolean;
  mapError: string | null;
  mapRequestKey: string | null;
  mapDataKey: string | null;
  mapVersion: number | null;
  filters: Filters;
  tags: string[];
  init: (filters?: Partial<Filters>) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: Partial<Filters>) => Promise<void>;
  reset: () => Promise<void>;
  refreshMap: (filters?: Partial<Filters> & { per_page?: number; limit?: number; force?: boolean }) => Promise<void>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  items: [],
  mapItems: [],
  page: 1,
  hasMore: true,
  loading: false,
  mapLoading: false,
  mapError: null,
  mapRequestKey: null,
  mapDataKey: null,
  mapVersion: null,
  filters: { q: "", type: "all", tag: "" },
  tags: [],
  init: async (filters = {}) => {
    const currentFilters = { ...get().filters, ...filters };
    set({ filters: currentFilters, page: 1, loading: true });
    try {
      const [timelineRes, tags] = await Promise.all([
        fetchTimeline({ q: currentFilters.q, type: currentFilters.type, tag: currentFilters.tag, page: 1 }),
        fetchTags(),
      ]);
      set({
        items: Array.isArray(timelineRes?.items) ? timelineRes.items : [],
        page: timelineRes?.page || 1,
        hasMore: !!timelineRes?.has_more,
        tags: Array.isArray(tags) ? tags : [],
        loading: false,
      });
      await get().refreshMap({ ...currentFilters, limit: 800, force: true });
    } catch (e) {
      set({
        items: [],
        mapItems: [],
        page: 1,
        hasMore: false,
        tags: [],
        loading: false,
        mapLoading: false,
        mapRequestKey: null,
        mapDataKey: null,
        mapVersion: null,
        mapError: "地图数据加载失败",
      });
      throw e;
    }
  },
  loadMore: async () => {
    const { hasMore, loading, page, filters, items } = get();
    if (!hasMore || loading) return;
    set({ loading: true });
    const nextPage = page + 1;
    try {
      const res = await fetchTimeline({
        q: filters.q,
        type: filters.type,
        tag: filters.tag,
        page: nextPage,
      });
      set({
        items: [...items, ...(Array.isArray(res?.items) ? res.items : [])],
        page: nextPage,
        hasMore: !!res?.has_more,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, hasMore: false });
      throw e;
    }
  },
  setFilters: async (filters) => {
    const merged = { ...get().filters, ...filters };
    set({ filters: merged });
    await get().init(merged);
  },
  reset: async () => {
    await get().init({ q: "", type: "all", tag: "" });
  },
  refreshMap: async (filters = {}) => {
    const merged = { ...get().filters, ...filters };
    const limit =
      (filters as { limit?: number }).limit || (filters as { per_page?: number }).per_page || 800;
    const forceRefresh = (filters as { force?: boolean }).force || false;
    const requestKey = `${merged.q || ""}|${merged.type}|${merged.tag}|${limit}`;
    const { mapLoading, mapRequestKey, mapVersion } = get();

    if (mapLoading && mapRequestKey === requestKey && !forceRefresh) {
      console.log("[refreshMap] Same request in progress, skipping");
      return;
    }

    console.log("[refreshMap] Fetching map data...");
    set({ mapLoading: true, mapError: null, mapRequestKey: requestKey });

    try {
      const res = await fetchMap({
        q: merged.q,
        type: merged.type,
        tag: merged.tag,
        limit,
        since_version: forceRefresh ? 0 : mapVersion || 0,
      });

      if (get().mapRequestKey !== requestKey) {
        console.log("[refreshMap] Request outdated, ignoring results");
        return;
      }

      if (res?.unchanged && mapVersion !== null && res.version === mapVersion) {
        console.log("[refreshMap] Map data unchanged, skip update");
        set({
          mapLoading: false,
          mapError: null,
          mapRequestKey: null,
          mapDataKey: `${requestKey}|v${mapVersion}`,
        });
        return;
      }

      const items = Array.isArray(res?.markers) ? res.markers : [];
      console.log("[refreshMap] Successfully loaded", items.length, "map markers, version:", res?.version);

      set({
        mapItems: items,
        mapLoading: false,
        mapError: null,
        mapRequestKey: null,
        mapDataKey: `${requestKey}|v${res?.version ?? mapVersion ?? "0"}`,
        mapVersion: res?.version ?? mapVersion ?? 1,
      });
    } catch (e) {
      if (get().mapRequestKey === requestKey) {
        console.error("[refreshMap] Failed to load map data:", e);
        set({ mapLoading: false, mapError: "地图数据加载失败", mapRequestKey: null, mapDataKey: null });
      }
    }
  },
}));
