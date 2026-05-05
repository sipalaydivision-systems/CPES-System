# SMART WINGS: CPES

**Contextualized Partnership Engagement System** — SDO Sipalay City · Negros Island Region

A full-stack system for managing partnership engagements across schools in the Schools Division Office of Sipalay City, Department of Education.

## Functional Areas

| FA | Module | Purpose |
|----|--------|---------|
| **FA1** | Transmittal Reports | Year → Month → School drill-down with per-school report generation |
| **FA2** | Research & Innovation | File-based repository for approved research papers |
| **FA3** | Donation Reports | Donor-categorized donation tracking (Internal / External) |
| **FA4** | Monthly Repository | Auto-derived cluster aggregations from FA1 (read-only view) |
| **FA5** | Certifications | HIYAS Rewards & Recognition certifications |
| **FA6** | MOA / MOU / DOD / DOA | Centralized agreement archive with file uploads |

## Tech Stack

- **Backend** — Node.js · Express · Prisma · PostgreSQL · JWT · Multer
- **Frontend** — Vanilla JS SPA · Tailwind CSS (CDN) · Custom design system
- **Storage** — PostgreSQL `BYTEA` for binary file storage (5MB cap, auto-reconstructed on download)
- **Hosting** — Railway (single service serves API + static client)

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access — manage users, all CRUD, all functional areas |
| **Editor** | Create / Edit records, upload files, view all data |
| **Viewer** | Read-only access to all records |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL connection string (Railway provides automatically)

### Local Development

```bash
# 1. Install dependencies
cd server && npm install

# 2. Configure environment
cp ../.env.example server/.env
# Edit server/.env with your DATABASE_URL

# 3. Run migrations
npx prisma migrate deploy

# 4. Start server (serves API + client)
npm start
```

Open <http://localhost:3000> and register the first account — it auto-promotes to **Admin**.

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=long-random-string
PORT=3000
NODE_ENV=production
```

## Project Structure

```
CPES-System/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── migrations/           # Migration history
│   └── src/
│       ├── index.js              # Express entry point
│       ├── lib/
│       │   ├── prisma.js         # Prisma client singleton
│       │   └── crud.js           # Generic CRUD helper
│       ├── middleware/
│       │   └── auth.js           # JWT auth middleware
│       └── routes/
│           ├── auth.js           # Login / register
│           ├── transmittals.js   # FA1 (with aggregations)
│           ├── research.js       # FA2
│           ├── donations.js      # FA3
│           ├── certifications.js # FA5
│           ├── agreements.js     # FA6
│           ├── files.js          # Binary upload / download
│           └── users.js          # User management (Admin)
├── client/
│   ├── index.html                # SPA shell with Tailwind CDN
│   └── js/
│       ├── api.js                # Fetch wrapper
│       ├── store.js              # In-memory session
│       ├── ui.js                 # UI primitives (modal, toast, badges)
│       ├── shell.js              # Sidebar + topbar
│       ├── auth.js               # Login / register pages
│       ├── app.js                # Router + boot
│       └── views/                # One file per route
└── railway.json                  # Railway deployment config
```

## API Reference

All `/api/*` endpoints (except `/api/auth/*`) require a `Bearer` token in the `Authorization` header.

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/auth/register` | First user auto-becomes Admin |
| `POST` | `/api/auth/login` | Returns JWT token |
| `GET` | `/api/auth/me` | Current user |
| `GET/POST/PATCH/DELETE` | `/api/transmittals` | FA1 |
| `GET` | `/api/transmittals/aggregate/by-period` | Year > Month > School |
| `GET` | `/api/transmittals/aggregate/by-cluster?year=&month=` | FA4 |
| `GET/POST/PATCH/DELETE` | `/api/research` | FA2 (file-linked) |
| `GET/POST/PATCH/DELETE` | `/api/donations` | FA3 |
| `GET/POST/PATCH/DELETE` | `/api/certifications` | FA5 |
| `GET/POST/PATCH/DELETE` | `/api/agreements` | FA6 (file-linked) |
| `POST` | `/api/files` | `multipart/form-data` upload |
| `GET` | `/api/files/:id` | Reconstructs original file |
| `GET/POST/PATCH/DELETE` | `/api/users` | Admin only |

## Deployment

Configured for Railway. Push to `main` triggers automatic build:

```bash
git push origin main
```

Build command: `cd server && npm install && npx prisma generate && npx prisma migrate deploy`
Start command: `cd server && node src/index.js`

## License

Internal use — Department of Education, Schools Division Office of Sipalay City.
