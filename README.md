# LoveJournal (FastAPI + React)

备份完成后重构为 FastAPI + React + TypeScript + Tailwind + shadcn/ui + Zustand + Framer Motion + PostgreSQL 的新版本。

## 目录

- `backend/` FastAPI 应用，PostgreSQL 存储，上传目录通过 `UPLOAD_DIR` 配置。
- `frontend/` React + Vite + TS 前端，保留原有配色/排版，样式在 `src/styles/style.css`。

## 后端

1. 复制并调整环境变量：`cp backend/.env.example backend/.env`
2. 确认 `DATABASE_URL` 指向 PostgreSQL（默认沿用 `lovejournal` 用户/库）。
3. 创建表并启动：
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
4. 初始化用户（仅首次无用户时）：`curl -X POST "http://localhost:8000/api/auth/bootstrap?username=admin&password=pass"`

## 前端

1. 安装依赖：
   ```bash
   cd frontend
   npm install
   npm run dev  # 默认 http://localhost:5173
   ```
2. 若后端地址非默认，设置 `VITE_API_BASE_URL`、`VITE_AMAP_JS_KEY`、`VITE_AMAP_JS_CODE`。
3. 可选：设置 `VITE_GEOJSON_CDN` 指向 GeoJSON CDN（如 OSS/S3），前端会优先强缓存加载省份边界。

## 运行

- 登录后可进行日记/照片/纪念日的新增、编辑、删除，时间轴无限滚动、年份跳转、HUD 时钟、心形动效、地图定位等保持原有视觉与交互。
- 地图数据和图片来自后端 `/api/map` 与 `/uploads/*`，地图接口携带版本号可用于前端缓存/同步。
