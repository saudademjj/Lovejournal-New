# LoveJournal (爱意笔记 - 情感化生活记录系统)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red?logo=sqlalchemy)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)

LoveJournal 是一款结合时空维度的全栈情感记录应用。它突破了传统文本记录的限制，通过瀑布流时间轴 (Timeline) 与交互式空间地图 (Map) 的多维呈现方式，帮助用户构建数字化的深度记忆宫殿。

## 核心功能

- 多维时间轴: 采用瀑布流渲染技术，支持富文本、图片与情感标签的结构化记录展示。
- 足迹地图索引: 深度集成高德地图 (AMap) JS API，实现基于地理坐标的记录可视化，点击地图要素即可实现空间维度的记忆溯源。
- 图像元数据解析: 自动提取并校准上传图片的地理坐标与拍摄时间信息，实现全自动的自动化归档。
- 高性能异步架构: 
    - 后端: 采用 FastAPI 异步框架，利用 asyncpg 实现数据库访问的高并发性能。
    - 存储: 针对地理信息查询，对 location 字段建立专项索引以加速响应。

## 技术架构

### 后端层 (Backend)
- 框架: FastAPI (Async Mode)
- 持久层: SQLAlchemy 2.0
- 数据库: PostgreSQL
- 安全架构: OAuth2 + JWT (Bcrypt 存储)
- 迁移工具: Alembic

### 前端层 (Frontend)
- 构建工具: Vite
- 框架: React 19
- 地理信息: AMap JS API
- UI 标准: Radix UI + Tailwind CSS
- 图标集: Lucide React

## 项目结构

```text
.
├── backend             # FastAPI 异步后端实现
│   ├── app
│   │   ├── routers     # 模块化路由实现 (Auth, Entries, Map, Timeline)
│   │   ├── models.py   # 数据模型定义
│   │   ├── schemas.py  # 数据校验契约
│   │   └── utils.py    # 地理编码与核心工具
│   └── requirements.txt
├── frontend            # React 高性能前端
│   ├── src
│   │   ├── components  # 业务组件抽象
│   │   ├── hooks       # 状态逻辑解耦
│   │   └── pages       # 视图容器
│   └── package.json
└── docker-compose.yml  # 全栈部署编排
```

## 快速开始

### 1. 基础配置
在 `backend` 目录下创建 `.env` 文件：
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/lovejournal
SECRET_KEY=your_secure_secret_key
AMAP_KEY=your_amap_api_key
```

### 2. 后端部署
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. 前端部署
```bash
npm install && npm run dev
```

## 未来路线
- 集成 AI 情感分析模块，对日记内容进行智能情绪归类与分析报告生成。
- 增加共享协同模式，支持双向身份绑定以共享回忆空间。
- 开发基于原生框架的移动端应用，优化地理位置的后台持续记录能力。

## 许可证
本项目采用 MIT License 协议。

---
Developed by [saudademjj](https://github.com/saudademjj)
