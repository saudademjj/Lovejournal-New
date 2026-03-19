<div align="center">
  English | <a href="./README.md">简体中文</a>
</div>

# LoveJournal-New -- Life Record & Spatial Memory System

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite)

A full-stack life recording application that merges geographic spatial indexing with a fluid waterfall timeline. By integrating the AMap API and automated Exif metadata parsing, the system aligns memories across both temporal and spatial dimensions, constructing an intuitive digital storage solution for personal history. This project is the high-performance async rewrite of [lovejournal](https://github.com/saudademjj/lovejournal) (Flask version).

## Core Features

### Multi-dimensional Memory Management
- Markdown-formatted journals with content rendered through DOMPurify sanitization
- Lossless image gallery upload and browsing
- Day-precise anniversary tracking and countdowns
- Global timeline aggregating all data types (journals, photos, anniversaries)

### Geospatial Memory
- When GPS-tagged images are uploaded, the backend automatically extracts coordinates and converts them to the GCJ-02 coordinate system used by AMap
- GIST indexing on PostgreSQL location fields ensures millisecond-level map cluster retrieval even with large datasets
- Deep AMap JS API 2.0 integration: point clustering, custom overlays, and a "click map to navigate to specific memory" interaction loop

### Security & Authentication
- JWT token authentication (python-jose + bcrypt)
- User registration and login
- Access control for private data

## Technical Architecture

### Async High-Performance Backend

- FastAPI 0.115: Async I/O-driven web framework handling high-frequency image uploads and geocoding requests
- SQLAlchemy 2.0 Async mode + asyncpg driver: Non-blocking database interactions mitigating connection pool bottlenecks under concurrent access
- Alembic: Database schema version control and migration management
- Pydantic: Strict request/response data validation and serialization
- httpx: Async HTTP client for geocoding API calls

### Concurrency-First Frontend

- React 18 + Vite: Fast development builds and hot module replacement
- React Router 6: Client-side routing management
- Zustand: Lightweight state management replacing Redux boilerplate
- Framer Motion + GSAP: Smooth page transitions and scroll animations
- Lenis: Silky smooth scrolling experience
- Tailwind CSS + Radix UI: Responsive layout and accessible components
- Marked + DOMPurify: Secure Markdown rendering pipeline
- Axios: HTTP request encapsulation with interceptors

### Spatial Data Governance

- Automated Coordinate Correction: When GPS-tagged images are uploaded, the backend automatically captures and converts coordinates to the GCJ-02 system
- Spatial Retrieval Optimization: GIST indexing on PostgreSQL `location` fields
- Map Interaction Encapsulation: AMap JS API 2.0 componentized with point clustering and custom overlays

## Directory Structure

```text
Lovejournal-New/
├── backend/                    # Async Backend Core
│   ├── app/
│   │   ├── main.py             # FastAPI application entry
│   │   ├── routers/            # Modular business routes
│   │   │   ├── auth.py         # Auth routes (register/login/token refresh)
│   │   │   ├── entries.py      # Journal entry CRUD
│   │   │   ├── map.py          # Map data and geocoding
│   │   │   └── timeline.py     # Timeline aggregation queries
│   │   ├── models.py           # SQLAlchemy async model definitions
│   │   ├── schemas.py          # Pydantic validation and data conversion models
│   │   ├── database.py         # Async database connection management
│   │   └── utils.py            # Geocoding, Exif parsing, JWT utilities
│   ├── alembic/                # Database schema version control
│   │   └── versions/           # Migration scripts
│   └── requirements.txt        # Python dependency manifest
├── frontend/                   # Modern Frontend Application
│   ├── src/
│   │   ├── components/         # UI primitives, Map wrappers, Waterfall containers
│   │   ├── hooks/              # Data fetching and Map instantiation
│   │   ├── pages/              # Dynamically imported route containers
│   │   ├── store/              # Zustand state management
│   │   └── utils/              # Utility functions
│   ├── vite.config.ts          # Build config with API proxies and optimizations
│   └── package.json            # Frontend dependencies
├── docker-compose.yml          # One-click environment orchestration
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16

### 1. Clone

```bash
git clone https://github.com/saudademjj/Lovejournal-New.git
cd Lovejournal-New
```

### 2. Using Docker Compose (Recommended)

```bash
docker compose up -d
```

### 3. Manual Launch

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev
```

### 4. Database Migration

```bash
cd backend
alembic upgrade head
```

## Relationship to LoveJournal v1

This project is the architectural upgrade and rewrite of [lovejournal](https://github.com/saudademjj/lovejournal) (the original Flask-based version):

| Dimension | v1 (Flask) | v2 (FastAPI) |
|-----------|-----------|--------------|
| Backend Framework | Flask (synchronous) | FastAPI (asynchronous) |
| Database Driver | Flask-SQLAlchemy | SQLAlchemy 2.0 Async + asyncpg |
| Frontend | Jinja2 SSR + Bootstrap | React 18 SPA + Tailwind CSS |
| Maps | Basic geocoding | Deep map interaction + clustering + GIST index |
| State Management | Server-side sessions | JWT + Zustand |
| Build Tool | None | Vite |

## Roadmap

- [ ] AI Memoirs: Integrate LLMs for semantic analysis of journal entries to generate weekly emotional reports
- [ ] Distributed Storage: Support syncing image assets to S3 or other cloud object storage services
- [ ] Couple Collaboration: Implement bi-directional account binding and real-time content sharing

## License

MIT License
