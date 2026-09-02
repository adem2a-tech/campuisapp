# CAMPUS

CAMPUS est un espace SaaS pour les praticiens du mouvement afin de gérer leurs clients, rendez-vous, séances documentées, cartographie corporelle et programmes de suivi.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/campus run dev` — run the CAMPUS web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Clerk secrets are provisioned by the Replit Auth pane (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`).

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/campus/src/App.tsx` — routed practitioner web experience and Clerk auth screens
- `artifacts/campus/src/index.css` — CAMPUS visual tokens and responsive styling
- `artifacts/api-server/src/routes/campus.ts` — API handlers and demo data seeding
- `lib/db/src/schema/campus.ts` — PostgreSQL/Drizzle schema for the CAMPUS domain
- `lib/api-spec/openapi.yaml` — API source of truth; regenerate hooks after contract edits

## Architecture decisions

- The first anatomical map is structured around body zones and practitioner notes so richer 3D layers can be added without changing the session model.
- Development serves a populated demo tenant so the product can be explored before a practitioner creates an account; production API routes require a Clerk session.
- Browser API calls use Clerk's cookie session transport; explicit bearer-token handling is reserved for future native clients.

## Product

CAMPUS includes a public product introduction, Clerk sign-in/sign-up, practitioner dashboard, agenda, client dossiers, session documentation, interactive body-zone capture, anatomy library, exercise library, programs, notifications, invoices, subscription view, client portal and an admin overview. It deliberately documents practitioner decisions and never diagnoses or prescribes automatically.

## User preferences

The interface should remain premium, calm, minimal and professional: mineral teal, warm bone, apricot accents, and restrained anatomical references rather than a hospital aesthetic.

## Gotchas

- The campus Vite build requires `PORT` and `BASE_PATH`; use `PORT=19802 BASE_PATH=/ pnpm --filter @workspace/campus run build` for a local production build.
- The API seed is intentionally created lazily on the first read and is safe to skip in production environments with existing data.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
