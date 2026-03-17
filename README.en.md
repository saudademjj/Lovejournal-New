# LoveJournal New

[中文说明](./README.md)

`LoveJournal New` is the rebuilt version of `LoveJournal`, redesigned as a split frontend and backend application. It turns journaling, photo management, anniversaries, timelines, and map views into a modern web stack that is easier to scale and maintain.

## Stack

- Backend: `FastAPI`, `SQLAlchemy`, `PostgreSQL`
- Frontend: `React`, `TypeScript`, `Vite`, `Tailwind CSS`
- State and motion: `Zustand`, `Framer Motion`

## Core Features

- JWT-based authentication
- Aggregated timeline with pagination
- CRUD for journal entries, photos, and anniversaries
- Tag filtering and content management
- Map data API and client-side map rendering
- File upload and static asset serving

## Repository Structure

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

## Requirements

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Quick Start

### 1. Start the backend

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

Pay special attention to `DATABASE_URL`, `SECRET_KEY`, and `CORS_ORIGINS` in `backend/.env`.

Bootstrap the first admin account:

```bash
curl -X POST "http://localhost:8000/api/auth/bootstrap?username=admin&password=pass"
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The default frontend URL is `http://localhost:5173`

## Main Configuration

Backend:

- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `UPLOAD_DIR`
- `AMAP_WEB_KEY`
- `AMAP_JS_CODE`
- `CORS_ORIGINS`

Frontend:

- `VITE_API_BASE_URL`
- `VITE_AMAP_JS_KEY`
- `VITE_AMAP_JS_CODE`
- `VITE_AMAP_WEB_KEY`
- `VITE_GEOJSON_CDN`

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
