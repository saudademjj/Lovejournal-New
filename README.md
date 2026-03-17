<div align="center">
  <a href="./README.md">简体中文</a> | <a href="./README_en.md">English</a>
</div>

# LoveJournal (生活记录与空间记忆系统 / LoveJournal Life Record & Spatial Memory System)

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwind-css)

本项目是一款融合地理位置索引与流式时间轴的全栈生活记录应用。系统突破了传统文本日记的单一维度，通过集成高德地图 (AMap) JS API 与 自动化的图片 Exif 元数据解析，实现了记录在“时间”与“空间”两个坐标轴上的精准沉淀，为用户提供具备空间感的回忆回溯体验。

This project is a full-stack life record application that integrates geographic indexing with a fluid waterfall timeline. Moving beyond the single dimension of traditional diaries, the system achieves precise accumulation across both time and space by integrating the AMap JS API and automated Exif metadata parsing, providing a spatial sense of memory recall.

## 核心架构方案 / Core Architectural Design

### 1. 异步高性能后端 (Async High-Performance Backend)
- **FastAPI 生态**: 核心采用 FastAPI 异步框架，充分利用 Python 的 `async/await` 特性处理 I/O 密集型任务。 / Fully leveraging Python's async features for I/O tasks.
- **异步持久层**: 配合 `SQLAlchemy 2.0 (Async mode)` 与 `asyncpg` 驱动，实现了非阻塞式的 PostgreSQL 数据库交互。 / Non-blocking DB interactions with SQLAlchemy 2.0 Async & asyncpg.

### 2. 时空关联数据治理 (Spatial-Temporal Data Management)
- **自动坐标提取**: 后端集成了 Exif 解析逻辑，在图片上传阶段自动识别 GPS 信息并校准。 / Automated GPS extraction and calibration during image upload.
- **地理索引优化**: 在数据库层面针对 `location` 字段建立 GIST 或专用索引，保障地图聚合查询的响应速度。 / Geo-indexing for optimized spatial aggregation queries.

### 3. 现代化前端交互 (Modern Frontend Interaction)
- **瀑布流时间轴**: 结合 React 19 的并发特性，实现平滑的内容加载与视图渲染。 / Smooth content loading via React 19 concurrent features.
- **交互式地图看板**: 深度封装高德地图 API，支持自定义海量点标记 (MassMarks) 与信息窗体关联。 / Deeply encapsulated AMap API for customized markers and info-windows.

## 技术栈拆解 / Technical Stack Analysis

| 层级 / Layer | 技术选型 / Tech Selection | 核心用途 / Purpose |
| :--- | :--- | :--- |
| **后端 API** | FastAPI / Python 3.11 | 提供低延迟的异步 RESTful 接口。 / Low-latency async interfaces. |
| **持久层** | SQLAlchemy / Alembic | 实现类型安全的 ORM 映射与自动化的模式迁移。 / Type-safe ORM & migration. |
| **前端框架** | React 19 / Vite | 组件化视图治理与极速的热更新体验。 / Component-based UI & fast HMR. |
| **安全认证** | Jose (JWT) / Bcrypt | 基于无状态令牌的身份验证与密码哈希存储。 / Stateless JWT auth & hashing. |
| **空间数据** | AMap JS API 2.0 | 提供地理围栏计算、坐标转化与交互式渲染。 / Geo-fencing & rendering. |

## 项目结构图 / Project Structure

```text
Lovejournal-New/
├── backend/                # 异步后端工程核心 / Async Backend Core
│   ├── app/
│   │   ├── routers/        # 模块化业务路由 (Auth, Map, Entries, etc.) / Business routes
│   │   ├── models.py       # SQLAlchemy 强类型实体定义 / Typed DB entities
│   │   ├── schemas.py      # 基于 Pydantic 的入参契约与响应模型 / Data contracts
│   │   └── utils.py        # 地理编码、图片处理与认证工具类 / Core utilities
│   ├── migrations/         # Alembic 版本控制脚本 / Migration scripts
│   ├── requirements.txt    # 依赖清单 / Dependency list
│   └── main.py             # 异步 Web 服务引导程序 / Web service entry
├── frontend/               # 现代前端工程实现 / Modern Frontend App
│   ├── src/
│   │   ├── components/     # UI 原子组件与地图业务组件 / Components
│   │   ├── hooks/          # 自定义数据拉取与地图实例化 Hook / Custom hooks
│   │   └── pages/          # 路由容器页面 / View pages
│   └── vite.config.ts      # 模块化构建与代理配置 / Build & Proxy config
└── docker-compose.yml      # 全栈部署与环境编排 / Deployment orchestration
```

## 快速运行指南 / Quick Start

### 1. 配置环境变量 / Environment Setup
在 `backend` 目录下创建 `.env`：
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/lovejournal
SECRET_KEY=your_secure_random_string
AMAP_KEY=your_amap_js_api_key
```

### 2. 运行服务端 / Launch Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. 运行客户端 / Launch Frontend
```bash
cd frontend
npm install
npm run dev
```

## 未来路线 / Roadmap
- [ ] 增加多用户协作模式 (Partner Collaboration Mode)。
- [ ] 引入 AI 语义分析，自动生成年度情感总结报告 (AI-driven Emotional Summary)。
- [ ] 实现离线缓存与 PWA 支持 (Offline Support & PWA)。

## 许可证 / License
本项目遵循 MIT License。 / Licensed under the MIT License.
