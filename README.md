# TaskFlow

A small, secure task management platform built to demonstrate a production-shaped
NestJS + Next.js + PostgreSQL stack: authentication, ownership-scoped CRUD, and the
security practices that go with them.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL, via Prisma ORM
- **Auth:** JWT access tokens (in-memory on the client) + rotating refresh tokens
  (httpOnly cookie)
- **DevOps:** Docker + Docker Compose
- **Testing:** Jest (unit tests, mocked Prisma)

## Features

- Register / login / logout, protected routes
- Create, read, update, delete tasks — each task scoped to its owner
- Filter tasks by status
- Loading / error / empty states throughout the UI

## Security

This isn't a toy auth flow — a few choices worth calling out in an interview:

- **Password hashing:** bcrypt, 12 salt rounds. Passwords are validated server-side
  (min 8 chars, upper + lower + digit) before hashing.
- **Two-token JWT scheme:** short-lived access tokens (15m) carried in memory on the
  client and sent as `Authorization: Bearer`; long-lived refresh tokens (7d) stored
  **only** in an httpOnly, `SameSite=Lax`, path-scoped (`/api/auth`) cookie. The access
  token is never persisted to `localStorage`/`sessionStorage`, which keeps it out of
  reach of a successful XSS payload.
- **Refresh token rotation + theft detection:** every refresh issues a new refresh
  token and the old one's hash is discarded. Only the bcrypt hash of the current
  refresh token is stored in the database — never the raw token — so a leaked DB row
  can't be replayed as a session. If a presented refresh token doesn't match what's on
  file (a sign of a replayed/stolen token), the stored session is invalidated
  immediately.
- **User enumeration resistance:** login fails with the same generic message ("Invalid
  email or password") whether the email doesn't exist or the password is wrong.
- **Ownership checks return 404, not 403:** requesting another user's task ID returns
  "not found," not "forbidden" — this avoids confirming to an attacker that a given
  task ID even exists.
- **Auth is opt-out, not opt-in:** a global guard (`JwtAuthGuard`) requires a valid
  access token on every route by default; routes are marked `@Public()` explicitly
  (register, login, refresh, health check). Missing a guard on a new route is a much
  easier mistake to make than missing a `@Public()` decorator you'd notice immediately.
- **Rate limiting:** `@nestjs/throttler` caps auth endpoints at 5 requests/minute per
  IP (and 100 req/min globally) to slow down credential-stuffing and brute force.
- **Strict input validation:** every DTO uses `class-validator` with a global
  `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — unexpected fields
  are rejected outright, not silently dropped or passed through to Prisma.
- **No leaked internals:** a global exception filter normalizes all errors to a
  consistent shape and logs unexpected exceptions server-side only — stack traces and
  Prisma error internals never reach the client.
- **Standard hardening:** `helmet` for security headers, CORS locked to the configured
  frontend origin with credentials, environment variables validated at startup with
  Joi (the app refuses to boot with a missing/weak JWT secret).
- **SQL injection:** not applicable in the traditional sense — all queries go through
  Prisma's parameterized query builder, no raw SQL.

## Project structure

```
TaskFlow/
├── backend/    NestJS API (auth, users, tasks modules)
├── frontend/   Next.js app (App Router)
└── docker-compose.yml
```

## Running locally

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

This starts Postgres, runs pending Prisma migrations, and starts both the API
(`http://localhost:4000`) and the web app (`http://localhost:3000`).

### Option B — run services directly

1. Start Postgres (or point `DATABASE_URL` at your own instance):
   ```bash
   docker compose up -d postgres
   ```
2. Backend:
   ```bash
   cd backend
   cp .env.example .env   # then edit JWT secrets if you want real ones
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```
3. Frontend:
   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```

## Testing

```bash
cd backend
npm test           # unit tests (AuthService, TasksService) — no DB required
npm run test:e2e   # requires Postgres running (docker compose up -d postgres)
```

Unit tests cover, among other things:

- Passwords are hashed, never stored or returned in plaintext
- Login gives an identical error for "unknown email" and "wrong password"
- Refresh token rotation, and invalidation on a mismatched/replayed token
- A task request from a non-owner 404s and never reaches `update`/`delete`

## API overview

| Method | Route                | Auth | Description                  |
| ------ | --------------------- | ---- | ----------------------------- |
| POST   | `/api/auth/register`  | —    | Create an account              |
| POST   | `/api/auth/login`     | —    | Log in                        |
| POST   | `/api/auth/refresh`   | cookie | Rotate access/refresh tokens |
| POST   | `/api/auth/logout`    | ✓    | Invalidate the refresh token   |
| GET    | `/api/users/me`       | ✓    | Current user profile           |
| GET    | `/api/tasks`          | ✓    | List own tasks (filter/paginate) |
| POST   | `/api/tasks`          | ✓    | Create a task                  |
| GET    | `/api/tasks/:id`      | ✓    | Get one (own) task             |
| PATCH  | `/api/tasks/:id`      | ✓    | Update one (own) task          |
| DELETE | `/api/tasks/:id`      | ✓    | Delete one (own) task          |

## Data model

```
User
  id, email (unique), name, passwordHash, refreshTokenHash
  └── tasks: Task[]

Task
  id, title, description, status, priority, dueDate, userId
  status:   PENDING | IN_PROGRESS | COMPLETED
  priority: LOW | MEDIUM | HIGH
```
