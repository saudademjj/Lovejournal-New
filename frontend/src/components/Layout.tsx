import React from "react";
import Header from "./Header";
import Preloader from "./Preloader";

type Props = {
  pageId: "index" | "anniversaries" | "map";
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ pageId, children }) => {
  React.useEffect(() => {
    const prev = document.body.dataset.page;
    document.body.dataset.page = pageId;
    return () => {
      document.body.dataset.page = prev || "";
    };
  }, [pageId]);

  return (
    <div>
      <svg style={{ display: "none" }}>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
      </svg>
      <div className="noise-overlay" />
      <Preloader />
      <Header pageId={pageId} />
      {children}
    </div>
  );
};

export default Layout;
