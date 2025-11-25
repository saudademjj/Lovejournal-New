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
  page: number;
  hasMore: boolean;
  loading: boolean;
  filters: Filters;
  tags: string[];
  init: (filters?: Partial<Filters>) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: Partial<Filters>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  items: [],
  page: 1,
  hasMore: true,
  loading: false,
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
    } catch (e) {
      set({ items: [], page: 1, hasMore: false, tags: [], loading: false });
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
}));
