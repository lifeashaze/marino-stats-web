# Marino Stats Web

> A clean, functional web dashboard for visualizing Northeastern University recreation facility capacity over time.

Built to track and display historical occupancy trends across multiple recreation facilities. Displays real-time occupancy data with interactive area charts, date filtering, and responsive design.

**Live Data Source**: [Northeastern Recreation Live Facility Counts](https://recreation.northeastern.edu/live-facility-counts/)

---

**Use Cases:**
- 📊 Analyze peak usage times for gym facilities
- 📈 Track occupancy trends over days/weeks
- 🏋️ Plan your gym visits based on historical data
- 🔧 Adapt this for your own facility tracking needs

## Features

- 📊 **Interactive Area Charts**: Visualize facility occupancy over time with gradient-filled area charts
- 📅 **Date-Based Filtering**: View data for any of the last 7 days with a date selector
- 📈 **Real-Time Stats**: Shows the most recent occupancy count for each location
- 🏢 **Multi-Facility Support**: Organized by facility with all zones displayed per facility
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- ⚡ **Optimized Loading**: Fetches all data once and filters client-side for instant responses

## How It Works

This is a **visualization dashboard** that displays historical occupancy data. The workflow is:

1. **Data Collection** (separate process, not included): A separate script/service periodically scrapes the [Northeastern Recreation Live Facility Counts](https://recreation.northeastern.edu/live-facility-counts/) page and stores the data in a Turso database
2. **Data Storage**: Historical counts are stored in Turso with timestamps
3. **Data Visualization** (this app): The dashboard queries the database and displays interactive charts

**Note**: This repository contains only the visualization dashboard. You'll need to set up your own data collection pipeline to populate the database.

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

> ⚠️ **Important**: This is a visualization-only dashboard. You need to set up a separate data collection pipeline to populate the Turso database with facility count data.

### Prerequisites

- **Node.js 20+** installed
- **Turso database** account ([turso.tech](https://turso.tech)) with historical data populated
- **Data collection pipeline** (separate from this repo) to populate the database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/marino-stats-web.git
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

4. Set up your Turso database with the required schema:

```sql
-- Table for storing facility locations/zones
CREATE TABLE IF NOT EXISTS locations (
  location_id INTEGER PRIMARY KEY,
  location_name TEXT NOT NULL,        -- e.g., "Marino Center - Cardio Area"
  facility_name TEXT                  -- e.g., "Marino Center"
);

-- Table for storing historical occupancy counts
CREATE TABLE IF NOT EXISTS location_counts (
  location_id INTEGER NOT NULL,
  last_count INTEGER NOT NULL,        -- Occupancy count at this time
  last_updated_at TEXT NOT NULL,      -- When the count was recorded
  fetched_at TEXT NOT NULL,           -- When the data was scraped
  PRIMARY KEY (location_id, fetched_at),
  FOREIGN KEY (location_id) REFERENCES locations(location_id)
);
```

> **Note**: You'll need to populate these tables with your own data collection process.

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


## Project Structure

```
├── app/
│   ├── api/
│   │   └── facilities/
│   │       └── route.ts      # API endpoint for fetching facility data
│   ├── layout.tsx            # Root layout with font configuration
│   ├── page.tsx              # Main dashboard with charts and filters
│   └── globals.css           # Global styles, CSS variables, and theming
├── components/
│   ├── ui/                   # shadcn/ui Base UI components
│   └── theme-toggle.tsx      # Light/dark mode toggle
├── lib/
│   ├── db.ts                 # Turso database client configuration
│   └── utils.ts              # Utility functions (cn, etc.)
└── public/                   # Static assets
```

## API Endpoints

### `GET /api/facilities`

Fetches all locations with their occupancy count history.

**Query Parameters:**
- `date` (optional): Filter by specific date using ISO date string (e.g., `2024-01-15T00:00:00.000Z`) or `all` for all available dates

**Example Requests:**
```bash
# Get all data for all dates
GET /api/facilities?date=all

# Get data for a specific date
GET /api/facilities?date=2024-01-15T00:00:00.000Z
```

**Response Format:**
```json
[
  {
    "location_id": 1,
    "location_name": "Marino Center - Cardio Area",
    "facility_name": "Marino Center",
    "counts": [
      {
        "location_id": 1,
        "last_count": 42,
        "last_updated_at": "2024-01-15T14:30:00Z",
        "fetched_at": "2024-01-15T14:35:00Z"
      }
    ]
  }
]
```

**Notes:**
- The API always returns all locations; filtering by date only affects the `counts` array for each location
- If a location has no counts for the specified date, its `counts` array will be empty

## Customization

### Modifying Charts

The dashboard uses Recharts with AreaChart components. To customize chart appearance, edit the chart configuration in `app/page.tsx`:
- Gradient colors (search for `linearGradient`)
- Chart dimensions and margins
- Tooltip styling
- Axis configuration

### Styling

The project uses:
- **Tailwind CSS 4** for utility-first styling
- **OKLCH colors** for perceptually uniform color spaces
- **CSS variables** in `app/globals.css` for light/dark mode theming
- Theme toggle managed by `components/theme-toggle.tsx`

To customize colors, edit the CSS variables in `app/globals.css` under `:root` (light mode) and `.dark` (dark mode).

## Troubleshooting

### "Database not configured" error
- Verify `TURSO_DB_URL` and `TURSO_AUTH_TOKEN` are set in `.env.local`
- Restart the dev server after adding environment variables

### No data showing / Empty charts
- Check that your database has data in the `locations` and `location_counts` tables
- Verify your data collection pipeline is running and inserting data
- Check the browser console for API errors

### Date selector is empty
- The app automatically populates dates from your database
- If no dates appear, your `location_counts` table is empty
- Make sure `last_updated_at` timestamps are valid ISO date strings

## Deployment

This Next.js app can be deployed to any platform that supports Node.js:

- **Vercel** (recommended): Zero-config deployment for Next.js apps
- **Netlify**: Supports Next.js with automatic builds
- **Railway/Render/Fly.io**: General-purpose hosting platforms
- **Docker**: Can be containerized for self-hosting

Make sure to set the `TURSO_DB_URL` and `TURSO_AUTH_TOKEN` environment variables in your deployment platform.

## Data Collection

This dashboard requires a separate data collection process. Here's what you need:

1. A script that periodically fetches data from Northeastern Recreation's facility counts page
2. Parsing logic to extract location IDs, names, and current counts
3. A scheduler (cron job, cloud function, etc.) to run the script at regular intervals
4. Insert logic to store the data in your Turso database using the schema above

**Example data collection flow:**
```
Cron Job (every 5 min) → Scraper → Parse HTML → Insert to Turso → Dashboard displays
```

## Adapting for Other Facilities

Want to use this for your own gym or facility? Here's what to modify:

1. **Update the title and branding**:
   - Edit `app/page.tsx` line 128-140 to change the header title and data source link
   - Update `app/layout.tsx` metadata (title, description)

2. **Modify the data source**:
   - Build your own scraper for your facility's website
   - Adjust the database schema if needed (e.g., add capacity limits, facility types)

3. **Customize the UI**:
   - Chart colors: `app/page.tsx` (search for `linearGradient` and `stroke`)
   - Layout: Modify the grid in `app/page.tsx` (currently 2-column on large screens)
   - Theme colors: `app/globals.css` CSS variables

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Turso Documentation](https://docs.turso.tech)
- [Recharts Documentation](https://recharts.org)

## License

MIT License - feel free to use this project for your own facility tracking needs.
