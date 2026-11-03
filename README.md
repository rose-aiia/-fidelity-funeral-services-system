# Fidelity Funeral Services System

A digital home for families in Zimbabwe and the diaspora when they lose someone: funeral
planning, cover, burial arrangements, remembrance and aftercare in one place.

The repository is a small monorepo holding three apps plus shared docs.

## Layout

| Path | What it is |
| --- | --- |
| `funeral-service-prototype/` | The React front end (Vite + React 19 + React Router 7 + TanStack Query). Feature-based: `src/features/*`, shared `src/components/ui`, `src/lib`, `src/config`. |
| `funeral-service-backend/` | The API (Express + Prisma + Zod, TypeScript). Layered: `src/config`, `src/routes`, `src/controllers`, `src/middleware`; schema in `prisma/schema.prisma`. |
| `funeral-service-frontend-api/` | A thin shared API client stub. |
| `docs/` | Frontend design and integration docs (see `funeral-service-prototype/docs`). |

## Running the apps

Each app has its own `package.json`. Install and run them separately.

### Front end

```sh
cd funeral-service-prototype
npm install
cp .env.example .env.local   # optional: tweak API mode / proxy target
npm run dev                  # http://localhost:5173
```

By default the front end runs on built-in sample data (`VITE_API_MODE=mock`) and needs no
backend. To exercise live mode without a backend, use the reference mock server:

```sh
cd funeral-service-prototype
npm run mock-api             # reference server on :8080
echo VITE_API_MODE=live > .env.local
npm run dev
```

### Backend

```sh
cd funeral-service-backend
npm install
cp .env.example .env         # set DATABASE_URL and a strong JWT_SECRET
npm run dev                  # http://localhost:4000
```

To point the front end at the real backend instead of the mock, set
`API_PROXY_TARGET=http://localhost:4000` in `funeral-service-prototype/.env.local`.
The Vite dev proxy forwards `/api` to that target with the `/api` prefix removed, so the
browser sees a single origin and no CORS setup is needed in development.

### Ports at a glance

| Service | Port |
| --- | --- |
| Front end (Vite dev) | 5173 |
| Backend API | 4000 |
| Reference mock API (`npm run mock-api`) | 8080 |

## Conventions

- **Own the price server-side.** The front end only previews totals; the API computes them.
- **Errors are `{ code, message, details? }`** with the right status (422 validation, 429 rate limit).
- **Feature isolation.** Each feature owns its `api.ts`, `queries.ts` and UI; only `lib/http.ts`
  talks to the network.
- **Secrets never committed.** `.env` files are gitignored; only `.env.example` is tracked.

See `funeral-service-prototype/README.md` for the product walkthrough and
`funeral-service-prototype/docs/backend-integration.md` for the API contract notes.
