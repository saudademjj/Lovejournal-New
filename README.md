<div align="center">
  <p>A Modern, High-Performance Life Journaling System / 现代高性能生活记录系统</p>
  <p>
    <a href="#english">English</a> •
    <a href="#简体中文">简体中文</a>
  </p>
</div>

---

<h2 id="english">🇬🇧 English</h2>

# LoveJournal-New (FastAPI + React 19)

**LoveJournal-New** is the modernized, high-performance evolution of the original LoveJournal system. Fully rewritten with a decoupled frontend-backend architecture, it offers a smoother, app-like experience for documenting your life's most precious moments, photos, and anniversaries.

### ✨ Core Features

- **Modern Architecture**: Decoupled design featuring a blazing-fast backend and a highly responsive frontend.
- **Secure Authentication**: JWT-based stateless authentication for safe and secure access to your memories.
- **Rich Data Aggregation**: A unified, paginated timeline aggregating diaries, photos, and key dates with tag-based filtering.
- **Interactive Maps**: Advanced geographic visualization using AMAP (Gaode Map) APIs with version-controlled caching for optimal performance.
- **Media Management**: Robust photo upload capabilities with direct static file serving.
- **Polished UI/UX**: Built with Tailwind CSS and Framer Motion for beautiful, fluid animations and a consistent aesthetic.

### 🛠 Technology Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Python 3.10+
- **Frontend**: React (TypeScript), Vite, Tailwind CSS, Zustand (State Management), Framer Motion
- **Services**: AMAP Geocoding & Map SDK

### 🚀 Quick Start

#### 1. Backend Setup (FastAPI)

```bash
git clone https://github.com/saudademjj/Lovejournal-New.git
cd Lovejournal-New
cp backend/.env.example backend/.env
```
*Configure your `backend/.env` with your PostgreSQL `DATABASE_URL`, `SECRET_KEY`, and `CORS_ORIGINS`.*

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*First-time Admin Setup (only if database is empty):*
```bash
curl -X POST "http://localhost:8000/api/auth/bootstrap?username=admin&password=pass"
```

#### 2. Frontend Setup (React)

```bash
cd ../frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### ⚙️ Environment Variables

**Backend (`backend/.env`)**
- `DATABASE_URL`: PostgreSQL connection string.
- `SECRET_KEY`: Secure key for JWT signing.
- `UPLOAD_DIR`: Directory for storing uploaded media.
- `AMAP_WEB_KEY` / `AMAP_JS_CODE`: Map service API keys.

**Frontend (`frontend/.env`)** *(Optional)*
- `VITE_API_BASE_URL`: Backend API endpoint (default: `/api`).
- `VITE_AMAP_JS_KEY` / `VITE_AMAP_WEB_KEY`: Frontend map SDK keys.

---

<h2 id="简体中文">🇨🇳 简体中文</h2>

# LoveJournal-New (FastAPI + React)

**LoveJournal-New** 是对经典版 LoveJournal 的全面重构升级。项目采用了彻底的前后端分离架构，通过引入现代化的技术栈，为用户提供了一个极其流畅、接近原生 App 体验的私密回忆归档平台。

### ✨ 核心特性

- **现代前后端架构**：使用 FastAPI 提供极致的接口响应速度，React 构建高互动性的前端视图。
- **安全可靠的认证**：基于 JWT（JSON Web Token）的无状态认证机制，保障私密数据安全。
- **全局时光轴流**：将日记、图库、纪念日深度整合，支持按需分页加载与基于标签的智能筛选。
- **交互式地图视图**：深度集成高德地图 API，带有版本号的接口设计便于前端实施精准的缓存控制，让足迹展现更加丝滑。
- **流畅动效与视觉**：结合 Tailwind CSS 和 Framer Motion，打造极具质感的现代 UI 与过渡动画。

### 🛠 技术栈地图

- **后端引擎**：FastAPI, SQLAlchemy ORM, PostgreSQL, Python 3.10+
- **前端框架**：React + TypeScript, Vite 构建工具, Tailwind CSS, Zustand 状态管理, Framer Motion 动画库
- **基础设施**：高德地图 JS API 与地理编码服务

### 🚀 快速启动指南

#### 1. 后端服务部署

```bash
git clone https://github.com/saudademjj/Lovejournal-New.git
cd Lovejournal-New
cp backend/.env.example backend/.env
```
*请务必修改 `backend/.env` 中的 `DATABASE_URL`、`SECRET_KEY` 以及允许跨域的 `CORS_ORIGINS`。*

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows 用户使用: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*首次运行初始化超级管理员（仅在数据库无用户时有效）：*
```bash
curl -X POST "http://localhost:8000/api/auth/bootstrap?username=admin&password=pass"
```

#### 2. 前端服务运行

```bash
cd ../frontend
npm install
npm run dev
```
浏览器默认访问地址：`http://localhost:5173`。

### ⚙️ 核心配置说明

**后端 (`backend/.env`)**
- `DATABASE_URL`：PostgreSQL 数据库连接串。
- `SECRET_KEY`：用于签发 JWT 的高强度随机密钥。
- `UPLOAD_DIR`：图片与静态资源上传存放目录。
- `AMAP_WEB_KEY` / `AMAP_JS_CODE`：高德地图服务端接口安全密钥。

**前端环境 (`frontend/.env`)** *(可选)*
- `VITE_API_BASE_URL`：指定后端 API 基础路径（默认为同域 `/api`）。
- `VITE_AMAP_JS_KEY` / `VITE_AMAP_WEB_KEY`：前端高德 SDK 密钥。

## 📄 许可证

本项目默认供个人学习与私有化部署使用，如需开源分发请遵守相关协议规定。