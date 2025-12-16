# Map Trip - Travel Planner Application

## 📋 Project Overview

Interactive travel planner built with Next.js 16, Mapbox GL JS, and Zustand. Plan multi-day trips with drag-and-drop place ordering, real-time route visualization, and Points of Interest.

**Core Features:**
- Day-by-day trip planning with collapsible accordions
- Interactive Mapbox integration with custom markers and route visualization
- Place search using Mapbox Geocoding API with autocomplete
- Drag & drop place reordering within each day
- Multiple travel modes (driving, driving-traffic, walking, cycling)
- Route customization with visual editor
- Points of Interest (POI) - standalone pins not connected to routes
- Tourist exploration pins for discovering places independently

## 🛠️ Tech Stack

**Framework & Core:**
- Next.js 16.0.5 (App Router) - React 19.2.0
- TypeScript 5
- Zustand (state management)

**Mapping:**
- Mapbox GL JS 3.17.0
- react-map-gl 8.1.0
- Mapbox Geocoding API
- Mapbox Directions API
- @mapbox/mapbox-gl-draw 1.5.1
- @turf/turf 7.3.1

**UI Components:**
- shadcn/ui (Radix UI primitives)
- TailwindCSS 4
- lucide-react (icons)
- @dnd-kit (drag & drop)

## 📁 Project Structure

```
map-trip/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Landing/home page
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   └── page.tsx              # Main dashboard with map
│   └── globals.css               # Global styles + Tailwind
│
├── components/
│   ├── ui/                       # shadcn/ui components (Radix UI)
│   │   ├── accordion.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   └── tooltip.tsx
│   │
│   ├── AppSidebar.tsx            # Main app sidebar (NEW)
│   ├── DayItem.tsx               # Day accordion with places list
│   ├── PlaceItem.tsx             # Individual place with drag handle
│   ├── PlaceSearch.tsx           # Place search with autocomplete
│   ├── TouristPinSearch.tsx      # Tourist exploration search (NEW)
│   ├── SearchPinPopup.tsx        # Popup for search pins (NEW)
│   ├── PoiPinPopup.tsx          # Popup for POI pins (NEW)
│   ├── RouteEditor.tsx           # Visual route customization (NEW)
│   ├── Sidebar.tsx               # Original sidebar (legacy)
│   └── MapView.tsx               # Mapbox map with all features
│
├── hooks/
│   ├── useTripStore.ts           # Zustand store (state management)
│   ├── useMapboxRoute.ts         # Mapbox Directions API hook
│   └── use-mobile.tsx            # Mobile detection hook
│
├── contexts/
│   └── TripContext.tsx           # Trip context provider (NEW)
│
├── lib/
│   └── utils.ts                  # Utility functions (cn helper)
│
└── types/
    └── global.d.ts               # Global TypeScript declarations
```

## 🎯 State Management (Zustand)

```typescript
interface TripStore {
  // Core state
  days: Day[]                     // Array of trip days
  searchPins: SearchPin[]         // Tourist exploration pins

  // Day management
  addDay()
  removeDay(dayId)

  // Place management (route waypoints)
  addPlace(dayId, place)
  removePlace(dayId, placeId)
  reorderPlaces(dayId, places)
  updatePlaceCoordinates(dayId, placeId, coords)
  updatePlaceInfo(dayId, placeId, name, address)

  // Points of Interest (standalone pins)
  addPointOfInterest(dayId, poi)
  removePointOfInterest(dayId, poiId)
  updatePoiCoordinates(dayId, poiId, coords)
  updatePoiInfo(dayId, poiId, name, address)

  // Search pins (tourist exploration)
  addSearchPin(pin)
  removeSearchPin(pinId)
  clearSearchPins()

  // Route management
  setRouteProfile(dayId, profile)
  updateRouteStats(dayId, stats)
  setCustomRoute(dayId, customRoute)
  removeCustomRoute(dayId, fromPlaceId, toPlaceId)
}
```

**Key Data Types:**
```typescript
interface Day {
  id: string
  name: string
  places: Place[]                    // Route waypoints
  pointsOfInterest: PointOfInterest[] // Standalone pins
  routeProfile: RouteProfile         // driving|walking|cycling|driving-traffic
  routeStats?: { distance, duration }
  customRoutes?: CustomRoute[]       // User-edited routes
}

interface Place {
  id: string
  name: string
  coordinates: [lng, lat]
  address?: string
  bbox?: [minLng, minLat, maxLng, maxLat]
}

interface PointOfInterest {
  id: string
  name: string
  coordinates: [lng, lat]
  address?: string
  note?: string
}

interface SearchPin {
  id: string
  name: string
  coordinates: [lng, lat]
  address?: string
  bbox?: [minLng, minLat, maxLng, maxLat]
}
```

## 🗺️ Map Features

**MapView Component** (`components/MapView.tsx`):
- **Place Markers**: Numbered pins with day colors, draggable
- **POI Markers**: Pill-shaped labels, draggable, independent of routes
- **Search Pins**: Orange exploration pins for tourist places
- **Routes**: Color-coded driving routes per day
- **Custom Routes**: User-edited routes with visual editor
- **Areas**: Bounding box polygons when place has bbox data
- **Reverse Geocoding**: Auto-update names when dragging pins

**Interactions:**
- Click numbered pin → Edit route to next waypoint
- Click POI → Edit POI info popup
- Click search pin → Add to day popup
- Drag any pin → Auto-update coordinates + reverse geocode
- Map auto-fits bounds when adding/removing places

## 🎨 Color Coding

Day colors (cycle every 8 days):
```typescript
const DAY_COLORS = [
  '#3B82F6',  // blue
  '#EF4444',  // red
  '#10B981',  // green
  '#F59E0B',  // amber
  '#8B5CF6',  // purple
  '#EC4899',  // pink
  '#06B6D4',  // cyan
  '#F97316',  // orange
]
```

## 🔧 Development Guidelines

### Code Style
- **TypeScript**: Strict mode, prefer interfaces over types
- **Components**: Functional components with hooks
- **State**: Zustand for global, useState for local
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Imports**: Group by external → internal → types

### File Organization
- Place UI components in `components/`
- Place reusable hooks in `hooks/`
- Place utility functions in `lib/`
- Use TypeScript interfaces for all data structures
- Keep components focused (Single Responsibility)

### Mapbox Integration
- **Token**: `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`
- **Geocoding API**: Place search autocomplete
- **Directions API**: Real driving routes
- **Limits**: 25 waypoints max per route
- **Error Handling**: Fallback to straight lines if route fails

### Performance Considerations
- Use `useMemo` for computed values (route geometry, coordinates)
- Avoid re-renders with React.memo where appropriate
- Batch Zustand updates when possible
- Clean up map sources/layers to prevent memory leaks

## 🚀 Common Tasks

### Adding a New Feature
1. Define TypeScript interfaces in `hooks/useTripStore.ts`
2. Add Zustand actions to the store
3. Create/update UI component in `components/`
4. Update MapView if map interaction needed
5. Test with multiple days and edge cases

### Adding a New UI Component
1. Use shadcn/ui if available: `npx shadcn@latest add [component]`
2. Place in `components/ui/` for reusable components
3. Follow Radix UI patterns for accessibility
4. Use Tailwind for styling

### Debugging Map Issues
- Check browser console for Mapbox errors
- Verify token in `.env.local` (starts with `pk.`)
- Check coordinates format: `[lng, lat]` NOT `[lat, lng]`
- Use MapView ref for programmatic map control
- Ensure unique IDs for Sources and Layers

### State Management Pattern
```typescript
// ✅ Good: Single Zustand action
const handleUpdate = () => {
  useTripStore.getState().updatePlaceCoordinates(dayId, placeId, coords)
}

// ❌ Bad: Multiple separate calls
const handleUpdate = () => {
  const coords = getCoords()
  updateCoords(coords)
  updateName(name)
  updateAddress(addr)
}
```

## ⚠️ Known Issues & Future Enhancements

**Current Limitations:**
- Data stored in memory only (no persistence)
- No user authentication
- No trip sharing capabilities

**Planned Features:**
- Database integration (PostgreSQL + Neon)
- User authentication and multi-trip management
- Trip sharing functionality
- Route optimization (shortest/fastest path)
- Weather integration
- Budget tracking
- Photo gallery per place
- Export to PDF
- Offline mode
- Mobile app (React Native)

## 🔒 Security Considerations

**Current Status:**
- ✅ No known vulnerabilities (npm audit clean)
- ✅ Next.js 16.0.10 (patched security issues)
- ✅ Dependencies up to date
- Mapbox token exposed client-side (by design, use public token)
- No authentication/authorization

**Environment Variables Checklist:**
```bash
✓ NEXT_PUBLIC_MAPBOX_TOKEN (public token only)
✓ No sensitive keys in client-side code
✓ All dependencies audited
```

## 📝 Code Quality Notes

**Strengths:**
- ✅ Clean TypeScript with proper interfaces
- ✅ Good component separation
- ✅ Zustand state management well-structured
- ✅ Builds successfully without TypeScript errors
- ✅ No TODO/FIXME comments (clean codebase)

**Areas for Improvement:**
- `console.error` in 4 files (MapView, useMapboxRoute, PlaceSearch, TouristPinSearch)
  - Consider using a logging service for production
- No error boundaries for React component errors
- Missing input validation on user-entered data
- No loading states for async operations

**Console.error locations:**
```
components/MapView.tsx:177        (reverse geocoding)
hooks/useMapboxRoute.ts:76        (route fetching)
components/PlaceSearch.tsx:49     (place search)
components/TouristPinSearch.tsx:82,116 (search/retrieve)
```

## 🧪 Testing Strategy

**Recommended Test Coverage:**
- Unit tests for Zustand store actions
- Integration tests for MapView interactions
- E2E tests for complete user workflows
- Visual regression tests for UI components

**Testing Tools to Consider:**
- Jest + React Testing Library (unit/integration)
- Playwright (E2E browser automation)
- Storybook (component documentation)

## 🎓 Learning Resources

**Next.js 16:**
- [Next.js App Router Docs](https://nextjs.org/docs)
- [React 19 Migration Guide](https://react.dev/blog/2024/04/25/react-19)

**Mapbox:**
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Directions API](https://docs.mapbox.com/api/navigation/directions/)

**State Management:**
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/typescript)

## 🤝 Contributing

When contributing to this project:
1. Follow existing code style and patterns
2. Update TypeScript interfaces when changing data structures
3. Test map interactions thoroughly
4. Keep components focused and reusable
5. Document complex logic with comments
6. No console.log in production code (use console.error for errors only)

---

**Last Updated:** 2025-12-15
**Next.js Version:** 16.0.10 ✅
**React Version:** 19.2.0
**Security Status:** ✅ No vulnerabilities
