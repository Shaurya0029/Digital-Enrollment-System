# Digital Enrollment System — Repo Notes

This repository uses Prisma as the ORM for the backend Postgres/SQLite schema and migrations.

Key locations
- **Prisma schema:** [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- **Migrations:** [backend/prisma/migrations](backend/prisma/migrations)
- **Prisma seed script:** [backend/prisma/seed.ts](backend/prisma/seed.ts) (and JS variant `seed.js`)

Why Prisma
- Prisma is used to define the database schema, generate a type-safe client, and manage migrations.

Common commands
- Install dependencies (backend):
  - `cd backend && npm install`
- Generate Prisma client (run from `backend`):
  - `npx prisma generate`
- Run migrations (apply pending migrations):
  - `npx prisma migrate deploy`   # for CI / production
  - `npx prisma migrate dev`      # during development (creates new migration)
- Run seed script (after migrations):
  - `node prisma/seed.js` or `ts-node prisma/seed.ts`

Inspecting database
- Use `npx prisma studio` from `backend` to open a lightweight browser UI to inspect tables.

Notes
- The backend handlers use the generated `prisma` client (see [backend/src/prisma.ts](backend/src/prisma.ts)).
- Migrations are already included in `backend/prisma/migrations` — review them if you need to understand schema changes.

If you want, I can also:
- Add a short `scripts/` README with exact commands used by this project.
- Add a GitHub Action that runs `npx prisma migrate deploy` during CI to validate migrations.

Presigned uploads
- The backend can return a presigned URL or POST form (from S3, GCS, etc.) so the frontend uploads files directly to cloud storage. There's a stub route at `POST /hr/employee/upload-presigned` which returns an example `url` + `fields`. Replace this with `S3.createPresignedPost(...)` in production.

CI workflow (skeleton)
- A minimal GitHub Actions job is included at `.github/workflows/ci.yml` to demonstrate building the frontend and installing backend deps. It does not deploy — customise it for your pipeline.
