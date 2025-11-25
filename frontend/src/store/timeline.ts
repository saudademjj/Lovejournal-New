import { create } from "zustand";
import { fetchTags, fetchTimeline } from "../lib/api";
import { TimelineItem } from "../lib/types";

type Filters = {
  q: string;
  type: "all" | "entry" | "photo" | "keydate";
  tag: string;
};

interface TimelineState {
  items: TimelineItem[];
  mapItems: TimelineItem[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  mapLoading: boolean;
  mapError: string | null;
  filters: Filters;
  tags: string[];
  init: (filters?: Partial<Filters>) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: Partial<Filters>) => Promise<void>;
  reset: () => Promise<void>;
  refreshMap: (filters?: Partial<Filters> & { per_page?: number }) => Promise<void>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  items: [],
  mapItems: [],
  page: 1,
  hasMore: true,
  loading: false,
  mapLoading: false,
  mapError: null,
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
      await get().refreshMap({ ...currentFilters, per_page: 500 });
    } catch (e) {
      set({
        items: [],
        mapItems: [],
        page: 1,
        hasMore: false,
        tags: [],
        loading: false,
        mapLoading: false,
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
    const perPage = (filters as { per_page?: number }).per_page || 500;
    set({ mapLoading: true, mapError: null });
    try {
      const res = await fetchTimeline({
        q: merged.q,
        type: merged.type,
        tag: merged.tag,
        page: 1,
        per_page: perPage,
      });
      set({
        mapItems: Array.isArray(res?.items) ? res.items : [],
        mapLoading: false,
        mapError: null,
      });
    } catch (e) {
      set({ mapLoading: false, mapError: "地图数据加载失败" });
    }
  },
}));
