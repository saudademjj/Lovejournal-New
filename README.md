<div align="center">
  <a href="./README_en.md">English</a> | 简体中文
</div>

# LoveJournal (生活记录与空间记忆系统)

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwind-css)

本项目是一款深度集成地理位置索引与流式时间轴的全栈生活记录应用。系统旨在突破传统文本日记的单一维度，通过高德地图 API 的空间可视化与 自动化的图片 Exif 元数据解析，构建一个具备空间张力的“数字记忆宫殿”。

## 核心架构与技术实现

### 1. 异步高性能后端
后端基于 **FastAPI** 异步框架构建，全面适配 Python 的 `async/await` 原语。
- **非阻塞持久层**: 采用 `SQLAlchemy 2.0 (Async mode)` 配合 `asyncpg` 驱动，实现了 PostgreSQL 数据库的高效并发交互。
- **自动化元数据治理**: 后端内置图片处理管道，在上传阶段自动提取并校准 Exif 中的 GPS 坐标与拍摄时间，实现记录的自动化地理归档。

### 2. 空间记忆可视化
- **地图驱动交互**: 深度封装高德地图 (AMap) JS API 2.0，实现了海量记录点的聚合展示与实时跳转。
- **地理索引优化**: 在数据库层面针对记录的地理坐标字段建立 GIST 空间索引，保障了在大规模数据下的地图检索效率。

### 3. 响应式前端体验
- **React 19 并发渲染**: 利用最新的并发特性优化瀑布流列表的加载表现，确保视图切换的丝滑感。
- **现代化 UI 标准**: 结合 Radix UI 与 Tailwind CSS 构建具备高度语义化与响应式适配的交互界面。

## 项目工程结构

```text
Lovejournal-New/
├── backend/                # 异步后端工程核心
│   ├── app/
│   │   ├── routers/        # 模块化业务路由 (认证、记录管理、地图聚合)
│   │   ├── models.py       # SQLAlchemy 异步数据模型
│   │   ├── schemas.py      # 基于 Pydantic 的入参校验与响应定义
│   │   └── utils.py        # 地理编码、图片处理与 JWT 工具类
│   ├── migrations/         # Alembic 数据库版本控制
│   ├── requirements.txt    # 依赖清单
│   └── main.py             # 应用引导程序
├── frontend/               # React 前端工程实现
│   ├── src/
│   │   ├── components/     # UI 原子组件与地图业务逻辑组件
│   │   ├── hooks/          # 封装 AMap 实例管理与数据拉取逻辑
│   │   └── pages/          # 路由容器页面
│   └── vite.config.ts      # 构建与代理配置
└── docker-compose.yml      # 全栈容器化部署编排
```

## 快速运行指南

### 1. 环境准备
在 `backend` 目录下创建 `.env` 文件：
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/lovejournal
SECRET_KEY=your_secure_string
AMAP_KEY=your_amap_api_key
```

### 2. 后端部署
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. 前端部署
```bash
cd frontend
npm install
npm run dev
```

## 许可证
本项目遵循 MIT License 协议。
