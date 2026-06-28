# Release Checklist

A single-page application to manage software release checklists. Track the completion of predefined release steps and automatically compute release status.

## Live Demo

> Add your Vercel URL here after deployment

## Tech Stack

- **Frontend**: React + Vite (SPA)
- **Backend**: Node.js + Express (REST API)
- **Database**: PostgreSQL (hosted on [Neon](https://neon.tech))
- **Deployment**: Vercel

---

## Database Schema

```sql
CREATE TABLE releases (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  due_date   TIMESTAMPTZ NOT NULL,
  info       TEXT,                        -- optional additional notes
  steps      JSONB NOT NULL DEFAULT '{}', -- e.g. {"1": true, "3": true}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status** is computed from `steps` (never stored):
- `planned`  — 0 steps completed
- `ongoing`  — 1–7 steps completed
- `done`     — all 8 steps completed

**Fixed Steps** (same for every release):
1. Code freeze
2. Run automated tests
3. Review pull requests
4. Update changelog
5. Staging deployment
6. QA sign-off
7. Production deployment
8. Post-deploy smoke test

---

## API Endpoints

| Method   | Path                          | Description                      |
|----------|-------------------------------|----------------------------------|
| `GET`    | `/api/releases`               | List all releases                |
| `GET`    | `/api/releases/:id`           | Get a single release             |
| `POST`   | `/api/releases`               | Create a new release             |
| `PATCH`  | `/api/releases/:id/steps`     | Toggle a step on/off             |
| `PATCH`  | `/api/releases/:id/info`      | Update additional info           |
| `DELETE` | `/api/releases/:id`           | Delete a release                 |
| `GET`    | `/api/health`                 | Health check                     |

### Request/Response Examples

**POST /api/releases**
```json
// Request body
{ "name": "v2.4.0", "due_date": "2025-08-01T10:00:00Z", "info": "Major feature release" }

// Response
{ "id": 1, "name": "v2.4.0", "due_date": "...", "status": "planned", "completedCount": 0, "totalSteps": 8, "steps": {}, "stepDefs": [...] }
```

**PATCH /api/releases/:id/steps**
```json
// Request body
{ "stepId": 1, "value": true }
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- A PostgreSQL database (or run via Docker — see below)

### Option A: Standard setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/release-checklist.git
   cd release-checklist
   ```

2. **Set up the server**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env and set DATABASE_URL to your Postgres connection string
   npm install
   npm run dev   # starts on http://localhost:3001
   ```

3. **Set up the client** (new terminal)
   ```bash
   cd client
   cp .env.example .env
   # VITE_API_URL=http://localhost:3001 (already set in .env.example)
   npm install
   npm run dev   # starts on http://localhost:5173
   ```

4. Open **http://localhost:5173**

### Option B: Docker (includes local Postgres)

```bash
# Start Postgres + API server
docker-compose up -d

# Start client (still runs outside Docker)
cd client && npm install && npm run dev
```

---

## Deploying to Vercel

1. Push this repo to GitHub

2. Create a free Postgres database at [neon.tech](https://neon.tech) and copy the connection string

3. Import the repo on [vercel.com](https://vercel.com):
   - Set environment variable: `DATABASE_URL` = your Neon connection string
   - Vercel auto-detects the `vercel.json` config

4. Deploy — done!

---

## Project Structure

```
release-checklist/
├── client/                  # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ReleaseList.jsx
│   │   │   ├── ReleaseDetail.jsx
│   │   │   └── CreateReleaseModal.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── index.css
│   └── vite.config.js
├── server/                  # Express API
│   ├── routes/releases.js
│   ├── db.js
│   ├── steps.js
│   ├── index.js
│   └── Dockerfile
├── docker-compose.yml
├── vercel.json
└── README.md
```
