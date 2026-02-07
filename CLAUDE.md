# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 web application for Marino stats, built with React 19, TypeScript, and Tailwind CSS 4. The project uses the App Router architecture and shadcn/ui components based on Base UI primitives.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Architecture

### Framework & Routing
- **Next.js 16** with App Router (`app/` directory)
- Server components by default; client components marked with `"use client"`
- Root layout in `app/layout.tsx` configures fonts (Geist Sans, Geist Mono, Inter)
- Main page is `app/page.tsx`

### Component System
- **UI components**: Located in `components/ui/` using Base UI primitives (`@base-ui/react`)
- **shadcn/ui**: Configured with "base-nova" style variant (see `components.json`)
- Components use `class-variance-authority` (CVA) for variant-based styling
- Icons from `lucide-react`

### Styling
- **Tailwind CSS 4** with custom theme configuration
- CSS variables for theming in `app/globals.css`
- Dark mode support via `.dark` class
- Color system uses OKLCH format
- Custom utility function `cn()` in `lib/utils.ts` combines `clsx` and `tailwind-merge`

### Path Aliases
TypeScript paths configured in `tsconfig.json`:
- `@/*` maps to root directory
- Common aliases: `@/components`, `@/lib/utils`, `@/components/ui`

### Component Patterns
- UI components follow shadcn/ui conventions with compound component patterns
- Components use TypeScript with proper type definitions
- Variants managed through CVA for consistent styling APIs
- Components support `className` prop for style overrides via `cn()` utility

### Key Dependencies
- `@base-ui/react`: Headless UI primitives
- `class-variance-authority`: Variant-based component styling
- `tailwind-merge`: Intelligent Tailwind class merging
- `tw-animate-css`: Animation utilities
- `next/font`: Automatic font optimization

## Configuration Files

- `components.json`: shadcn/ui configuration (style: base-nova, base color: neutral)
- `tsconfig.json`: TypeScript configuration with strict mode enabled
- `eslint.config.mjs`: ESLint with Next.js presets for TypeScript
- `next.config.ts`: Next.js configuration (currently minimal)
- `postcss.config.mjs`: PostCSS configuration for Tailwind CSS 4

## Database Setup

### Turso Database
The application uses Turso (libSQL) for data storage with the following schema:

**locations table**:
- `location_id` (INTEGER PRIMARY KEY)
- `location_name` (TEXT NOT NULL)
- `facility_name` (TEXT)

**location_counts table**:
- `location_id` (INTEGER NOT NULL)
- `last_count` (INTEGER NOT NULL)
- `last_updated_at` (TEXT NOT NULL)
- `fetched_at` (TEXT NOT NULL)
- PRIMARY KEY: (location_id, fetched_at)

### Environment Variables
Create a `.env.local` file with:
```
TURSO_DB_URL=your_turso_db_url_here
TURSO_AUTH_TOKEN=your_turso_auth_token_here
```

### Database Access
- Database client configured in `lib/db.ts`
- API routes in `app/api/` handle database queries
- Use the `db` client from `@/lib/db` for database operations

## Application Features

### Dashboard
The main page (`app/page.tsx`) displays:
- Area charts showing facility counts over time grouped by facility
- Real-time filtering by day of week (Monday-Sunday or All Days)
- Current count and average count for each location
- Responsive grid layout (1 column mobile, 2 tablet, 3 desktop)
- Loading and error states

### API Routes
- `GET /api/facilities?dayOfWeek={day}`: Fetches all locations with their count history
  - Optional `dayOfWeek` parameter filters by day (monday, tuesday, etc., or "all")
  - Returns array of locations with their counts

## Adding New UI Components

When adding shadcn/ui components, they should be placed in `components/ui/` and follow the established patterns:
- Use Base UI primitives as the foundation
- Apply variants using CVA
- Export component and variant types
- Use the `cn()` utility for className merging
