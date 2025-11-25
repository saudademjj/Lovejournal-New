import React from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

const LoginPage: React.FC = () => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loading } = useAuthStore();
  const from = (location.state as any)?.from?.pathname || "/";

  React.useEffect(() => {
    document.body.dataset.page = "login";
    return () => {
      document.body.dataset.page = "";
    };
  }, []);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "用户名或密码错误");
    }
  };

  return (
    <main aria-label="Login">
      <div className="login-panel">
        <h1 className="login-title">登录 Love Journal</h1>
        <p className="login-desc">请输入用户名与密码。</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="login-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "..." : "Login"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => navigate("/")}>
              Back
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;
