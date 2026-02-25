# Car Guide

A lightweight React app that helps users find cars that fit their budget, driving habits, and priorities in under a minute.

## What this app does

- Guides users through a 4-step quiz (budget, vehicle/fuel preferences, driving mix, and priority).
- Filters a 2025 vehicle dataset by user constraints.
- Ranks matching vehicles using weighted scoring for price, fuel economy, comfort, and sportiness.
- Shows top recommendations with reasons and a match score.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui components
- React Router for multi-page flow
- TanStack Query (provider wired in app)
- Supabase client + import script support

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
npm install
npm run dev
```

The app will start on Vite's default local URL (usually `http://localhost:5173`).

## Available scripts

```bash
npm run dev         # Start development server
npm run build       # Production build
npm run build:dev   # Development-mode build
npm run preview     # Preview built app
npm run lint        # Run ESLint
npm run import-cars # Run FuelEconomy import script
```

## Project structure

```text
src/
  pages/            # Route pages (home, quiz, results)
  components/       # UI and domain components
  lib/quizEngine.ts # CSV parsing, filtering, ranking logic
  integrations/     # Supabase client/types
public/data/        # Static car dataset used by the quiz
scripts/            # One-off data import scripts
```

## Data and ranking notes

- Quiz data is loaded from `public/data/cars_2025_enriched_complete.csv`.
- Ranking is based on weighted scoring. Weights change depending on selected priority:
  - Balanced
  - Lowest price
  - Best fuel economy
  - Most comfortable
  - Sportiest

## Environment variables

### Frontend (optional, if using Supabase from the app)

Set in a local `.env` file:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-anon-key"
```

### Import script (`scripts/import_fueleconomy_2025.ts`)

Use one of the following setups:

1. **Service role key flow**

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run import-cars
```

2. **Edge Function flow (no direct service role key in local shell)**

```bash
npx supabase@latest functions deploy import-cars

export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
npm run import-cars
```

Make sure the `import-cars` Edge Function has `SUPABASE_SERVICE_ROLE_KEY` configured in Supabase project secrets.

## Verifying imported data

```sql
select count(*) from cars where year = 2025;
```

## Notes

- This repository appears to have been bootstrapped from Lovable, but the README is now tailored for local development and repository maintenance.
