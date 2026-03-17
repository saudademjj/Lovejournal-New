<div align="center">
  <a href="./README_en.md">English</a> | 简体中文
</div>

# LoveJournal (生活记录与空间记忆系统)

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)

本项目是一个融合了地理位置索引与流式时间轴的全栈记录应用。通过集成高德地图 API 与自动化的 Exif 元数据解析，系统实现了记录在“时间”与“空间”维度的双重对齐，构建了一个直观、高效的数字化记忆存储方案。

## 🌟 核心工程架构

### 1. 异步高性能后端
- **异步 I/O 驱动**: 后端基于 **FastAPI** 构建，全面采用异步编程模型。利用 `async/await` 原语处理高频的图片上传与地理编码请求，确保单一实例的高吞吐量。
- **非阻塞持久层**: 配合 `SQLAlchemy 2.0` 的 Async 模式与 `asyncpg` 驱动，实现了数据库访问的非阻塞化，极大缓解了并发访问下的连接池瓶颈。

### 2. 时空关联的数据治理
- **自动化坐标修复**: 系统内置地理信息提取逻辑。当用户上传包含 GPS 信息的图片时，后端自动通过 `piexif` 等工具抓取坐标并转换为高德地图适用的 GCJ-02 坐标系。
- **空间检索优化**: 在 PostgreSQL 层面针对 `location` 字段建立索引，支持在大规模数据量下实现毫秒级的地图聚合点检索。

### 3. 并发优先的前端视图
- **React 19 特性应用**: 利用最新的并发模式优化瀑布流列表的渲染节奏，通过 `useTransition` 等 Hook 确保复杂的视图切换不阻塞用户交互。
- **地图深度交互**: 封装了基于 AMap JS API 2.0 的点聚合与自定义覆盖物组件，实现了“点击地图即刻跳转至对应回忆”的交互闭环。

## 📂 项目结构规范

```text
Lovejournal-New/
├── backend/                # 异步后端工程
│   ├── app/
│   │   ├── routers/        # 模块化业务路由 (Auth, Entries, Map, Timeline)
│   │   ├── models.py       # SQLAlchemy 异步模型定义
│   │   ├── schemas.py      # Pydantic 类型校验与数据转换模型
│   │   └── utils.py        # 包含地理编码、Exif 处理与 JWT 的工具集
│   ├── alembic/            # 数据库版本迁移控制
│   └── requirements.txt    # 精确的版本依赖清单
├── frontend/               # 现代前端应用
│   ├── src/
│   │   ├── components/     # UI 原子组件、地图包装器与瀑布流容器
│   │   ├── hooks/          # 自定义数据拉取与地图实例化逻辑
│   │   └── pages/          # 基于动态导入的路由容器
│   └── vite.config.ts      # 包含 API 代理与性能优化的构建配置
└── docker-compose.yml      # 一键式环境编排配置文件
```

## 🚀 快速启动指南

### 1. 环境准备
确保已预安装 Python 3.11+, Node.js 20+ 与 PostgreSQL 16。

### 2. 服务部署
```bash
# 后端启动
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 前端启动
cd frontend
npm install
npm run dev
```

## 🗺️ 未来演进路线
- [ ] **AI 回忆录**: 集成 LLM 对日记内容进行语义分析，自动生成周度情感总结报告。
- [ ] **分布式存储**: 支持将图片资产同步至 S3 或其他云端对象存储服务。
- [ ] **伴侣协同**: 实现多用户间的双向账户绑定与实时内容共享。

## 许可证
本项目采用 MIT License 协议。
