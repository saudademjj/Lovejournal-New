import React from "react";
import { Button } from "./ui/button";

type Props = {
  onOpen: (type?: "entry" | "photo" | "keydate") => void;
};

const Dock: React.FC<Props> = ({ onOpen }) => {
  return (
    <div className="dock" aria-label="Memory controls">
      <div className="dock-inner">
        <button type="button" onClick={() => onOpen("entry")} className="dock-btn" data-magnetic data-magnetic-strength="0.22">
          TEXT
        </button>
        <button
          type="button"
          onClick={() => (window as any).triggerHearts?.()}
          className="dock-btn miss-you-btn"
          aria-label="Send hearts"
          data-magnetic
          data-magnetic-strength="0.3"
        >
          ❤
        </button>
        <button type="button" onClick={() => onOpen("photo")} className="dock-btn" data-magnetic data-magnetic-strength="0.22">
          IMG
        </button>
        <button type="button" onClick={() => onOpen("keydate")} className="dock-btn" data-magnetic data-magnetic-strength="0.22">
          DATE
        </button>
      </div>
    </div>
  );
};

export default Dock;
