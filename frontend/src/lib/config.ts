// Default to same-origin /api so it works behind Caddy/Nginx without extra config.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
// JS Key only用于加载地图脚本
export const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY || "";
export const AMAP_JS_CODE = import.meta.env.VITE_AMAP_JS_CODE || "";
// Web 服务 Key 用于地理编码（AUTO 按钮/后端一致）
export const AMAP_WEB_KEY = import.meta.env.VITE_AMAP_WEB_KEY || "";
