<div align="center">
  English | <a href="./README.md">简体中文</a>
</div>

# LoveJournal (Life Record & Spatial Memory System)

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)

A full-stack life recording application that merges geographic indexing with a fluid waterfall timeline. By integrating the AMap API and automated Exif metadata parsing, the system aligns memories across both temporal and spatial dimensions, constructing an intuitive digital storage solution for personal history.

## 🌟 Core Architectural Features

### 1. Asynchronous High-Performance Backend
- **Async I/O Driven**: Built on **FastAPI**, the backend utilizes an asynchronous programming model to handle high-frequency image uploads and geocoding requests, ensuring high throughput per instance.
- **Non-blocking Persistence**: Paired with `SQLAlchemy 2.0` in Async mode and the `asyncpg` driver, it achieves non-blocking database interactions, mitigating connection pool bottlenecks under concurrent access.

### 2. Spatial-Temporal Data Governance
- **Automated Coordinate Correction**: Built-in geographic information extraction. When GPS-tagged images are uploaded, the backend automatically captures and converts coordinates to the GCJ-02 system used by AMap.
- **Spatial Retrieval Optimization**: Implements GIST indexing on `location` fields at the PostgreSQL level, ensuring millisecond-level map cluster retrieval even with large datasets.

### 3. Concurrency-First Frontend
- **React 19 Concurrent Mode**: Optimizes the rendering cadence of the waterfall list. Hooks like `useTransition` ensure that complex view switches do not block user interactions.
- **Deep Map Interaction**: Encapsulates AMap JS API 2.0 components for point clustering and custom overlays, creating a feedback loop where "clicking the map navigates to the specific memory."

## 📂 Project Structure

```text
Lovejournal-New/
├── backend/                # Async Backend Core
│   ├── app/
│   │   ├── routers/        # Modular business routes (Auth, Entries, Map, Timeline)
│   │   ├── models.py       # SQLAlchemy async model definitions
│   │   ├── schemas.py      # Pydantic validation and data conversion models
│   │   └── utils.py        # Utilities for geocoding, Exif, and JWT
│   ├── alembic/            # Database schema version control
│   └── requirements.txt    # Pinpointed dependency manifest
├── frontend/               # Modern Frontend Application
│   ├── src/
│   │   ├── components/     # UI primitives, Map wrappers, and Waterfall containers
│   │   ├── hooks/          # Custom data fetching and Map instantiation
│   │   └── pages/          # Dynamically imported route containers
│   └── vite.config.ts      # Build config with API proxies and optimizations
└── docker-compose.yml      # One-click environmental orchestration
```

## 🚀 Quick Start

### 1. Prerequisites
Ensure Python 3.11+, Node.js 20+, and PostgreSQL 16 are installed.

### 2. Launch Services
```bash
# Backend Launch
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend Launch
cd frontend
npm install
npm run dev
```

## 🗺️ Roadmap
- [ ] **AI Memoirs**: Integrate LLMs for semantic analysis of journal entries to generate weekly emotional reports.
- [ ] **Distributed Storage**: Support syncing image assets to S3 or other cloud object storage services.
- [ ] **Couple Collaboration**: Implement bi-directional account binding and real-time content sharing.

## License
MIT License
