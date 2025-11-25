import React from "react";
import CursorGlow from "../components/CursorGlow";
import HeartsCanvas from "../components/HeartsCanvas";
import Dock from "../components/Dock";
import TimelineRow from "../components/TimelineRow";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useTimelineStore } from "../store/timeline";
import { TimelineItem, TimelineType } from "../lib/types";
import { createEntry, createKeydate, createPhoto, deleteEntry, deleteKeydate, deletePhoto, updateEntry, updateKeydate, updatePhoto } from "../lib/api";
import { AMAP_WEB_KEY } from "../lib/config";

type ModalState =
  | { mode: "create"; type: TimelineType; item?: null }
  | { mode: "edit"; type: TimelineType; item: TimelineItem };

const nowInputValue = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const extractCoordsText = (value?: string | null) => {
  if (!value) return "";
  const nums = (value.replace("，", ",").match(/-?\d+(?:\.\d+)?/g) || []).map(parseFloat);
  if (nums.length < 2 || Number.isNaN(nums[0]) || Number.isNaN(nums[1])) return "";
  let lat = nums[0];
  let lng = nums[1];
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) [lat, lng] = [lng, lat];
  return `${lat},${lng}`;
};

const TimelinePage: React.FC = () => {
  const { items, hasMore, filters, tags, init, loadMore, setFilters } = useTimelineStore();
  const [search, setSearch] = React.useState(filters.q);
  const [activeRow, setActiveRow] = React.useState<number | null>(null);
  const [modalState, setModalState] = React.useState<ModalState | null>(null);
  const [form, setForm] = React.useState({
    content: "",
    caption: "",
    title: "",
    location: "",
    locationCoords: "",
    date: nowInputValue(),
    file: null as File | null,
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    init();
  }, [init]);

  React.useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadMore();
        });
      },
      { rootMargin: "0px 0px 300px 0px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  const years = React.useMemo(() => {
    const set = new Set<number>();
    items.forEach((it) => set.add(new Date(it.timestamp).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const handleFilterType = (type: TimelineType | "all") => {
    setFilters({ type });
  };

  const handleTagToggle = (tag: string) => {
    const nextTag = filters.tag === tag ? "" : tag;
    setFilters({ tag: nextTag });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ q: search });
  };

  const openModal = (type: TimelineType, item?: TimelineItem) => {
    const mode = item ? "edit" : "create";
    setModalState({ mode, type, item: item || null });
    setError(null);
    const ts = item ? new Date(item.timestamp) : new Date();
    ts.setMinutes(ts.getMinutes() - ts.getTimezoneOffset());
    setForm({
      content: item?.content || "",
      caption: item?.caption || "",
      title: item?.title || "",
      location: item?.location || "",
      locationCoords: extractCoordsText(item?.location),
      date: item ? ts.toISOString().slice(0, 16) : nowInputValue(),
      file: null,
    });
    document.documentElement.classList.add("modal-open");
  };

  const closeModal = () => {
    setModalState(null);
    document.documentElement.classList.remove("modal-open");
  };

  const handleAutoGeo = async () => {
    const query = form.location.trim();
    if (!query) {
      setError("请输入地点再尝试自动匹配");
      return;
    }
    try {
      const res = await fetch(
        `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_WEB_KEY}&address=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data.status === "1" && data.geocodes?.length) {
        const loc = data.geocodes[0].location;
        setForm((f) => ({ ...f, locationCoords: loc }));
        setError(null);
      } else {
        setError("未找到坐标，请确认地点是否正确");
      }
    } catch (err) {
      setError("自动匹配失败，请检查网络或稍后重试");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState) return;
    setSaving(true);
    setError(null);
    try {
      if (modalState.type === "entry") {
        if (modalState.mode === "edit" && modalState.item) {
          await updateEntry(modalState.item.id, {
            content: form.content,
            created_at: form.date,
            location: form.location,
            location_coords: form.locationCoords || undefined,
          });
        } else {
          await createEntry({
            content: form.content,
            created_at: form.date,
            location: form.location,
            location_coords: form.locationCoords || undefined,
          });
        }
      } else if (modalState.type === "keydate") {
        if (modalState.mode === "edit" && modalState.item) {
          await updateKeydate(modalState.item.id, {
            title: form.title,
            date: form.date,
            location: form.location,
            location_coords: form.locationCoords || undefined,
          });
        } else {
          await createKeydate({
            title: form.title,
            date: form.date,
            location: form.location,
            location_coords: form.locationCoords || undefined,
          });
        }
      } else if (modalState.type === "photo") {
        if (modalState.mode === "edit" && modalState.item) {
          await updatePhoto(modalState.item.id, {
            caption: form.caption,
            custom_date: form.date,
            location: form.location,
            location_coords: form.locationCoords,
            file: form.file,
          });
        } else {
          if (!form.file) {
            setError("请选择图片");
            setSaving(false);
            return;
          }
          await createPhoto({
            caption: form.caption,
            custom_date: form.date,
            location: form.location,
            location_coords: form.locationCoords,
            file: form.file,
          });
        }
      }
      await init(filters);
      closeModal();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: TimelineItem) => {
    if (!window.confirm("Delete?")) return;
    if (item.type === "entry") await deleteEntry(item.id);
    if (item.type === "keydate") await deleteKeydate(item.id);
    if (item.type === "photo") await deletePhoto(item.id);
    await init(filters);
  };

  return (
    <>
      <CursorGlow />
      <HeartsCanvas />
      <main aria-label="Shared timeline">
        <div className="timeline-controls">
          <div className="timeline-top-row">
            <form className="timeline-search" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                name="q"
                className="timeline-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search memories..."
              />
              {filters.type && filters.type !== "all" && <input type="hidden" name="type" value={filters.type} />}
              {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
            </form>
            <div className="timeline-filters" role="tablist" aria-label="Filter by type">
              {(["all", "entry", "photo", "keydate"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`filter-pill ${filters.type === t ? "is-active" : ""}`}
                  data-filter={t}
                  onClick={() => handleFilterType(t)}
                >
                  {t === "all" ? "All" : t === "entry" ? "Text" : t === "photo" ? "Photo" : "Date"}
                </button>
              ))}
            </div>
          </div>
          {tags.length > 0 && (
            <div className="tag-cloud" aria-label="Filter by tag">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tag-chip ${filters.tag === t ? "tag-chip--active" : ""}`}
                  data-tag={t}
                  onClick={() => handleTagToggle(t)}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {years.length > 0 && (
          <nav className="year-nav" aria-label="Jump by year">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                className="year-pill"
                data-year={y}
                onClick={() => {
                  const target = document.querySelector(`.timeline-row[data-year="${y}"]`);
                  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {y}
              </button>
            ))}
          </nav>
        )}

        <section className="timeline-grid" aria-live="polite">
          <div className="timeline-axis" aria-hidden="true"></div>
          {items.map((item, idx) => (
            <TimelineRow
              key={`${item.type}-${item.id}`}
              item={item}
              index={idx}
              isActive={activeRow === item.id}
              onEdit={(it) => openModal(it.type, it)}
              onDelete={handleDelete}
              onHoverChange={(active) => setActiveRow(active ? item.id : null)}
            />
          ))}
        </section>
        <div id="scroll-sentinel" ref={sentinelRef} aria-hidden="true"></div>
      </main>

      <Dock onOpen={(type) => openModal(type)} />

      {modalState && (
        <>
          <div id="modal-backdrop" className="modal-backdrop active" onClick={closeModal}></div>
          <dialog id="input-modal" open aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" type="button" onClick={closeModal} aria-label="Close">
              &times;
            </button>
            <h3 id="modal-title" className="modal-title">
              {modalState.mode === "edit" ? "EDIT" : modalState.type === "entry" ? "THOUGHT" : modalState.type === "photo" ? "VISUAL" : "MEMORY"}
            </h3>
            <form onSubmit={handleSubmit} className="modal-form-content">
              <label
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#6a6a6a",
                }}
              >
                When
                <input
                  type="datetime-local"
                  name="custom_date"
                  id="date-input"
                  className="modal-field"
                  style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </label>

              {modalState.type === "entry" && (
                <>
                  <Textarea
                    name="content"
                    rows={5}
                    className="modal-field"
                    placeholder="..."
                    required
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  />
                  <div className="geo-row">
                    <Input
                      name="location"
                      placeholder="Where (optional)"
                      className="modal-field"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                    <button type="button" className="geo-btn" onClick={handleAutoGeo}>
                      AUTO
                    </button>
                  </div>
                  <div className="geo-status">{form.locationCoords ? "已匹配" : ""}</div>
                  <input type="hidden" name="location_coords" value={form.locationCoords} />
                </>
              )}

              {modalState.type === "keydate" && (
                <>
                  <Input
                    name="title"
                    placeholder="Title"
                    className="modal-field"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <div className="geo-row">
                    <Input
                      name="location"
                      placeholder="Where (optional)"
                      className="modal-field"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                    <button type="button" className="geo-btn" onClick={handleAutoGeo}>
                      AUTO
                    </button>
                  </div>
                  <div className="geo-status">{form.locationCoords ? "已匹配" : ""}</div>
                  <input type="hidden" name="location_coords" value={form.locationCoords} />
                </>
              )}

              {modalState.type === "photo" && (
                <>
                  <input
                    type="file"
                    name="photo"
                    className="modal-field"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
                    required={modalState.mode === "create"}
                  />
                  <Input
                    name="caption"
                    placeholder="Caption"
                    className="modal-field"
                    style={{ marginTop: "6px" }}
                    value={form.caption}
                    onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  />
                  <div className="geo-row">
                    <Input
                      name="location"
                      placeholder="Where (optional)"
                      className="modal-field"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                    <button type="button" className="geo-btn" onClick={handleAutoGeo}>
                      AUTO
                    </button>
                  </div>
                  <div className="geo-status">{form.locationCoords ? "已匹配" : ""}</div>
                  <input type="hidden" name="location_coords" value={form.locationCoords} />
                </>
              )}

              {error && <div style={{ color: "#ff6b6b", fontSize: "0.85rem" }}>{error}</div>}

              <button type="submit" className="modal-save-btn" disabled={saving}>
                {saving ? "Saving..." : "SAVE"}
              </button>
            </form>
          </dialog>
        </>
      )}
    </>
  );
};

export default TimelinePage;
