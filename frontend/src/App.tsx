import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import TimelinePage from "./pages/TimelinePage";
import AnniversariesPage from "./pages/AnniversariesPage";
import MapPage from "./pages/MapPage";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import { useAuthStore } from "./store/auth";

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return <div className="preloader"><div className="preloader-inner"><div className="preloader-dot"></div><div className="preloader-label">JOURNAL.</div></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout pageId="index">
              <TimelinePage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/anniversaries"
        element={
          <Protected>
            <Layout pageId="anniversaries">
              <AnniversariesPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/map"
        element={
          <Protected>
            <Layout pageId="map">
              <MapPage />
            </Layout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
