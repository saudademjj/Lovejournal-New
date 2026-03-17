# LoveJournal (生活记录系统 / LoveJournal Life Record System)

本项目是一个结合了地理位置信息与瀑布流时间轴的全栈生活记录应用。系统突破了传统文本日记的局限，通过集成高德地图 API 与 Exif 元数据解析，实现了记录在时空维度上的多维呈现，旨在提供更具沉浸感的回忆回顾体验。

This project is a full-stack life record application that combines geographic information with a waterfall timeline. Breaking through the limitations of traditional text diaries, the system integrates AMap API and Exif metadata parsing to achieve a multi-dimensional presentation of records in space and time, aiming to provide a more immersive memory recall experience.

## 核心特性 / Core Features

- 多维时间轴 (Multi-dimensional Timeline):
    - 采用动态瀑布流渲染技术。 / Implemented using dynamic waterfall rendering.
    - 支持文字、多图组合及情感标签的结构化记录。 / Supports structured records of text, image sets, and emotional tags.

- 足迹地图索引 (Footprint Map Index):
    - 深度集成高德地图 (AMap) JS API 2.0。 / Deep integration with AMap JS API 2.0.
    - 支持基于地理坐标的记录聚合展示。 / Supports aggregated display of records based on geographic coordinates.
    - 点击地图标记可直接关联至对应时间点的回忆详情。 / Clickable markers link directly to memory details.

- 自动化元数据治理 (Automated Metadata Management):
    - 自动提取上传图片的 Exif 地理坐标与拍摄时间。 / Auto-extracts GPS and timestamp from image Exif.
    - 内置坐标偏移修复逻辑，提升地图展示的精准度。 / Built-in coordinate offset correction logic.

- 异步高性能后端 (Async High-performance Backend):
    - 基于 FastAPI 的全异步架构。 / Fully async architecture based on FastAPI.
    - 利用 `asyncpg` 实现 PostgreSQL 的高效并发访问。 / Efficient concurrent access to PostgreSQL via asyncpg.

## 技术栈 / Technical Stack

### 后端层 / Backend Layer
- FastAPI: 核心 Web 框架，提供高性能异步路由。 / Core async Web framework.
- SQLAlchemy 2.0: 采用 Async 模式的 ORM，支持强类型数据模型。 / Async mode ORM with strong typing.
- PostgreSQL: 存储业务实体与地理坐标索引。 / Persistent storage for entities and geo-indexes.
- Alembic: 结构化的数据库版本迁移治理。 / Structured DB version migration management.
- Jose & Passlib: 构建安全的 JWT 身份验证与哈希存储。 / Secure JWT auth and password hashing.

### 前端层 / Frontend Layer
- React 19: 基于最新并发特性的 UI 构建。 / UI construction with the latest concurrent features.
- Vite: 现代化的极速构建工具。 / Modern, lightning-fast build tool.
- Radix UI & Tailwind CSS: 保证组件的可访问性与样式灵活性。 / Accessible and flexible component styling.
- AMap JS API: 地理信息可视化核心。 / Core for geo-information visualization.

## 项目结构 / Project Structure

```text
Lovejournal-New/
├── backend/                # FastAPI 异步后端工程 / FastAPI async backend
│   ├── app/
│   │   ├── routers/        # 业务路由封装 (Auth, Map, Timeline, etc.) / Business routes
│   │   ├── models.py       # SQLAlchemy 数据库实体定义 / DB entities
│   │   ├── schemas.py      # Pydantic 响应与输入校验模型 / Data validation models
│   │   └── utils.py        # 地理编码与 Exif 处理工具类 / Geo-coding & Exif utilities
│   ├── alembic/            # 数据库迁移脚本目录 / DB migration scripts
│   ├── requirements.txt    # Python 依赖清单 / Python dependencies
│   └── main.py             # 异步服务入口 / Async service entry
├── frontend/               # React 现代前端工程 / React modern frontend
│   ├── src/
│   │   ├── components/     # UI 组件与地图组件 / UI & Map components
│   │   ├── hooks/          # 业务逻辑 Hook (AMap 实例化, 数据获取) / Custom hooks
│   │   └── pages/          # 视图容器页面 / View container pages
│   ├── package.json        # 前端依赖清单 / Frontend dependencies
│   └── vite.config.ts      # Vite 编译与代理配置 / Vite build & proxy config
├── docker-compose.yml      # 全栈容器化配置文件 / Full-stack orchestration
└── .env.example            # 环境变量配置模板 / Environment variable template
```

## 快速开始 / Quick Start

### 1. 后端部署 / Backend Setup
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. 前端部署 / Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 路线图 / Roadmap

- [ ] 实现伴侣间双向绑定，共同维护回忆空间 (Couple Synchronization Mode)
- [ ] 接入大模型实现基于语义的智能回忆检索 (Semantic-based Memory Retrieval)
- [ ] 支持离线离线地图与轨迹追踪功能 (Offline Map & Track Tracking)

## 许可证 / License
本项目采用 [MIT License](LICENSE) 协议。 / This project is licensed under the MIT License.
