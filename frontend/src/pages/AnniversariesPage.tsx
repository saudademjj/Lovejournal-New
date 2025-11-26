import React from "react";
import CursorGlow from "../components/CursorGlow";
import HeartsCanvas from "../components/HeartsCanvas";
import Dock from "../components/Dock";
import { fetchTimeline, createKeydate } from "../lib/api";
import { TimelineItem } from "../lib/types";
import { getDaysDiff, cleanGeo } from "../lib/utils";
import { Input } from "../components/ui/input";
import { AMAP_WEB_KEY } from "../lib/config";
import { emitAppEvent } from "../lib/eventBus";

const nowInputValue = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const AnniversariesPage: React.FC = () => {
  const [dates, setDates] = React.useState<TimelineItem[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", location: "", date: nowInputValue(), locationCoords: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDates = React.useCallback(async () => {
    const res = await fetchTimeline({ type: "keydate", per_page: 500 });
    setDates(res.items);
  }, []);

  React.useEffect(() => {
    loadDates();
  }, [loadDates]);

  React.useEffect(() => {
    if (modalOpen) document.documentElement.classList.add("modal-open");
    else document.documentElement.classList.remove("modal-open");
  }, [modalOpen]);

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
    setSaving(true);
    setError(null);
    try {
      await createKeydate({
        title: form.title,
        date: form.date,
        location: form.location,
        location_coords: form.locationCoords || undefined,
      });
      await loadDates();
      emitAppEvent({ type: "map:invalidate" });
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CursorGlow />
      <HeartsCanvas />
      <main aria-label="Anniversary collection">
        <section className="anniv-list">
          {dates.map((k, idx) => {
            const ts = new Date(k.timestamp);
            const { diff, state } = getDaysDiff(ts);
            return (
              <article className="anniv-card" key={`${k.id}-${idx}`} data-magnetic data-magnetic-strength="0.18">
                <div className="anniv-top">
                  <div className="anniv-date">
                    <div className="anniv-date-main">
                      {ts.getFullYear()}·{String(ts.getMonth() + 1).padStart(2, "0")}·{String(ts.getDate()).padStart(2, "0")}
                    </div>
                    <div className="anniv-date-time">
                      {String(ts.getHours()).padStart(2, "0")}:{String(ts.getMinutes()).padStart(2, "0")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="anniv-days">{state === "today" ? 0 : diff}</div>
                    <div className="anniv-subline">
                      {state === "past" ? "DAYS SINCE" : state === "future" ? "DAYS LEFT" : "TODAY"}
                    </div>
                  </div>
                </div>
                <div className="anniv-meta-block">
                  <div className="anniv-title">{k.title}</div>
                  <div className="anniv-tagline">
                    {state === "past" ? "我们已经一起走过了这些天。" : state === "future" ? "离这一天还有这些期待。" : "正在发生的此刻。"}
                  </div>
                  {k.location && <div className="entry-location">{cleanGeo(k.location)}</div>}
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <Dock onOpen={() => setModalOpen(true)} />

      {modalOpen && (
        <>
          <div id="modal-backdrop" className="modal-backdrop active" onClick={() => setModalOpen(false)}></div>
          <dialog id="input-modal" open aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Close">
              &times;
            </button>
            <h3 id="modal-title" className="modal-title">
              MEMORY
            </h3>
            <form onSubmit={handleSubmit}>
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
              <Input
                name="title"
                placeholder="Title"
                className="modal-field"
                required
                style={{ marginTop: "1rem" }}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Input
                name="location"
                placeholder="Where (optional)"
                className="modal-field"
                style={{ marginTop: "0.4rem" }}
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <button type="button" className="geo-btn" onClick={handleAutoGeo}>
                AUTO
              </button>
              {error && <div style={{ color: "#ff6b6b", marginTop: "0.5rem" }}>{error}</div>}
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

export default AnniversariesPage;
