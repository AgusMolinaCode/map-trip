import { create } from 'zustand'

// UUID generator
function generateUUID(): string {
  return crypto.randomUUID()
}

// Colores vibrantes para rutas, POIs y marcadores
export const ROUTE_PASTEL_COLORS = [
  '#EF4444', // Rojo vibrante
  '#3B82F6', // Azul vibrante
  '#10B981', // Verde vibrante
  '#F59E0B', // Naranja vibrante
  '#8B5CF6', // Morado vibrante
  '#EC4899', // Rosa vibrante
  '#06B6D4', // Cyan vibrante
  '#EAB308', // Amarillo vibrante
]

export interface Place {
  id: string
  name: string
  coordinates: [number, number] // [lng, lat]
  address?: string
  bbox?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
}

export type RouteProfile = 'driving' | 'walking' | 'cycling' | 'driving-traffic'

export interface RouteStats {
  distance?: number // in meters
  duration?: number // in seconds
}

export interface CustomRoute {
  fromPlaceId: string
  toPlaceId: string
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

// Point of Interest - standalone pin not connected to route
export interface PointOfInterest {
  id: string
  name: string
  coordinates: [number, number]
  address?: string
  note?: string
  isManual?: boolean // true si fue creado manualmente (no por búsqueda)
}

// Route - multiple routes per day
export interface Route {
  id: string
  name?: string // "Ruta mañana", "Tour tarde", etc.
  places: Place[]
  routeProfile: RouteProfile
  routeStats?: RouteStats
  customRoutes?: CustomRoute[]
  routeColor?: string // Color pastel para el fondo de la ruta
}

export interface Day {
  id: string
  name: string
  routes: Route[] // Múltiples rutas por día
  pointsOfInterest: PointOfInterest[]
  dayColor?: string // Color pastel para el día completo (rutas + POIs)
}

// Search pin for exploring tourist places independently of the route
export interface SearchPin {
  id: string
  name: string
  coordinates: [number, number]
  address?: string
  bbox?: [number, number, number, number]
}

interface TripStore {
  days: Day[]
  searchPins: SearchPin[]

  // Search pins
  addSearchPin: (pin: Omit<SearchPin, 'id'>) => void
  removeSearchPin: (pinId: string) => void
  clearSearchPins: () => void

  // Day management
  addDay: () => void
  removeDay: (dayId: string) => void
  setDayColor: (dayId: string, color: string) => void

  // Route management
  addRoute: (dayId: string, name?: string) => void
  removeRoute: (dayId: string, routeId: string) => void

  // Place management (within a route)
  addPlace: (dayId: string, routeId: string, place: Place) => void
  removePlace: (dayId: string, routeId: string, placeId: string) => void
  reorderPlaces: (dayId: string, routeId: string, places: Place[]) => void
  updatePlaceCoordinates: (dayId: string, routeId: string, placeId: string, coordinates: [number, number]) => void
  updatePlaceInfo: (dayId: string, routeId: string, placeId: string, name: string, address: string) => void

  // Route settings
  setRouteProfile: (dayId: string, routeId: string, profile: RouteProfile) => void
  updateRouteStats: (dayId: string, routeId: string, stats: RouteStats) => void
  setCustomRoute: (dayId: string, routeId: string, customRoute: CustomRoute) => void
  removeCustomRoute: (dayId: string, routeId: string, fromPlaceId: string, toPlaceId: string) => void
  setRouteColor: (dayId: string, routeId: string, color: string) => void

  // Points of Interest (day-level, not route-specific)
  addPointOfInterest: (dayId: string, poi: Omit<PointOfInterest, 'id'>) => void
  removePointOfInterest: (dayId: string, poiId: string) => void
  updatePoiCoordinates: (dayId: string, poiId: string, coordinates: [number, number]) => void
  updatePoiInfo: (dayId: string, poiId: string, name: string, address: string) => void
}

export const useTripStore = create<TripStore>((set) => ({
  days: [],
  searchPins: [],

  // Search pins
  addSearchPin: (pin) =>
    set((state) => ({
      searchPins: [
        ...state.searchPins,
        {
          ...pin,
          id: generateUUID(),
        },
      ],
    })),

  removeSearchPin: (pinId) =>
    set((state) => ({
      searchPins: state.searchPins.filter((pin) => pin.id !== pinId),
    })),

  clearSearchPins: () =>
    set(() => ({
      searchPins: [],
    })),

  // Day management
  addDay: () =>
    set((state) => {
      const defaultColor = ROUTE_PASTEL_COLORS[state.days.length % ROUTE_PASTEL_COLORS.length]
      return {
        days: [
          ...state.days,
          {
            id: generateUUID(),
            name: `Dia ${state.days.length + 1}`,
            routes: [],
            pointsOfInterest: [],
            dayColor: defaultColor,
          },
        ],
      }
    }),

  removeDay: (dayId) =>
    set((state) => ({
      days: state.days.filter((day) => day.id !== dayId),
    })),

  setDayColor: (dayId, color) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId ? { ...day, dayColor: color } : day
      ),
    })),

  // Route management
  addRoute: (dayId, name) =>
    set((state) => ({
      days: state.days.map((day) => {
        if (day.id !== dayId) return day

        return {
          ...day,
          routes: [
            ...day.routes,
            {
              id: generateUUID(),
              name: name, // Solo usar nombre si se proporciona explícitamente
              places: [],
              routeProfile: 'driving',
            },
          ],
        }
      }),
    })),

  removeRoute: (dayId, routeId) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? { ...day, routes: day.routes.filter((r) => r.id !== routeId) }
          : day
      ),
    })),

  // Place management
  addPlace: (dayId, routeId, place) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId
                  ? { ...route, places: [...route.places, place] }
                  : route
              ),
            }
          : day
      ),
    })),

  removePlace: (dayId, routeId, placeId) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId
                  ? { ...route, places: route.places.filter((p) => p.id !== placeId) }
                  : route
              ),
            }
          : day
      ),
    })),

  reorderPlaces: (dayId, routeId, places) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId ? { ...route, places } : route
              ),
            }
          : day
      ),
    })),

  updatePlaceCoordinates: (dayId, routeId, placeId, coordinates) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId
                  ? {
                      ...route,
                      places: route.places.map((place) =>
                        place.id === placeId ? { ...place, coordinates } : place
                      ),
                    }
                  : route
              ),
            }
          : day
      ),
    })),

  updatePlaceInfo: (dayId, routeId, placeId, name, address) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId
                  ? {
                      ...route,
                      places: route.places.map((place) =>
                        place.id === placeId ? { ...place, name, address } : place
                      ),
                    }
                  : route
              ),
            }
          : day
      ),
    })),

  // Route settings
  setRouteProfile: (dayId, routeId, profile) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId ? { ...route, routeProfile: profile } : route
              ),
            }
          : day
      ),
    })),

  updateRouteStats: (dayId, routeId, stats) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId ? { ...route, routeStats: stats } : route
              ),
            }
          : day
      ),
    })),

  setCustomRoute: (dayId, routeId, customRoute) =>
    set((state) => ({
      days: state.days.map((day) => {
        if (day.id !== dayId) return day

        return {
          ...day,
          routes: day.routes.map((route) => {
            if (route.id !== routeId) return route

            const existingRoutes = route.customRoutes || []
            const routeIndex = existingRoutes.findIndex(
              (r) =>
                r.fromPlaceId === customRoute.fromPlaceId &&
                r.toPlaceId === customRoute.toPlaceId
            )

            let newCustomRoutes
            if (routeIndex >= 0) {
              newCustomRoutes = [...existingRoutes]
              newCustomRoutes[routeIndex] = customRoute
            } else {
              newCustomRoutes = [...existingRoutes, customRoute]
            }

            return { ...route, customRoutes: newCustomRoutes }
          }),
        }
      }),
    })),

  removeCustomRoute: (dayId, routeId, fromPlaceId, toPlaceId) =>
    set((state) => ({
      days: state.days.map((day) => {
        if (day.id !== dayId) return day

        return {
          ...day,
          routes: day.routes.map((route) => {
            if (route.id !== routeId) return route

            const customRoutes = (route.customRoutes || []).filter(
              (r) => !(r.fromPlaceId === fromPlaceId && r.toPlaceId === toPlaceId)
            )

            return { ...route, customRoutes }
          }),
        }
      }),
    })),

  setRouteColor: (dayId, routeId, color) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              routes: day.routes.map((route) =>
                route.id === routeId ? { ...route, routeColor: color } : route
              ),
            }
          : day
      ),
    })),

  // Points of Interest
  addPointOfInterest: (dayId, poi) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              pointsOfInterest: [
                ...day.pointsOfInterest,
                { ...poi, id: generateUUID() },
              ],
            }
          : day
      ),
    })),

  removePointOfInterest: (dayId, poiId) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              pointsOfInterest: day.pointsOfInterest.filter((p) => p.id !== poiId),
            }
          : day
      ),
    })),

  updatePoiCoordinates: (dayId, poiId, coordinates) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              pointsOfInterest: day.pointsOfInterest.map((poi) =>
                poi.id === poiId ? { ...poi, coordinates } : poi
              ),
            }
          : day
      ),
    })),

  updatePoiInfo: (dayId, poiId, name, address) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              pointsOfInterest: day.pointsOfInterest.map((poi) =>
                poi.id === poiId ? { ...poi, name, address } : poi
              ),
            }
          : day
      ),
    })),
}))
