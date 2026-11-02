## Role & Scope:

You are an AI development assistant for HireFlow — a full-stack recruitment/hiring platform built as a monorepo. This file defines your behavior across the entire codebase. Layer-specific rules are in ui/GEMINI.md and api/GEMINI.md. When working in a specific layer, load the relevant sub-config alongside this one.

## Architecture Overview:

```bash
hireflow/
├── api/          # NestJS backend (REST API)
│   ├── src/
│   │   ├── auth/
│   │   ├── user/
│   │   └── database/migrations/
│   └── ...
├── ui/           # React frontend (Vite)
│   ├── src/
│   │   ├── features/
│   │   ├── pages/
│   │   └── services/
│   └── ...
├── docker/       # Docker Compose for local dev
└── ...
```

## Stack:

- Frontend: React (JSX), Vite, ESLint
- Backend: NestJS, TypeORM, PostgreSQL
- Auth: JWT-based (access + refresh tokens)
- Infra: Docker Compose for local development
- Language: TypeScript (API), JavaScript/JSX (UI)
- @nestjs/swaggerAPI Documentation (Swagger UI)

## Monorepo Conventions:

- api/ and ui/ are independent packages — do not share node_modules or configs
- Environment variables live in .env files at the layer root (see .env.example)
- Docker Compose (docker/docker-compose.yml) orchestrates all services locally
- Never hardcode secrets, ports, or hostnames — always use env vars

## Git Workflow:

- Branch naming: feature/<ticket-id>-short-description, fix/<ticket-id>-description, chore/description
- Commit style: Conventional Commits — feat:, fix:, chore:, refactor:, docs:, test:
- PRs: One concern per PR; include a short description of what changed and why
- Do not commit .env files, dist/, node_modules/, or migration snapshots

## Shared Terminology:

- TermMeaningUserAny authenticated account in the systemCandidateA user applying for a jobRecruiterA user posting jobs and reviewing applicationsJobA job listing created by a RecruiterApplicationA Candidate's submission for a Job
- Use these terms consistently in variable names, DTOs, entities, and UI labels.

## General Rules for the Agent:

- Always:
    Follow the existing code style in whichever file you're editing
    Use TypeScript types/interfaces — avoid any unless there's a documented reason
    Keep functions small and focused (single responsibility)
    Write self-documenting code; add comments only for non-obvious logic
    Respect existing folder structure — don't create new top-level directories without discussion
    Always include Swagger decorators in the API layer to maintain live documentation at /api/docs

- Never:
  Do not mix UI and API code — they are separate concerns in separate packages
  Do not add new dependencies without checking if something already in the project covers the need
  Do not generate code that bypasses authentication or authorization guards
  Do not delete migration files
  Do not modify .env.example unless adding a legitimately new required variable

## Code Style:

- Indentation: 2 spaces
- Quotes: Single quotes (') everywhere
- Semicolons: Yes (enforced by ESLint/Prettier)
- Line endings: LF (enforced via .prettierrc)
- Max line length: 100 characters
- Trailing commas: ES5 style

- Prettier and ESLint configs are authoritative — do not override them inline unless absolutely necessary.

## Testing Philosophy:

- Unit tests live next to the file they test (\*.spec.ts)
- Integration/e2e tests live in api/test/
- Tests must pass before merging — do not disable or skip tests without a comment explaining why
- Mock external dependencies (DB, external APIs) in unit tests

## Security Baseline:

- All routes must be protected unless explicitly marked public with @Public() decorator
- Passwords must never appear in logs, responses, or error messages
- User input must be validated via DTOs with class-validator (API) or Zod/form validation (UI)
- SQL queries go through TypeORM — raw queries require a comment justifying the exception
