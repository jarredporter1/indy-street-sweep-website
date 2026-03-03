# Indy Street Sweep

## Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

## Tech Stack
- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**
- **Leaflet + React Leaflet** — Interactive maps
- **Google APIs** — Data source for sweep schedules
- **Zod v4** — Schema validation

## Project
Street sweeping schedule app for Indianapolis. Shows residents when their streets get swept using interactive maps.

## Notes
- Map rendering via Leaflet (not Google Maps).
- Schedule data pulled from Google APIs.
- `scripts/` folder likely contains data processing utilities.
