# VoteCast — College Election Platform

## Overview

VoteCast is a production-grade college election platform for conducting fair, transparent, and live elections across multiple posts (positions) like President, Vice President, Cultural Secretary, etc.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + framer-motion

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── votecast/           # React frontend (port 18912)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

Located in `lib/db/src/schema/elections.ts`:

- **elections** — election records (name, college, status, admin passcode, voting times)
- **posts** — positions within an election (President, VP, Secretary, etc.)
- **candidates** — candidates per post (name, roll number, department, year, manifesto)
- **voters** — registered voters per election (voter ID, name, email, has_voted flag)
- **votes** — individual votes (election, post, candidate, voter ID)
- **audit_logs** — all actions for transparency

## Election Status Flow

`draft` → `nomination` → `voting` → `results` → `closed`

## Frontend Pages

- `/` — Home / landing page with elections list
- `/admin` — Admin portal (create/manage elections)
- `/admin/:id` — Election dashboard (manage posts, candidates, voters, status)
- `/vote/:id` — Voter portal (enter voter ID, cast votes)
- `/results/:id` — Live results dashboard (auto-refreshes every 5s)
- `/election/:id` — Public election detail page

## Key Features

- Multi-post elections (unlimited positions per election)
- One-vote-per-voter enforcement
- Live results with percentage bars and winner declaration
- Bulk voter registration via CSV-formatted data
- Audit log for every action
- Admin passcode authentication (stored in localStorage)
- Bold dark Nike-inspired theme

## API Routes

All routes under `/api`:

- `GET/POST /elections` — list/create elections
- `GET/PUT/DELETE /elections/:id` — get/update/delete election
- `PUT /elections/:id/status` — change election status (requires admin passcode)
- `GET/POST /elections/:id/posts` — list/create posts
- `DELETE /posts/:id` — delete post
- `GET/POST /posts/:id/candidates` — list/add candidates
- `DELETE /candidates/:id` — delete candidate
- `POST /elections/:id/vote` — cast votes (enforces one-vote-per-voter)
- `GET /elections/:id/results` — live results
- `GET/POST /elections/:id/voters` — list/register voters
- `POST /elections/:id/voters/bulk` — bulk register voters
- `POST /elections/:id/check-voter` — check voter eligibility
- `GET /elections/:id/audit` — audit log

## Running

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/votecast run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
