import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { useAuthStore } from "./store/auth";

const Root = () => {
  const initCalled = React.useRef(false);
  const initAuth = useAuthStore((s) => s.init);
  React.useEffect(() => {
    if (!initCalled.current) {
      initCalled.current = true;
      initAuth();
    }
  }, [initAuth]);
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
