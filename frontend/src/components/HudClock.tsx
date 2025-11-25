import React from "react";

type HudEvent = CustomEvent<{ date: string; time: string; highlight?: boolean }>;

const formatNow = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
};

const HudClock: React.FC = () => {
  const [dt, setDt] = React.useState(() => formatNow());
  const [highlight, setHighlight] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setDt(formatNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const evt = e as HudEvent;
      const detail = evt.detail;
      if (!detail) return;
      setDt({ date: detail.date, time: detail.time });
      setHighlight(!!detail.highlight);
    };
    window.addEventListener("hud-update", handler as EventListener);
    return () => window.removeEventListener("hud-update", handler as EventListener);
  }, []);

  return (
    <div
      id="hud-clock"
      className={`hud-clock hud-clock--visible ${highlight ? "hud-clock--highlight" : ""}`}
      aria-live="polite"
    >
      <span className="hud-date">{dt.date}</span>
      <span className="hud-time" style={{ marginLeft: "0.8rem" }}>
        {dt.time}
      </span>
    </div>
  );
};

export default HudClock;
