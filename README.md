# Airports Viewer

A mobile-responsive web app that lets Qantas customers browse the airports Qantas
operates from. Built for the Qantas Code Challenge (Web).

- **Loading screen:** an animated loader with skeleton rows while airports are first fetched.
- **List screen:** every airport with its name and country, plus search, paged rendering and
  a highlight on the last airport tapped.
- **Details screen:** a full page with currency, timezone (live local time and UTC offset),
  location (coordinates, elevation, map link) and airport type, with a way back to the list.
- **Nice-to-haves:** graceful API failure handling, offline support (data cache + service
  worker), animations and transitions, light/dark themes and reduced-motion support.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Cache Components) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- Jest + React Testing Library (unit/component tests), headless Chrome over CDP (offline e2e)
- Husky + commitlint + lint-staged for commit hygiene

## Prerequisites

- Node.js >= 20.9 (developed on Node 26)
- npm >= 10
- Google Chrome (the target browser; also used by the offline e2e check)

## Getting started

```bash
npm install        # installs dependencies and the Husky git hooks
npm run dev        # http://localhost:3000, using the live Qantas API
```

No API key or `.env` file is needed. To work without the upstream API, use the local
snapshot instead:

```bash
npm run dev:mock
```

### Build and run in production mode

```bash
npm run build
npm start          # http://localhost:3000
```

The service worker (offline app shell) is only registered in production builds.

### Run the tests

```bash
npm test                  # unit + component tests
npm run test:coverage     # ...with a coverage report (~96% lines)
npm run build && npm run test:e2e-offline   # offline end-to-end check in headless Chrome
```

## Scripts

| Script                     | What it does                                      |
| -------------------------- | ------------------------------------------------- |
| `npm run dev`              | Dev server on http://localhost:3000 (live API)    |
| `npm run dev:mock`         | Dev server using the local mock API               |
| `npm run dev:fail`         | Dev server whose API always fails                 |
| `npm run build`            | Production build (also type-checks)               |
| `npm start`                | Serve the production build                        |
| `npm test`                 | Run the unit tests                                |
| `npm run test:coverage`    | Unit tests with a coverage report                 |
| `npm run test:e2e-offline` | Offline end-to-end check (needs a build + Chrome) |
| `npm run lint`             | ESLint                                            |
| `npm run typecheck`        | TypeScript without emitting                       |
| `npm run mock:refresh`     | Re-download the real API into the mock            |

## Project structure

```
src/
  app/
    layout.tsx               Root shell: header, AirportsProvider, banners, SW registration
    page.tsx                 / -> AirportList (master screen)
    airports/[code]/page.tsx /airports/SYD -> AirportDetailScreen (detail screen)
    api/airports/route.ts    Same-origin proxy for the Qantas API
    error.tsx, not-found.tsx Route error boundary and 404
  components/                UI components (each file starts with a summary comment)
  context/AirportsProvider   Client store: fetching, caching, selection, search text
  hooks/                     useNow, useOnlineStatus
  lib/airports/              Types, normaliser, server source, client fetcher, cache,
                             search filter, currency lookup and display formatters
  test/                      Fixtures and render helpers
public/sw.js, offline.html   Service worker and offline fallback page
mocks/airports.json          Snapshot of the real API (npm run mock:refresh)
scripts/                     Mock snapshot and offline e2e scripts
```

## How it works

### Data source and local mock

The browser never calls the Qantas API directly, because it sends no CORS headers. The app
calls its own route handler, `GET /api/airports`, which fetches the upstream data on the
server, normalises it and returns `{ airports: Airport[] }`. On failure it returns
`502 { error }`.

| Env var                     | Values           | Effect                                             |
| --------------------------- | ---------------- | -------------------------------------------------- |
| `AIRPORTS_SOURCE`           | `live` (default) | Fetch the Qantas endpoint (kept in memory for 1h)  |
|                             | `mock`           | Serve the local snapshot in `mocks/airports.json`  |
| `AIRPORTS_MOCK_DELAY_MS`    | number           | Add artificial latency (useful to see the loader)  |
| `AIRPORTS_SIMULATE_FAILURE` | `1`              | Every request fails with 503 (to see the error UI) |

```bash
AIRPORTS_MOCK_DELAY_MS=5000 npm run dev:mock    # slow API: see the loading animation
npm run dev:fail                                # failing API: see the error UI
```

The normaliser (`src/lib/airports/normalize.ts`) handles quirks found in the real data:

- `latitude`/`longitude` are unsigned degrees.minutes values (Sydney is `33.56` for 33°56′ S),
  so signed decimal degrees are derived from the `latitudeRadius`/`longitudeRadius` (radians)
  fields.
- 0/0 coordinates with no hemisphere mean "unknown location"; `-99999` elevation means
  "unknown".
- Some airports have no city name or state.

### Screens and navigation

`AirportsProvider` lives in the root layout, so the list is fetched once and shared by both
pages. Tapping a row is a real link to `/airports/{code}`, so deep links, new tabs and
refreshes work. The tapped row is remembered and highlighted. **Back** uses browser history
when you came from the list, which keeps the search text and scroll position. From a deep
link it goes to `/`.

There are ~7,200 airports, so the list renders 50 rows at a time. More are added as you
scroll (IntersectionObserver), with a **Show more** button as a fallback. Search matches
code, name, city and country, ignoring case and accents.

### Error handling

Failures become a typed `AirportsError` (`src/lib/airports/client.ts`) whose `kind` lets the
UI explain what happened in plain language:

| Kind      | When                                              | Shown as                   |
| --------- | ------------------------------------------------- | -------------------------- |
| `offline` | `navigator.onLine` is false                       | "You're offline"           |
| `timeout` | No response within 20s                            | "This is taking too long"  |
| `network` | `fetch` rejected (DNS, connection reset...)       | "Can't reach the server"   |
| `server`  | Non-2xx from `/api/airports` (e.g. upstream down) | "Airports are unavailable" |
| `invalid` | Response body isn't the expected shape            | "Something went wrong"     |

Every error state has a **Try again** button, and technical details sit behind a disclosure.
A failed load is retried automatically when the browser fires `online`. `app/error.tsx`
catches unexpected render errors, and `app/not-found.tsx` handles unknown URLs.

### Offline support and caching

Two layers keep the app usable without a network connection:

1. **Airport data cache** (`src/lib/airports/cache.ts`). Each successful response is saved
   with its timestamp in the browser's Cache Storage. The ~2.6 MB payload is too large for
   localStorage. On start-up the cached list appears instantly while a fresh copy loads
   (stale-while-revalidate), with a thin progress bar under the header. If the refresh fails,
   the cached airports stay on screen and a banner says how old they are, for example
   "You're offline. Showing airports saved 5 minutes ago." The banner has a Retry button when
   online. The full error screen appears only when nothing is cached.
2. **Service worker** (`public/sw.js`, production only). It caches the app shell so the app
   reopens offline. Pages and RSC payloads are network-first with a cache fallback, and
   hashed build assets are cache-first. Pages never visited fall back to `/offline.html`.
   `/api/*` is left to the data cache above, so the UI knows how old the data is.

To try it, run `npm run build && AIRPORTS_SOURCE=mock npm start` and open
http://localhost:3000. Then in Chrome DevTools > Network, choose **Offline** and reload,
search, and open airports. `npm run test:e2e-offline` automates this flow and checks:

- reloading the list offline,
- tapping into an airport you haven't opened before,
- reloading an airport you have visited,
- the offline fallback page.

### Animations

- **Loading screen:** a plane orbits a pulsing globe above shimmering skeleton rows. If the
  load passes 3s and then 10s, the message changes to reassure the user.
- **Background refresh:** an indeterminate progress bar sits under the header.
- **Transitions:** list rows cascade in, the detail page slides in from the right and its
  cards stagger in. Selection highlights and error/offline banners fade in.
- **Reduced motion:** everything respects `prefers-reduced-motion`.

## Assumptions and decisions

- **"Airports Qantas operates from".** The endpoint returns ~7,200 airports, and no field
  clearly means "Qantas operates here", so the app lists everything the API returns, as the
  brief describes. Search keeps the long list usable.
- **Currency isn't in the API.** It comes from the ISO country code via a country → ISO 4217
  table (`src/lib/airports/currency.ts`, current to 2026, e.g. Bulgaria and Croatia use EUR).
  `Intl` provides the currency name and symbol. A unit test checks that every country in the
  snapshot has a currency (Antarctica has none).
- **Timezone** shows the IANA zone, the current local time (refreshed every 30s) and the UTC
  offset. `Intl` handles daylight saving.
- **Proxy route rather than calling the API from the browser**, which is required by CORS.
  It also lets the server trim and normalise the payload and cache it for an hour.
- **Client-side data store rather than server-rendered pages.** The whole dataset is needed
  for search and is reused by every page, so it is fetched once. This also makes offline
  support straightforward.
- **The mock snapshot is committed** (~3.9 MB, marked `linguist-generated`). The app can run
  and be tested without the upstream API, and the data-quality tests use real records.

## Trade-offs and what I'd do with more time

- **Virtualise the list** (e.g. TanStack Virtual) instead of paging, for smoother scrolling
  through all 7,200 rows on low-end phones.
- **Trim the payload further** (shorter keys, or a list endpoint plus a detail endpoint).
  Gzipped it is small, but parsing 2.6 MB of JSON on a slow phone still costs time.
- **Playwright e2e suite** covering the main flows across viewports, plus visual regression
  tests. The current e2e script covers offline only.
- **Add a map** to the detail page (e.g. MapLibre with cached tiles) instead of a link out
  to Google Maps.
- **Group or filter by country/region** and add a "Qantas network" filter, if the API owner
  confirms which flag (`onlineIndicator`?) means Qantas operates there.
- **Monitoring:** error reporting (e.g. Sentry) behind the existing `console.error` hooks.

## Commit conventions

A Husky `commit-msg` hook (commitlint) checks every commit. Messages must start with one of
these types:

```
feature(scope): add something new
fix(scope): fix a bug
hotfix(scope): urgent production fix
chore(scope): tooling, docs, housekeeping
```

The `pre-commit` hook lints the staged files and runs the unit tests. Work was done in
stage branches, each branched from the previous one: `feature/setup` → `feature/test-env` →
`feature/list` → `feature/detail` → `feature/api-failure` → `feature/caching` →
`feature/animation`.

## AI tools used

This project was built with **Claude Code** (Anthropic) as a pair programmer:

- **Scaffolding:** generated the Next.js/Tailwind/Jest/Husky setup and read the bundled
  Next.js 16 docs to pick up API changes, e.g. `error.tsx` now receives `retry()`, and
  `useParams()` needs a Suspense boundary under Cache Components.
- **Data analysis:** inspected the real API payload to find the quirks listed above
  (coordinate format, sentinels, missing fields, no CORS headers, no currency field).
- **Implementation and tests:** wrote the components, data layer and unit tests stage by
  stage, running build, lint and tests before each commit.
- **Debugging and verification:** drove the app in a browser to check mobile and desktop
  layouts. It also wrote the headless-Chrome script that showed the offline flow works,
  including tapping into an airport that was never visited.

Every change was reviewed and committed incrementally; the commit history shows each step.
