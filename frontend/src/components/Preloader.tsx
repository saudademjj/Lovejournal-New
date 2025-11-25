import React from "react";

const Preloader: React.FC = () => {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 600);
    const cleanup = setTimeout(() => {
      const el = document.getElementById("preloader");
      if (el) el.remove();
    }, 1400);
    return () => {
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, []);

  return (
    <div id="preloader" className={`preloader ${hidden ? "preloader--hidden" : ""}`}>
      <div className="preloader-inner">
        <div className="preloader-dot"></div>
        <div className="preloader-label">JOURNAL.</div>
      </div>
    </div>
  );
};

export default Preloader;
