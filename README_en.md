<div align="center">
  English | <a href="./README.md">简体中文</a>
</div>

# LoveJournal (Life Record & Spatial Memory System)

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwind-css)

This project is a full-stack life recording application deeply integrated with geographic indexing and a fluid timeline. Designed to break the single dimension of traditional text diaries, the system leverages spatial visualization via the AMap API and automated image Exif metadata parsing to construct a "Digital Memory Palace" with spatial depth.

## Core Architecture & Technical Implementation

### 1. Asynchronous High-Performance Backend
The backend is built on the **FastAPI** asynchronous framework, fully embracing Python's `async/await` primitives.
- **Non-blocking Persistence**: Utilizes `SQLAlchemy 2.0 (Async mode)` with the `asyncpg` driver, achieving efficient concurrent interactions with the PostgreSQL database.
- **Automated Metadata Governance**: Features an integrated image processing pipeline that automatically extracts and calibrates GPS coordinates and timestamps from Exif data during upload, enabling automated geographic archiving.

### 2. Spatial Memory Visualization
- **Map-driven Interaction**: Deeply encapsulates the AMap JS API 2.0, enabling aggregated display and real-time navigation across massive record points.
- **Geo-index Optimization**: Implements GIST spatial indexing on coordinate fields at the database level, ensuring high retrieval efficiency even with large-scale datasets.

### 3. Responsive Frontend Experience
- **React 19 Concurrent Rendering**: Leverages the latest concurrent features to optimize waterfall list loading performance, ensuring fluid view transitions.
- **Modern UI Standards**: Combines Radix UI and Tailwind CSS to build a highly semantic and responsive interface.

## Project Structure

```text
Lovejournal-New/
├── backend/                # Async Backend Core
│   ├── app/
│   │   ├── routers/        # Modular routes (Auth, Record Management, Map Aggregation)
│   │   ├── models.py       # SQLAlchemy async data models
│   │   ├── schemas.py      # Pydantic-based validation and response models
│   │   └── utils.py        # Geocoding, image processing, and JWT utilities
│   ├── migrations/         # Alembic database versioning
│   ├── requirements.txt    # Dependency manifest
│   └── main.py             # Application entry point
├── frontend/               # React Frontend Implementation
│   ├── src/
│   │   ├── components/     # UI primitives and map-specific components
│   │   ├── hooks/          # AMap instance management and data fetching
│   │   └── pages/          # Route container pages
│   └── vite.config.ts      # Build and proxy configuration
└── docker-compose.yml      # Full-stack containerization orchestration
```

## Quick Start

### 1. Environment Setup
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/lovejournal
SECRET_KEY=your_secure_string
AMAP_KEY=your_amap_api_key
```

### 2. Backend Deployment
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend Deployment
```bash
cd frontend
npm install
npm run dev
```

## License
This project is licensed under the MIT License.
