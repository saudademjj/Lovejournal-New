# LoveJournal New（FastAPI + React）

`LoveJournal` 的重构版本，采用前后端分离架构：

- 后端：FastAPI + SQLAlchemy + PostgreSQL
- 前端：React + TypeScript + Vite + Tailwind + Zustand + Framer Motion

## 核心能力

- 登录认证（JWT）
- 时间轴数据聚合与分页
- 日记 / 照片 / 纪念日的增删改查
- 标签与筛选
- 地图数据接口（带版本号，便于缓存控制）
- 图片上传与静态文件访问

## 仓库结构

```text
Lovejournal-New/
├── backend/
│   ├── app/
│   │   ├── routers/         # auth / entries / timeline / map
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/pages
│   ├── src/components
│   ├── src/store
│   ├── src/lib
│   └── package.json
└── README.md
```

## 环境要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## 快速开始

### 1. 后端启动

```bash
git clone https://github.com/saudademjj/Lovejournal-New.git
cd Lovejournal-New
cp backend/.env.example backend/.env
```

根据实际环境修改 `backend/.env`（重点是 `DATABASE_URL`、`SECRET_KEY`、`CORS_ORIGINS`）。

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

首次初始化管理员（仅当库内无用户时）：

```bash
curl -X POST "http://localhost:8000/api/auth/bootstrap?username=admin&password=pass"
```

### 2. 前端启动

```bash
cd frontend
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 配置说明

### 后端 `.env`

- `DATABASE_URL`：PostgreSQL 连接串
- `SECRET_KEY`：JWT 签名密钥
- `ACCESS_TOKEN_EXPIRE_MINUTES`：Token 过期时间
- `UPLOAD_DIR`：上传目录
- `AMAP_WEB_KEY` / `AMAP_JS_CODE`：地图相关密钥
- `CORS_ORIGINS`：允许的前端来源

### 前端环境变量（可选）

- `VITE_API_BASE_URL`：后端 API 地址（默认 `/api`）
- `VITE_AMAP_JS_KEY`
- `VITE_AMAP_JS_CODE`
- `VITE_AMAP_WEB_KEY`
- `VITE_GEOJSON_CDN`：地图 GeoJSON CDN 地址

## 主要接口（后端）

- 认证：
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/bootstrap`
- 时间轴：
  - `GET /api/timeline`
  - `GET /api/tags`
- 内容管理：
  - `POST /api/entries` / `PUT /api/entries/{id}` / `DELETE /api/entries/{id}`
  - `POST /api/keydates` / `PUT /api/keydates/{id}` / `DELETE /api/keydates/{id}`
  - `POST /api/photos` / `PUT /api/photos/{id}` / `DELETE /api/photos/{id}`
- 地图：
  - `GET /api/map`

## 常见问题

1. 前端请求 401
- 确认是否已先登录并正确保存 token。

2. 图片无法访问
- 检查 `UPLOAD_DIR` 是否存在并可写，接口通过 `/uploads/*` 暴露静态文件。

3. 地图无数据
- 检查高德 Key、定位数据格式与网络访问情况。

## 许可证

当前仓库未显式提供 License 文件。
