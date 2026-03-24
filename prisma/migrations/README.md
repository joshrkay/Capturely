# Prisma migrations in this repository

This project currently relies on generating a full baseline migration from `prisma/schema.prisma`
in an environment with a running Postgres instance.

Why: committing only a partial migration (for a single model) without a prior baseline causes
`prisma migrate dev` shadow-database failures (for example, foreign keys referencing tables that
were never created by earlier migrations).

## Local workflow

1. Start Postgres (for example, `docker compose up -d` if Docker is available).
2. Set `DATABASE_URL` (or rely on the default fallback in `prisma.config.ts`).
3. Run:

```bash
npx prisma migrate dev --name <migration-name>
```

This ensures Prisma creates a migration history that is internally consistent.
