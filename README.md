# OpenRecruitOS

**The Open Source Recruitment Operating System**

*By Attitude360*

OpenRecruitOS **Community Edition** is a simple, modern, self-hostable open-source **Applicant Tracking System (ATS)**. It is intentionally small and focused — six core modules, no enterprise bloat:

1. **Job Management** — create, edit, open/close and delete jobs
2. **Candidate Management** — profiles, resumes, skills, notes & tags
3. **Application & Pipeline** — Kanban board with stage history
4. **Basic Resume Parsing** — PDF / DOC / DOCX upload with field extraction (no AI)
5. **Basic Interview Management** — schedule, complete, cancel, feedback
6. **Basic Dashboard** — headline stats, pipeline overview, recent activity

> Simple → Fast → Clean → Usable

---

## Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend   | Node.js runtime, TypeScript, REST API routes    |
| Database  | SQLite (default) or PostgreSQL — via Prisma ORM |
| Auth      | Session cookie (JWT) + bcrypt password hashing  |
| Files     | Local storage driver behind a pluggable interface |
| Deployment| Docker + Docker Compose                         |

---

## Quick Start (Docker)

```bash
git clone <repository>
cd openrecruitos
docker compose up -d
```

Open **http://localhost:3000** and sign in with the seeded demo account:

| Email                   | Password  |
| ----------------------- | --------- |
| `admin@attitude360.com` | `admin123`|

Demo data (5 jobs, 15 candidates, applications across every pipeline stage, 3 hires, 5 interviews) is seeded automatically on first start. Set `SEED_DEMO_DATA=false` to skip it.

### PostgreSQL setup

The default compose file uses SQLite (zero external services). To run with PostgreSQL:

```bash
docker compose -f docker-compose.postgres.yml up -d
```

This builds the same app against the PostgreSQL Prisma datasource and starts a `postgres:16` container.

---

## Local Development

```bash
bun install                 # or npm install
cp .env.example .env        # adjust DATABASE_URL / JWT_SECRET if needed
bun run db:push             # create/update the database schema
bun run db:seed             # load demo data
bun run dev                 # start the dev server on :3000
```

Useful scripts:

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `bun run dev`     | Start the development server             |
| `bun run lint`    | Run ESLint                               |
| `bun run build`   | Production build (standalone output)     |
| `bun run db:push` | Push the Prisma schema to the database   |
| `bun run db:seed` | Seed demo data (admin user + sample data)|

> **Switching to PostgreSQL locally:** change the datasource provider in
> `prisma/schema.prisma` to `postgresql` (a ready-made copy lives at
> `prisma/schema.postgres.prisma`), point `DATABASE_URL` at your Postgres
> instance and run `bun run db:push`.

---

## The Core Workflow

The full recruitment loop works end-to-end:

```
Login → Create Job → Create Candidate → Upload Resume → Parse Resume
  → Review Candidate → Apply to Job → Applied → Screening → Interview
  → Schedule Interview → Complete Interview → Feedback → Selected → Hired
```

Also supported: **reject a candidate** (separate terminal stage) and **close a job**.

Candidates can be moved through the pipeline by **drag & drop** on the Kanban
board (desktop) or via the card menu / stage dropdowns (touch-friendly).

---

## Project Structure

```
src/
  app/
    page.tsx                 # Single-page app shell (login + all views)
    api/                     # REST API (route handlers)
      auth/                  #   login / logout / me / password
      jobs/                  #   /api/jobs, /api/jobs/:id
      candidates/            #   /api/candidates, /api/candidates/:id
      candidates/parse-resume/ #  upload + basic parsing
      applications/          #   /api/applications, /api/applications/:id (stage moves + history)
      interviews/            #   /api/interviews, /api/interviews/:id
      dashboard/             #   stats + pipeline counts + recent activity
      resumes/               #   authenticated resume download
  components/                # UI views & shared building blocks
  lib/
    auth.ts                  # JWT session + bcrypt helpers
    storage.ts               # StorageDriver interface + local driver (S3-ready)
    resume-parser.ts         # ResumeParser interface + basic (non-AI) parser
    constants.ts             # stages, statuses, employment types
    client.ts                # typed API client
prisma/
  schema.prisma              # SQLite datasource (default)
  schema.postgres.prisma     # PostgreSQL datasource (drop-in swap)
scripts/
  seed.ts                    # demo data seeder
Dockerfile                   # multi-stage build (sqlite | postgresql)
docker-compose.yml           # SQLite, single container
docker-compose.postgres.yml  # App + PostgreSQL
```

---

## Database Model

Six entities, deliberately minimal:

- **User** — account, bcrypt-hashed password
- **Job** — title, description, skills, experience, location, salary, employment type, status (Open/Closed)
- **Candidate** — profile, resume file reference, skills, experience, education, notes, tags
- **Application** — candidate ↔ job, current stage, status, applied date
- **ApplicationHistory** — every stage change (`previousStage → newStage`)
- **Interview** — application, interviewer, date/time, status (Scheduled/Completed/Cancelled), feedback

Pipeline stages: `Applied → Screening → Interview → Selected → Hired`, with `Rejected` as a separate terminal stage.

---

## Design Notes (for future commercial editions)

The codebase is deliberately modular so **OpenRecruitOS Cloud** and
**OpenRecruitOS Enterprise** can extend it without rewrites:

- **Resume parsing** sits behind the `ResumeParser` interface
  (`src/lib/resume-parser.ts`). The shipped implementation is regex/heuristics
  only — an AI-powered parser (matching, ranking, summaries) can replace it by
  registering a new implementation, with zero API/UI changes.
- **File storage** sits behind the `StorageDriver` interface
  (`src/lib/storage.ts`). The Community Edition ships a local driver; an
  S3-compatible driver is a drop-in replacement.
- **Authentication** is isolated in `src/lib/auth.ts` so SSO/SAML/SCIM can be
  added for the Enterprise edition.
- **Database** switches between SQLite and PostgreSQL by swapping one Prisma
  datasource line — the schema is portable.

Intentionally **not** included in the Community Edition (per scope): AI
features, job-board integrations (LinkedIn/Naukri/Indeed), calendar/video
integrations, email/SMS/WhatsApp, advanced analytics, multi-tenancy, billing
and a public career portal.

---

## Security Notes

- Passwords are hashed with **bcrypt**; sessions use signed **JWT** cookies
  (`HttpOnly`, `SameSite=Lax`).
- All API routes require an authenticated session; resume downloads are
  access-controlled and guarded against path traversal.
- Set a strong `JWT_SECRET` in production (see `.env.example`).
- Runs behind HTTPS in production? Flip `secure: true` on the session cookie in
  `src/lib/auth.ts`.

## License

Open source — Community Edition by Attitude360.
