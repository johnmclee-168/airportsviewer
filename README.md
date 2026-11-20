# Airports Viewer

A mobile-responsive web app that lets Qantas customers browse the airports Qantas
operates from. Built for the Qantas Code Challenge (Web).

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- Jest + React Testing Library
- Husky + commitlint + lint-staged for commit hygiene

## Prerequisites

- Node.js >= 20.9 (developed on Node 26)
- npm >= 10
- Google Chrome (the target browser)

## Getting started

```bash
npm install        # installs dependencies and the Husky git hooks
npm run dev        # http://localhost:3000
```

## Data source and local mock

The browser never calls the Qantas API directly (it sends no CORS headers). Instead the
app calls its own route handler, `GET /api/airports`, which fetches the upstream data on
the server, normalises it and returns `{ airports: Airport[] }`.

| Env var                  | Values           | Effect                                                         |
| ------------------------ | ---------------- | -------------------------------------------------------------- |
| `AIRPORTS_SOURCE`        | `live` (default) | Fetch https://api.qantas.com/flight/refData/airport (cached 1h) |
|                          | `mock`           | Serve the local snapshot in `mocks/airports.json`              |
| `AIRPORTS_MOCK_DELAY_MS` | number           | Add artificial latency (useful to see the loader)              |
| `AIRPORTS_SIMULATE_FAILURE` | `1`          | Every request fails with 503 (to see the error UI)             |

```bash
npm run dev:mock                                # dev server backed by the snapshot
AIRPORTS_MOCK_DELAY_MS=3000 npm run dev:mock    # ...with a slow API
npm run dev:fail                                # dev server whose API always fails
npm run mock:refresh                            # re-snapshot the real endpoint
```

## Error handling

Failures are converted into a typed `AirportsError` (`src/lib/airports/client.ts`) with a
`kind` so the UI can explain what happened in plain language:

| Kind      | When                                              | Shown as                     |
| --------- | ------------------------------------------------- | ---------------------------- |
| `offline` | `navigator.onLine` is false                       | "You're offline"             |
| `timeout` | No response within 20s                            | "This is taking too long"    |
| `network` | `fetch` rejected (DNS, connection reset...)       | "Can't reach the server"     |
| `server`  | Non-2xx from `/api/airports` (e.g. upstream down) | "Airports are unavailable"   |
| `invalid` | Response body isn't the expected shape            | "Something went wrong"       |

Every error state has a **Try again** button, technical details are tucked away in a
disclosure, and a failed load is retried automatically when the browser fires `online`.
Unexpected render errors are caught by `app/error.tsx`, and unknown URLs by `app/not-found.tsx`.

## Scripts

| Script                  | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Start the dev server on http://localhost:3000 |
| `npm run build`         | Production build (type-checks as well)        |
| `npm start`             | Serve the production build                    |
| `npm test`              | Run the unit tests                            |
| `npm run test:coverage` | Unit tests with a coverage report             |
| `npm run lint`          | ESLint                                        |
| `npm run typecheck`     | TypeScript without emitting                   |
| `npm run dev:mock`      | Dev server using the local mock API           |
| `npm run dev:fail`      | Dev server whose API always fails             |
| `npm run mock:refresh`  | Re-download the real API into the mock        |

## Commit conventions

Commits are checked by a Husky `commit-msg` hook (commitlint). Messages must start with
one of these types:

```
feature(scope): add something new
fix(scope): fix a bug
hotfix(scope): urgent production fix
chore(scope): tooling, docs, housekeeping
```

The `pre-commit` hook lints the staged files and runs the unit tests.
