# Ledgerly — Full-Stack Expense Tracker

Ledgerly is a full-stack web app for recording daily expenses, sorting them into categories, setting a monthly budget for each category and seeing where the money goes each month.

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Frontend | React 19 + TypeScript, bundled with Vite                      |
| Backend  | REST API on Netlify Functions (serverless, TypeScript)        |
| Database | Netlify Database (managed PostgreSQL) through Drizzle ORM     |
| Hosting  | Netlify (CDN for the static frontend, functions for the API)  |

## Features

- Add, edit, delete and search expenses (title, amount, category, date, note)
- Categories with colours and monthly budgets (8 are created for you)
- Monthly dashboard: total spent, remaining budget, number of entries
- Budget bars for each category and a day-by-day spending chart
- Move between months, filter by category, search titles and notes
- Validation on both the client and the server, with field-level error messages

## Quick start

```bash
npm install
netlify dev          # opens http://localhost:8889 (frontend + API + local database)
```

See [docs/DATABASE.md](docs/DATABASE.md) for setting up the database and running migrations.

## Documentation

| Document | Contents |
| -------- | -------- |
| [docs/LAB_REPORT.md](docs/LAB_REPORT.md) | Lab report to submit: aim, tech stack, architecture, procedure, testing, result, conclusion |
| [docs/API.md](docs/API.md) | REST API reference with request and response examples for every endpoint |
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema, ER diagram, migrations and local setup guide |

## Project structure

```
.
├── index.html                    # HTML entry point
├── src/                          # Frontend (React)
│   ├── main.tsx                  # React bootstrap
│   ├── App.tsx                   # Page layout and state
│   ├── api.ts                    # Typed fetch client for the REST API
│   ├── format.ts                 # Currency/date helpers
│   ├── styles.css                # Styles
│   └── components/               # ExpenseForm, ExpenseList, CategoryManager, Summary
├── netlify/
│   ├── functions/                # Backend: one serverless function per resource
│   │   ├── expenses.ts           #   /api/expenses, /api/expenses/:id
│   │   ├── categories.ts         #   /api/categories, /api/categories/:id
│   │   └── summary.ts            #   /api/summary
│   ├── lib/                      # Shared HTTP + validation helpers
│   └── database/migrations/      # SQL migrations (applied automatically on deploy)
├── db/
│   ├── schema.ts                 # Drizzle table definitions (the source of truth)
│   └── index.ts                  # Database client
├── drizzle.config.ts             # Drizzle Kit configuration
├── netlify.toml                  # Build and dev configuration
└── docs/                         # Lab documentation
```

## Scripts

| Command | What it does |
| ------- | ------------ |
| `netlify dev` | Runs the whole app locally (Vite + functions + database) on port 8889 |
| `npm run build` | Builds the frontend into `dist/` |
| `npm run typecheck` | Type-checks the whole project with TypeScript |
| `npx drizzle-kit generate --name <name>` | Creates a new migration after you change `db/schema.ts` |
