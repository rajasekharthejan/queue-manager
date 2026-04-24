# Queue Manager

A project tracker for **renewable energy interconnection queues**. Manages a portfolio of solar, wind, battery-storage, and hybrid projects across US ISOs/RTOs, tracking security deposits, sunk costs, study phases, and key interconnection milestones.

## What it does

- **Project portfolio** — CRUD for renewable projects with full interconnection metadata (size/capacity, fuel type, ISO region, utility, POI voltage, queue number, IA status).
- **Financial tracking** — security posted, security at risk, study deposits, sunk costs, next security milestone, LGIA security.
- **Study-phase tracking** — feasibility study, system impact study, facilities study, phase-3 study, commercial-operation milestones — status and completion dates per phase.
- **ISO-specific fields** — PJM cluster position, MISO DPP phase, SPP DISIS cluster, CAISO cluster/phase/zone, SERC queue ID.
- **Requests workflow** — intake and triage of project-related requests with detail and edit views.
- **Operating assets** — tracking of operational resources tied to the project portfolio.
- **Security forecast** — API-driven projections (`/api/projects/security-forecast`) for upcoming security obligations.
- **Analytics** — dashboard view of portfolio status, costs, and milestones.
- **Excel import/export** — bulk data workflows via `xlsx`.

## Tech

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Backend-as-a-service:** Supabase (auth + Postgres, SSR via `@supabase/ssr`)
- **File handling:** `xlsx` for Excel import/export
- **Utilities:** `date-fns`, `uuid`

## Project structure

```
src/
├── app/
│   ├── page.tsx                         # Portfolio dashboard
│   ├── projects/
│   │   ├── new/                         # Create project
│   │   ├── [id]/                        # Project detail
│   │   ├── [id]/edit/                   # Edit project
│   │   └── security/                    # Security overview
│   ├── requests/
│   │   ├── new/  and  [id]/             # Request intake + detail
│   ├── operating-assets/                # Operating asset tracking
│   ├── security-calc/                   # Security calculator
│   ├── analytics/                       # Portfolio analytics
│   ├── api/
│   │   └── projects/
│   │       ├── route.ts                 # Projects list/create
│   │       ├── [id]/route.ts            # Project detail/update
│   │       └── security-forecast/       # Forecast endpoint
│   └── components/ProjectForm.tsx       # Shared form component
└── lib/
    ├── types.ts                         # Project / domain types
    └── supabase/{client,server}.ts      # Supabase SSR helpers
```

## Quick start

```bash
git clone https://github.com/rajasekharthejan/queue-manager
cd queue-manager
npm install

# Configure Supabase — create a .env.local with:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

npm run dev
```

Visit http://localhost:3000.

Database schema lives under `supabase/` (Supabase migrations).

## Status

In active development. Core portfolio tracking, security/cost fields, and ISO-specific metadata are functional. Analytics and forecasting under ongoing work.
