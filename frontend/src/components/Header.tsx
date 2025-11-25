import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import HudClock from "./HudClock";
import { useAuthStore } from "../store/auth";

interface Props {
  pageId: string;
}

const Header: React.FC<Props> = ({ pageId }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header>
      <a href="/" className="brand">
        JOURNAL.
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        {pageId === "index" && <HudClock />}
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Journal
        </NavLink>
        <NavLink
          to="/anniversaries"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Timeline
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Map
        </NavLink>
        <button className="nav-link" onClick={handleLogout} style={{ border: "none", background: "none" }}>
          Logout
        </button>
        <div className="nest-badge" style={{ marginLeft: "2rem" }}>
          <div className="nest-dot"></div>
          <span>NEST</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
