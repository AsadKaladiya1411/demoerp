# Backend (demo) for Jolly ERP

This repository contains the Express + TypeScript demo backend for the ERP. It stores normalized module collections in `backend/data/records.json` and serializes atomic operation batches to prevent concurrent file-write loss.

Quick start (Docker):

1. Copy `.env.example` to `.env` and edit secrets as needed.
2. Run:

```bash
docker-compose up --build
```

This starts the backend on port `4000` with the data directory mounted for persistence.

API endpoints:
- `POST /api/login` with `{ username, password }`
- `GET /api/session` validates a stored bearer token
- `GET /api/state/snapshot` returns the authenticated ERP snapshot
- `PATCH /api/state` applies an authorized atomic operation batch
- `GET/POST /api/:collection` and `PUT/DELETE /api/:collection/:id` provide protected record CRUD
