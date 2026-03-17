# LoveJournal (爱意笔记 - 生活记录系统)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red?logo=sqlalchemy)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)

LoveJournal 是一款结合地理位置与时间轴的生活记录应用。它不仅支持基础的文本与图片存储，还通过集成地图 API，实现了记录在空间维度的可视化展示。

## 主要功能

- 时间轴视图: 基于瀑布流设计的记录展示。
- 地图视图: 集成高德地图 (AMap) API，展示各条记录对应的地理位置。
- 数据同步与解析: 自动解析上传图片中的 Exif 地理坐标信息（若存在）。
- 异步后端: 采用 FastAPI 异步框架，并结合 asyncpg 优化数据库访问性能。

## 技术栈

### 后端
- 框架: FastAPI
- ORM: SQLAlchemy 2.0 (Async)
- 数据库: PostgreSQL

### 前端
- 框架: React 19 (Vite)
- 样式: Radix UI, Tailwind CSS
- 地图: AMap JS API

## 项目结构

```text
.
├── backend             # FastAPI 异步后端
│   ├── app
│   │   ├── routers     # 路由实现 (Auth, Entries, Map, Timeline)
│   │   ├── models.py   # 数据模型
│   │   └── utils.py    # 地理编码工具
├── frontend            # React 前端
│   ├── src/components  # UI 组件
│   └── src/pages       # 视图页面
└── docker-compose.yml  # 全栈容器化配置
```

## 快速启动

### 1. 配置
在 `backend` 创建 `.env`:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/lovejournal
SECRET_KEY=your_key
AMAP_KEY=your_amap_api_key
```

### 2. 后端运行
`pip install -r requirements.txt && uvicorn app.main:app --reload`

### 3. 前端运行
`npm install && npm run dev`

## 许可证
MIT License
