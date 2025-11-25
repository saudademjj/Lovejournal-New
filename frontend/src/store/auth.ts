import { create } from "zustand";
import { fetchMe, login as apiLogin, setStoredToken, getStoredToken } from "../lib/api";
import { User } from "../lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getStoredToken(),
  loading: false,
  error: null,
  initialized: false,
  init: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const user = await fetchMe();
      set({ user, token, initialized: true, error: null });
    } catch (err) {
      setStoredToken(null);
      set({ user: null, token: null, initialized: true });
    }
  },
  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await apiLogin(username, password);
      setStoredToken(res.access_token);
      const user = await fetchMe();
      set({ user, token: res.access_token, loading: false, error: null });
    } catch (err: any) {
      setStoredToken(null);
      set({
        user: null,
        token: null,
        loading: false,
        error: err?.response?.data?.detail || "登录失败",
      });
      throw err;
    }
  },
  logout: () => {
    setStoredToken(null);
    set({ user: null, token: null });
  },
}));
