# LoveJournal New

<p align="right">中文 | <a href="https://github.com/saudademjj/Lovejournal-New/tree/en/readme">English</a></p>

`LoveJournal New` 是 `LoveJournal` 的重构版本，采用前后端分离架构，将“恋爱日记 / 照片 / 纪念日 / 时间轴 / 地图”这些能力拆分为独立 API 和现代前端应用，方便继续演进与部署。

## 项目定位

- 后端：`FastAPI` + `SQLAlchemy` + `PostgreSQL`
- 前端：`React` + `TypeScript` + `Vite` + `Tailwind CSS`
- 状态与交互：`Zustand`、`Framer Motion`

## 核心能力

- JWT 登录认证
- 时间轴聚合与分页浏览
- 日记、照片、纪念日的增删改查
- 标签筛选与内容管理
- 地图数据接口与前端地图展示
- 图片上传与静态文件访问

## 仓库结构

```text
Lovejournal-New/
├── backend/
│   ├── app/
│   │   ├── routers/
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
├── README.md
└── README.en.md
```

## 环境要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## 快速开始

### 1. 启动后端

```bash
git clone https://github.com/saudademjj/Lovejournal-New.git
cd Lovejournal-New
cp backend/.env.example backend/.env
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

请重点配置 `backend/.env` 中的 `DATABASE_URL`、`SECRET_KEY` 和 `CORS_ORIGINS`。

首次初始化管理员账号：

```bash
curl -X POST "http://localhost:8000/api/auth/bootstrap?username=admin&password=pass"
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认前端地址：`http://localhost:5173`

## 关键配置

后端 `.env`：

- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `UPLOAD_DIR`
- `AMAP_WEB_KEY`
- `AMAP_JS_CODE`
- `CORS_ORIGINS`

前端环境变量：

- `VITE_API_BASE_URL`
- `VITE_AMAP_JS_KEY`
- `VITE_AMAP_JS_CODE`
- `VITE_AMAP_WEB_KEY`
- `VITE_GEOJSON_CDN`

## API 模块

- 认证：`/api/auth/*`
- 时间轴：`/api/timeline`、`/api/tags`
- 内容管理：`/api/entries`、`/api/keydates`、`/api/photos`
- 地图：`/api/map`

## 适合继续扩展的方向

- 多用户协作或共享相册
- 更丰富的时间轴筛选和搜索
- 地图轨迹与地点聚类
- 审计日志和后台管理界面

## 许可证

本仓库采用 MIT License，详见 [LICENSE](./LICENSE)。
