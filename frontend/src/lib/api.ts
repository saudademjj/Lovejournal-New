import axios from "axios";
import { API_BASE_URL } from "./config";
import { MapResponse, TimelineResponse, User } from "./types";

const TOKEN_KEY = "lovejournal_token";

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string | null) => {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(username: string, password: string) {
  const data = new URLSearchParams();
  data.append("username", username);
  data.append("password", password);
  data.append("grant_type", "password");
  const res = await api.post("/auth/login", data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data as { access_token: string; token_type: string };
}

export async function fetchMe() {
  const res = await api.get<User>("/auth/me");
  return res.data;
}

export async function fetchTimeline(params: {
  q?: string;
  type?: string;
  tag?: string;
  page?: number;
  per_page?: number;
}) {
  const res = await api.get<TimelineResponse>("/timeline", { params });
  return res.data;
}

export async function fetchTags() {
  const res = await api.get<{ tags: string[] }>("/tags");
  return res.data.tags;
}

export async function createEntry(payload: { content: string; created_at?: string; location?: string; location_coords?: string }) {
  const res = await api.post("/entries", payload);
  return res.data;
}

export async function updateEntry(
  id: number,
  payload: { content?: string; created_at?: string; location?: string; location_coords?: string }
) {
  const res = await api.put(`/entries/${id}`, payload);
  return res.data;
}

export async function deleteEntry(id: number) {
  await api.delete(`/entries/${id}`);
}

export async function createKeydate(payload: { title: string; date?: string; location?: string; location_coords?: string }) {
  const res = await api.post("/keydates", payload);
  return res.data;
}

export async function updateKeydate(
  id: number,
  payload: { title?: string; date?: string; location?: string; location_coords?: string }
) {
  const res = await api.put(`/keydates/${id}`, payload);
  return res.data;
}

export async function deleteKeydate(id: number) {
  await api.delete(`/keydates/${id}`);
}

export async function createPhoto(payload: {
  caption?: string;
  custom_date?: string;
  location?: string;
  location_coords?: string;
  file: File;
}) {
  const form = new FormData();
  if (payload.caption) form.append("caption", payload.caption);
  if (payload.custom_date) form.append("custom_date", payload.custom_date);
  if (payload.location) form.append("location", payload.location);
  if (payload.location_coords) form.append("location_coords", payload.location_coords);
  form.append("file", payload.file);
  const res = await api.post("/photos", form);
  return res.data;
}

export async function updatePhoto(
  id: number,
  payload: { caption?: string; custom_date?: string; location?: string; location_coords?: string; file?: File | null }
) {
  const form = new FormData();
  if (payload.caption) form.append("caption", payload.caption);
  if (payload.custom_date) form.append("custom_date", payload.custom_date);
  if (payload.location) form.append("location", payload.location);
  if (payload.location_coords) form.append("location_coords", payload.location_coords);
  if (payload.file) form.append("file", payload.file);
  const res = await api.put(`/photos/${id}`, form);
  return res.data;
}

export async function deletePhoto(id: number) {
  await api.delete(`/photos/${id}`);
}

export async function fetchMap() {
  const res = await api.get<MapResponse>("/map");
  return res.data;
}

export default api;
