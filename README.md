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
