# Marino Stats Web

A beautiful and functional web dashboard for tracking facility counts over time. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Features

- 🎨 **5 Unique Design Themes**: Toggle between Brutalist Tech, Neon Cyberpunk, Minimal Nordic, Retro Terminal, and Corporate Modern themes
- 📊 **Interactive Line Charts**: Visualize facility counts over time with clean, precise line charts
- 📅 **Date-Based Filtering**: Filter data by specific dates (last 7 days) populated from your database
- 📈 **Real-time Stats**: Shows current count for each location with dedicated zone rows
- 🎯 **One Zone Per Row**: Each location gets its own dedicated row with time-series visualization
- 🏢 **Multi-Facility Support**: Displays all zones with facility badges
- 📱 **Responsive**: Fully responsive layout that works on all devices
- ⚡ **Dynamic Theming**: Live theme switching with smooth transitions

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with OKLCH colors
- **Components**: shadcn/ui (Base UI primitives)
- **Charts**: Recharts
- **Database**: Turso (libSQL)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Turso database account ([turso.tech](https://turso.tech))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd marino-stats-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:
```env
TURSO_DB_URL=your_turso_db_url_here
TURSO_AUTH_TOKEN=your_turso_auth_token_here
```

4. Make sure your Turso database has the required schema:

```sql
CREATE TABLE IF NOT EXISTS locations (
  location_id INTEGER PRIMARY KEY,
  location_name TEXT NOT NULL,
  facility_name TEXT
);

CREATE TABLE IF NOT EXISTS location_counts (
  location_id INTEGER NOT NULL,
  last_count INTEGER NOT NULL,
  last_updated_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (location_id, fetched_at)
);
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Design Themes

The dashboard includes 5 distinctly different design themes:

1. **Brutalist Tech**: Dark, high-contrast with neon cyan and amber accents. Athletic performance aesthetic.
2. **Neon Cyberpunk**: Vibrant magenta and blue on deep black. Futuristic with glowing effects.
3. **Minimal Nordic**: Clean, spacious design with soft blues on light backgrounds. Refined typography.
4. **Retro Terminal**: Green CRT terminal aesthetic with scanline effects and monospace fonts.
5. **Corporate Modern**: Professional blue tones on white. Clean, business-focused design.

Toggle between themes using the "Design Theme" dropdown in the header.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── facilities/      # API route for fetching facility data
│   ├── layout.tsx            # Root layout with fonts
│   ├── page.tsx              # Main dashboard page
│   └── globals.css           # Global styles and theme
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── ...
├── lib/
│   ├── db.ts                 # Turso database client
│   ├── themes.ts             # Theme configurations
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

## API Endpoints

### GET /api/facilities

Fetches all locations with their count history.

**Query Parameters:**
- `date` (optional): Filter by specific date (ISO string) or `all` for all dates

**Response:**
```json
[
  {
    "location_id": 1,
    "location_name": "Location Name",
    "facility_name": "Facility Name",
    "counts": [
      {
        "location_id": 1,
        "last_count": 42,
        "last_updated_at": "2024-01-01T12:00:00Z",
        "fetched_at": "2024-01-01T12:05:00Z"
      }
    ]
  }
]
```

## Customization

### Adding New Design Themes

To add a new theme, edit `lib/themes.ts`:

```typescript
export const themes: Theme[] = [
  // ... existing themes
  {
    id: "your-theme",
    name: "Your Theme Name",
    styles: {
      background: "oklch(...)",
      text: "oklch(...)",
      accent: "oklch(...)",
      // ... other colors
    },
    fonts: {
      heading: "var(--font-display)",
      body: "var(--font-body)",
      mono: "var(--font-mono)",
    },
    className: "theme-your-theme",
  },
];
```

Then add theme-specific styling in `app/globals.css` under `.theme-your-theme`.

### Adding New Charts

The dashboard uses Recharts with Line charts. To modify chart appearance, edit the chart configuration in `app/page.tsx`.

### Styling

The project uses Tailwind CSS 4 with dynamic theming. Each theme defines its own color palette using OKLCH colors for perceptually uniform color spaces.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Turso Documentation](https://docs.turso.tech)
- [Recharts Documentation](https://recharts.org)
