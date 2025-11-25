import React from "react";
import { motion } from "framer-motion";
import { TimelineItem } from "../lib/types";
import { cleanGeo, formatDateLabel, getDaysDiff } from "../lib/utils";
import { renderMarkdown } from "../lib/markdown";

type Props = {
  item: TimelineItem;
  index: number;
  onEdit: (item: TimelineItem) => void;
  onDelete: (item: TimelineItem) => void;
  isActive: boolean;
  onHoverChange?: (active: boolean) => void;
};

const emitHud = (dateText: string, timeText: string, highlight: boolean) => {
  const evt = new CustomEvent("hud-update", {
    detail: { date: dateText, time: timeText, highlight },
  });
  window.dispatchEvent(evt);
};

const TimelineRow: React.FC<Props> = ({ item, index, onEdit, onDelete, isActive, onHoverChange }) => {
  const ts = new Date(item.timestamp);
  const dateText = formatDateLabel(ts);
  const timeText = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
  const logicalIndex = index + 1;
  const even = logicalIndex % 2 === 0;
  const { diff, state } = item.type === "keydate" ? getDaysDiff(ts) : { diff: 0, state: "today" as const };

  const handleEnter = () => {
    emitHud(dateText, timeText, true);
    onHoverChange?.(true);
  };
  const handleLeave = () => {
    emitHud(dateText, timeText, false);
    onHoverChange?.(false);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`timeline-row ${even ? "even" : "odd"} ${isActive ? "timeline-row--active" : ""}`}
      data-index={logicalIndex}
      data-year={ts.getFullYear()}
      data-type={item.type}
      data-date={dateText}
      data-time={timeText}
      data-timestamp={ts.toISOString().slice(0, 16)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="time-wrapper">
        <div className="time-label">
          {dateText} <span>{timeText}</span>
        </div>
      </div>
      <div className="axis-cell">
        <button className="axis-dot" type="button" aria-label={`Focus on ${dateText} ${timeText}`} />
      </div>
      <div className="content-wrapper">
        <div className="entry-card" style={item.type === "entry" ? { alignItems: "center", textAlign: "center" } : {}}>
          <div className="entry-actions">
            <button className="btn-edit" title="Edit" onClick={() => onEdit(item)}>
              ✎
            </button>
            <form onSubmit={(e) => e.preventDefault()}>
              <button className="btn-delete" title="Archive Memory" onClick={() => onDelete(item)}>
                ×
              </button>
            </form>
          </div>

          {item.type === "entry" && (
            <>
              <div
                className="entry-body text-entry"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content || "") }}
              />
              {item.location && <div className="entry-location">{cleanGeo(item.location)}</div>}
            </>
          )}

          {item.type === "photo" && (
            <>
              <div className="photo-frame">
                <img src={item.image} alt={item.caption || "Memory photo"} loading="lazy" />
              </div>
              {item.caption && <div className="photo-caption">{item.caption}</div>}
              {item.location && <div className="entry-location">{cleanGeo(item.location)}</div>}
            </>
          )}

          {item.type === "keydate" && (
            <div className="keydate-minimal">
              <div className="kd-title">{item.title}</div>
              <div className="kd-number" style={state === "today" ? { color: "var(--neon-pink)" } : {}}>
                {state === "today" ? "NOW" : diff}
              </div>
              <div className="kd-meta">
                {state === "past" ? "days since" : state === "future" ? "days left" : "happening now"}
              </div>
              {item.location && <div className="entry-location">{cleanGeo(item.location)}</div>}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default TimelineRow;
