# VoteCast — College Election Platform

A full-stack, dark-themed college election platform built for simplicity and transparency. Designed for student councils and campus organizations to run secure, live elections with real-time results and a complete audit trail — no technical expertise required.

---

## Live Demo

| Service  | URL                                         |
|----------|---------------------------------------------|
| Frontend | https://e-voting-votecast.vercel.app        |
| Backend  | https://e-voting-dpj3.onrender.com          |

---

## Features

### For Election Organizers
- **Organizer Onboarding** — First-time setup creates a named profile secured by a password stored locally. Returning organizers log in with their password.
- **Election Wizard** — Step-by-step dashboard to configure an election:
  - *Details* — Name, description, college name, admin passcode, voting window dates
  - *Posts* — Define positions (e.g. President, Secretary) to be contested
  - *Candidates* — Add candidates with names and optional photos for each post
  - *Voters* — Bulk-add voters by roll number; toggle **Open Enrollment** to let students self-register
  - *Launch* — Review everything and publish the election
- **Delete Election** — Danger zone with name-confirmation typing before permanent deletion
- **Live Dashboard** — Monitor voter turnout and vote counts in real time

### For Voters
- **Find Election** — Browse active elections by name or college
- **Secure Voting** — Enter roll number to authenticate, then cast one vote per post
- **Tamper-Proof** — Each voter can vote exactly once; votes are immutable after submission

### Results
- **Live Results** — Animated, real-time vote tallies visible during and after voting
- **Winner Banner** — Gold highlight on the winning candidate per post after the election closes
- **Share Button** — One-click share link for results page

### Audit Trail
- Every significant action (election created, voter registered, vote cast, status changed) is recorded with a timestamp in a per-election audit log

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 19, TypeScript, TailwindCSS, Vite         |
| Backend      | Node.js, Express, TypeScript                    |
| Database     | PostgreSQL (Render managed)                     |
| ORM          | Drizzle ORM                                     |
| API Layer    | Zod validation, auto-generated API client       |
| Monorepo     | pnpm workspaces                                 |
| Deployment   | Vercel (frontend), Render (backend + database)  |

---

## Project Structure

```
/
├── artifacts/
│   ├── votecast/          # React frontend (Vite)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── home.tsx          # Election browser
│   │       │   ├── admin/            # Organizer login + dashboard wizard
│   │       │   ├── vote/             # Voter authentication + ballot
│   │       │   ├── election/         # Election detail view
│   │       │   └── results/          # Live + final results
│   │       └── components/
│   └── api-server/        # Express REST API
│       └── src/
│           ├── app.ts                # Express app + CORS
│           ├── index.ts              # Server entry point
│           └── routes/
│               ├── elections.ts      # All election CRUD + voting logic
│               └── health.ts         # Health check
├── lib/
│   ├── db/                # Drizzle schema + migrations
│   ├── api-spec/          # OpenAPI spec
│   ├── api-zod/           # Zod request/response validators
│   └── api-client-react/  # Auto-generated React query client
├── render.yaml            # Render deployment config
└── artifacts/votecast/vercel.json  # Vercel deployment config
```

---

## Database Schema

| Table         | Purpose                                        |
|---------------|------------------------------------------------|
| `elections`   | Election metadata, status, passcode, schedule  |
| `posts`       | Positions within an election                   |
| `candidates`  | Candidates per post with optional photo URL    |
| `voters`      | Registered voters (roll number, voted status)  |
| `votes`       | Cast votes linking voter → candidate           |
| `audit_logs`  | Immutable event log per election               |

---

## Local Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database

### Setup

```bash
# Clone the repository
git clone https://github.com/asahjada786-blip/e-voting_project.git
cd e-voting_project

# Install all dependencies
pnpm install

# Set your database connection string
export DATABASE_URL="postgresql://user:password@localhost:5432/votecast"

# Push the database schema
pnpm --filter @workspace/db run push

# Start the backend API server
pnpm --filter @workspace/api-server run dev

# In a separate terminal, start the frontend
pnpm --filter @workspace/votecast run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3000`.

### Environment Variables

| Variable       | Where             | Description                                      |
|----------------|-------------------|--------------------------------------------------|
| `DATABASE_URL` | Backend (Render)  | PostgreSQL connection string                     |
| `PORT`         | Backend           | Port to listen on (auto-set by Render)           |
| `VITE_API_URL` | Frontend (Vercel) | Full URL of the deployed backend API             |

---

## Deployment

### Backend — Render

The `render.yaml` in the project root defines the service. To deploy:

1. Connect your GitHub repo to Render
2. Render detects `render.yaml` and auto-configures the service
3. Add `DATABASE_URL` as an environment variable in the Render dashboard (use the **internal** database URL from your Render PostgreSQL instance)
4. Every push to `main` triggers an automatic redeploy

**Build command:**
```
npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/db run push && pnpm --filter @workspace/api-server run build
```

**Start command:**
```
node artifacts/api-server/dist/index.cjs
```

### Frontend — Vercel

1. Import the repo in Vercel
2. Set **Root Directory** to `artifacts/votecast`
3. Add environment variable: `VITE_API_URL=https://your-render-service.onrender.com`
4. Deploy — Vercel uses `vercel.json` which already handles SPA routing rewrites

---

## API Overview

All routes are prefixed with `/api`.

| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | `/elections`                      | List all elections                 |
| POST   | `/elections`                      | Create a new election              |
| GET    | `/elections/:id`                  | Get election details               |
| PUT    | `/elections/:id`                  | Update election                    |
| DELETE | `/elections/:id`                  | Delete election                    |
| GET    | `/elections/:id/posts`            | List posts for an election         |
| POST   | `/elections/:id/posts`            | Add a post                         |
| POST   | `/elections/:id/candidates`       | Add a candidate to a post          |
| GET    | `/elections/:id/voters`           | List registered voters             |
| POST   | `/elections/:id/voters`           | Register a voter                   |
| POST   | `/elections/:id/vote`             | Cast a vote                        |
| GET    | `/elections/:id/results`          | Get vote tallies                   |
| GET    | `/elections/:id/audit`            | Get audit log                      |
| PUT    | `/elections/:id/status`           | Change election status             |
| GET    | `/health`                         | Health check                       |

---

## User Flows

### Organizer Flow

```
First visit  →  Setup Screen (set name + password)
                        ↓
Returning    →  Login Screen (enter password)
                        ↓
             Admin Landing  →  Create Election
                        ↓
       Wizard: Details → Posts → Candidates → Voters → Launch
                        ↓
         Election live  →  Monitor dashboard
                        ↓
       Close election   →  Final results + winner banners
```

### Voter Flow

```
Home  →  Find election by name or college
              ↓
      Enter roll number
      (auto-registered if Open Enrollment is on)
              ↓
      Ballot — select one candidate per post
              ↓
      Confirm & submit — vote is final
              ↓
      Redirected to live results
```

---

## Security Notes

- Admin passcode is set per election and required to modify or delete it
- Organizer profile password is stored in `localStorage` — suitable for single-device admin use
- Each voter (roll number) can cast exactly one vote per election; duplicates are rejected
- Audit logs are append-only and cover all state-changing actions
- CORS is open by default; you can restrict it on Render by setting `ALLOWED_ORIGINS` to a comma-separated list of allowed origins

---

## License

MIT
