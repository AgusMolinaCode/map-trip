# Trip Planner - Interactive Travel Mapping Application

A full-featured travel planner built with Next.js, Mapbox GL JS, and shadcn/ui components. Plan your trips day-by-day with interactive maps, drag-and-drop place ordering, and real-time route visualization.

## Features

- **Day-by-Day Planning**: Organize your trip into separate days with collapsible accordions
- **Interactive Map**: Full Mapbox GL JS integration with custom markers and route visualization
- **Place Search**: Real-time autocomplete using Mapbox Geocoding API
- **Drag & Drop**: Reorder places within each day to optimize your route
- **Route Visualization**: Real driving routes using Mapbox Directions API with color coding per day
- **Multiple Travel Modes**: Choose between driving, driving with traffic, walking, or cycling routes
- **Travel Statistics**: See estimated travel time and distance for each day automatically
- **Click to Navigate**: Click any place in the sidebar to fly to its location on the map
- **Responsive UI**: Built with shadcn/ui components and TailwindCSS

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Map Library**: Mapbox GL JS
- **Mapbox APIs**:
  - Geocoding API (place search autocomplete)
  - Directions API (real driving routes)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Styling**: TailwindCSS
- **Language**: TypeScript


## Project Structure

```
map-trip/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page with two-column layout
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── accordion.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── scroll-area.tsx
│   ├── DayItem.tsx         # Day card with accordion and places list
│   ├── PlaceItem.tsx       # Individual place with drag handle
│   ├── PlaceSearch.tsx     # Place search with autocomplete
│   ├── Sidebar.tsx         # Left sidebar with trip overview
│   └── MapView.tsx         # Mapbox map with markers and routes
├── hooks/
│   └── useTripStore.ts     # Zustand store for state management
└── lib/
    └── utils.ts            # Utility functions (cn helper)
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Mapbox Access Token

1. Sign up for a free account at [Mapbox](https://www.mapbox.com/)
2. Go to your [Account Dashboard](https://account.mapbox.com/)
3. Copy your default public access token

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Mapbox token:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_mapbox_token_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Adding Days

1. Click the "Add Day" button in the sidebar
2. A new day card appears with the name "Day 1", "Day 2", etc.
3. Click the day to expand/collapse it
4. Each day starts with "Driving" mode by default

### Adding Places

1. Expand a day by clicking on it
2. Click "Add Place" button
3. Type in the search box to find locations
4. Click on a search result to add it to the day
5. The place appears in the list and as a marker on the map

### Reordering Places

1. Click and hold the grip icon (⋮⋮) on any place
2. Drag the place up or down within the day
3. Release to drop it in the new position
4. Routes automatically update to reflect the new order

### Changing Travel Mode

1. Expand a day to see the "Travel Mode" dropdown
2. Choose from:
   - **Driving**: Car routes on roads
   - **Driving (Traffic)**: Car routes considering current traffic
   - **Walking**: Pedestrian routes
   - **Cycling**: Bicycle-friendly routes
3. Routes automatically update when you change the mode
4. Travel time and distance update based on the selected mode

### Navigating the Map

1. Click any place in the sidebar to fly to its location
2. Click markers on the map to see place details
3. Use map controls (zoom, rotate) in the top-right corner
4. Routes are drawn automatically following real roads when you add 2+ places to a day

### Viewing Travel Statistics

- When a day has 2+ places, travel statistics appear below the Travel Mode selector
- **Distance**: Total kilometers for the day's route
- **Duration**: Estimated travel time (hours and minutes)
- Statistics update automatically when you reorder places or change travel mode

### Managing Your Trip

- **Remove Places**: Click the X button on any place
- **Remove Days**: Click "Remove Day" at the bottom of each day card
- **View Stats**: Check total days and places at the bottom of the sidebar

## Color Coding

Each day is assigned a unique color for easy visual identification:

- Day 1: Blue (#3B82F6)
- Day 2: Red (#EF4444)
- Day 3: Green (#10B981)
- Day 4: Amber (#F59E0B)
- Day 5: Purple (#8B5CF6)
- Day 6: Pink (#EC4899)
- Day 7: Cyan (#06B6D4)
- Day 8: Orange (#F97316)

Colors repeat after 8 days.

## State Management

The app uses Zustand for state management with the following structure:

```typescript
{
  days: [
    {
      id: string,
      name: string,
      places: [
        {
          id: string,
          name: string,
          coordinates: [lng, lat],
          address?: string
        }
      ]
    }
  ]
}
```

**Important**: All data is stored in memory only. Refreshing the page will reset your trip plan. Database integration will be added in a future update.

## Future Enhancements

- **Database Integration**: PostgreSQL + Neon for data persistence
- **User Authentication**: Save and manage multiple trips
- **Trip Sharing**: Share trip plans with others
- **Route Optimization**: Automatic waypoint optimization for shortest/fastest path
- **Multi-Day Statistics**: Total trip distance and time across all days
- **Weather Integration**: Show weather forecast for each location
- **Budget Tracking**: Add estimated costs per day
- **Photo Gallery**: Attach photos to places
- **Export Features**: Export trip as PDF or share via link
- **Offline Mode**: Download maps for offline use
- **Mobile App**: React Native version for mobile devices

## Development

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### Map Not Showing

- Verify your Mapbox token is correctly set in `.env.local`
- Make sure the token is public (starts with `pk.`)
- Check browser console for errors

### Search Not Working

- Ensure your Mapbox token has geocoding permissions
- Check your network connection
- Verify the token in `.env.local` is correct

### Drag & Drop Issues

- Make sure you're clicking and holding the grip icon (⋮⋮)
- Check that you're dragging within the same day
- Try refreshing the page

### Routes Not Showing

- Routes require 2 or more places in a day
- Check browser console for API errors
- Verify your Mapbox token has Directions API access
- If routes fail, the app falls back to straight lines
- API limit: 25 waypoints maximum per route (usually sufficient for day trips)

## License

MIT

## Credits

- Built with [Next.js](https://nextjs.org/)
- Maps powered by [Mapbox](https://www.mapbox.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- State management by [Zustand](https://github.com/pmndrs/zustand)
- Drag & Drop by [@dnd-kit](https://dndkit.com/)
