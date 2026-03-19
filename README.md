<div align="center">
  <a href="./README_en.md">English</a> | 简体中文
</div>

# LoveJournal-New -- 生活记录与空间记忆系统

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite)

一个全栈生活记录应用，将地理空间索引与瀑布流时间线深度融合。通过集成高德地图 API 与自动化 Exif 元数据解析，系统在时间和空间两个维度上对齐记忆，构建直观的个人历史数字存储方案。本项目是 [lovejournal](https://github.com/saudademjj/lovejournal)（Flask 版本）的高性能异步重写版。

## 核心功能

### 多维记忆管理
- 支持 Markdown 格式的图文日记，内容渲染经过 DOMPurify 安全净化
- 无损图片画廊上传与浏览
- 精确到天的纪念日追踪与倒计时
- 全局时间轴聚合所有数据类型（日记、照片、纪念日）

### 地理空间记忆
- 上传 GPS 标记的图片时，后端自动提取坐标并转换为高德地图使用的 GCJ-02 坐标系
- PostgreSQL 层面的 GIST 索引优化空间检索，大数据量下仍保持毫秒级地图聚类查询
- 高德地图 JS API 2.0 深度集成：点聚合、自定义覆盖物、「点击地图定位到具体记忆」的交互闭环

### 安全与认证
- JWT 令牌认证（python-jose + bcrypt）
- 用户注册与登录
- 私密数据的访问控制

## 技术架构

### 异步高性能后端

- FastAPI 0.115：异步 I/O 驱动的 Web 框架，处理高频图片上传与地理编码请求
- SQLAlchemy 2.0 Async 模式 + asyncpg 驱动：非阻塞数据库交互，缓解并发访问下的连接池瓶颈
- Alembic：数据库 Schema 版本控制与迁移管理
- Pydantic：请求/响应数据的严格校验与序列化
- httpx：异步 HTTP 客户端，用于地理编码 API 调用

### 并发优先的前端

- React 18 + Vite：快速的开发构建与热更新
- React Router 6：客户端路由管理
- Zustand：轻量级状态管理，替代 Redux 的复杂模板代码
- Framer Motion + GSAP：流畅的页面过渡与滚动动画
- Lenis：丝滑的平滑滚动体验
- Tailwind CSS + Radix UI：响应式布局与无障碍组件
- Marked + DOMPurify：安全的 Markdown 渲染管线
- Axios：HTTP 请求封装与拦截器

### 空间数据治理

- 自动坐标校正：上传含 GPS 标签的图片时，后端自动捕获并转换坐标至 GCJ-02 坐标系
- 空间检索优化：PostgreSQL `location` 字段上的 GIST 索引
- 地图交互封装：高德地图 JS API 2.0 组件化，支持点聚合与自定义覆盖物

## 目录结构

```text
Lovejournal-New/
├── backend/                    # 异步后端核心
│   ├── app/
│   │   ├── main.py             # FastAPI 应用入口
│   │   ├── routers/            # 模块化业务路由
│   │   │   ├── auth.py         # 认证路由（注册/登录/令牌刷新）
│   │   │   ├── entries.py      # 日记条目 CRUD
│   │   │   ├── map.py          # 地图数据与地理编码
│   │   │   └── timeline.py     # 时间线聚合查询
│   │   ├── models.py           # SQLAlchemy 异步模型定义
│   │   ├── schemas.py          # Pydantic 校验与数据转换模型
│   │   ├── database.py         # 异步数据库连接管理
│   │   └── utils.py            # 地理编码、Exif 解析、JWT 工具
│   ├── alembic/                # 数据库 Schema 版本控制
│   │   └── versions/           # 迁移脚本
│   └── requirements.txt        # Python 依赖清单
├── frontend/                   # 现代前端应用
│   ├── src/
│   │   ├── components/         # UI 原语、地图封装、瀑布流容器
│   │   ├── hooks/              # 数据获取与地图实例化
│   │   ├── pages/              # 动态导入的路由容器
│   │   ├── store/              # Zustand 状态管理
│   │   └── utils/              # 工具函数
│   ├── vite.config.ts          # 构建配置（API 代理与优化）
│   └── package.json            # 前端依赖
├── docker-compose.yml          # 一键环境编排
└── README.md
```

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 20+
- PostgreSQL 16

### 1. 克隆项目

```bash
git clone https://github.com/saudademjj/Lovejournal-New.git
cd Lovejournal-New
```

### 2. 使用 Docker Compose（推荐）

```bash
docker compose up -d
```

### 3. 手动启动

```bash
# 后端
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 前端
cd frontend
npm install
npm run dev
```

### 4. 数据库迁移

```bash
cd backend
alembic upgrade head
```

## 与 LoveJournal v1 的关系

本项目是 [lovejournal](https://github.com/saudademjj/lovejournal)（基于 Flask 的初始版本）的架构升级重写：

| 维度 | v1 (Flask) | v2 (FastAPI) |
|------|-----------|--------------|
| 后端框架 | Flask (同步) | FastAPI (异步) |
| 数据库驱动 | Flask-SQLAlchemy | SQLAlchemy 2.0 Async + asyncpg |
| 前端 | Jinja2 SSR + Bootstrap | React 18 SPA + Tailwind CSS |
| 地图 | 基础地理编码 | 深度地图交互 + 点聚合 + GIST 索引 |
| 状态管理 | 服务端会话 | JWT + Zustand |
| 构建工具 | 无 | Vite |

## 未来规划

- [ ] AI 回忆录：集成大语言模型对日记内容进行语义分析，生成每周情感报告
- [ ] 分布式存储：支持将图片资产同步到 S3 或其他云对象存储服务
- [ ] 双人协作：实现双向账户绑定与实时内容共享

## 许可证

MIT License
