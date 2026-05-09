# LearnFlow LMS (Go / Chi)

LearnFlow is a Learning Management System (LMS) implemented in Go using the **Chi** router, with authentication + middleware, and a database layer that can run on **SQLite** (default) or **PostgreSQL**.

## Tech Stack
- **Go** + **Chi** router
- **SQLite** (`github.com/mattn/go-sqlite3`) or **PostgreSQL**
- **JWT/session auth** (project internal auth package)
- Middleware:
  - Request logging, recoverer, compression
  - Rate limiting
  - Security headers / request validation
  - CORS
- Frontend:
  - Serves `index.html` and `web/static/*`

## Quick Start (SQLite / Dev)

### 1) Run the server
```bash
go run ./cmd/server
```

The server will start on:
- `http://localhost:3000` (unless `PORT` is set)

### 2) Default environment variables
If not provided, the server uses:
- `DB_DRIVER=sqlite`
- `SQLite` file path: `learnflow.db` (resolved using project root)
- `SESSION_SECRET=dev-session-secret-change-in-prod` (warning logged)

## Configuration (Environment Variables)

### Server
- `PORT` (optional): server port (default: `3000`)

### Database
- `DB_DRIVER` (optional): `sqlite` (default) or `postgres`
- `DATABASE_URL` (used when `DB_DRIVER=postgres`)
- `SQLITE_PATH` (optional): full path to SQLite DB file
  - If unset, the server uses `<projectRoot>/learnflow.db`

### Auth / Sessions
- `SESSION_SECRET` (optional): session/JWT secret

## API

Base path: `/api/v1`

### Health
- `GET /api/v1/health`
  - Returns service status and database ping result

### Authenticated Example
All routes under:
- `/api/v1/*` group that uses `sessions.RequireAuth`

- `GET /api/v1/dashboard`
  - Returns a JSON message including session email and role

### Certificates
- `GET /api/v1/certificates/{id}/download`
  - Downloads a certificate (implementation in `internal/handler`)

## Auth Routes

Base path: `/auth`

### Login / Logout / Profile
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/signup`

### Password Reset
- `POST /auth/reset-password`
- `POST /auth/reset-password/confirm`

## Frontend / Static Files
- The server serves:
  - `GET /` → `index.html`
  - Static assets under `/static/*` from `web/static`

SPA routing behavior:
- If the path is not `/api/*` or `/auth/*`, unknown routes fall back to `index.html`.

## Notes on the SQLite Driver
This project uses `github.com/mattn/go-sqlite3`. The SQLite driver must be opened with the driver name `sqlite3`.

## Project Docs
- `prd.md` – Product Requirements Document (LearnFlow LMS)
