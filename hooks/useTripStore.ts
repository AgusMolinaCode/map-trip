import { create } from 'zustand'

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
}

export interface Day {
  id: string
  name: string
  places: Place[]
  pointsOfInterest: PointOfInterest[]
  routeProfile: RouteProfile
  routeStats?: RouteStats
  customRoutes?: CustomRoute[]
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
  addSearchPin: (pin: Omit<SearchPin, 'id'>) => void
  removeSearchPin: (pinId: string) => void
  clearSearchPins: () => void
  addDay: () => void
  removeDay: (dayId: string) => void
  addPlace: (dayId: string, place: Place) => void
  removePlace: (dayId: string, placeId: string) => void
  reorderPlaces: (dayId: string, places: Place[]) => void
  updatePlaceCoordinates: (dayId: string, placeId: string, coordinates: [number, number]) => void
  updatePlaceInfo: (dayId: string, placeId: string, name: string, address: string) => void
  // Points of Interest actions
  addPointOfInterest: (dayId: string, poi: Omit<PointOfInterest, 'id'>) => void
  removePointOfInterest: (dayId: string, poiId: string) => void
  updatePoiCoordinates: (dayId: string, poiId: string, coordinates: [number, number]) => void
  updatePoiInfo: (dayId: string, poiId: string, name: string, address: string) => void
  setRouteProfile: (dayId: string, profile: RouteProfile) => void
  updateRouteStats: (dayId: string, stats: RouteStats) => void
  setCustomRoute: (dayId: string, customRoute: CustomRoute) => void
  removeCustomRoute: (dayId: string, fromPlaceId: string, toPlaceId: string) => void
}

export const useTripStore = create<TripStore>((set) => ({
  days: [],
  searchPins: [],

  addSearchPin: (pin) =>
    set((state) => ({
      searchPins: [
        ...state.searchPins,
        {
          ...pin,
          id: `search-pin-${Date.now()}`,
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

  addDay: () =>
    set((state) => ({
      days: [
        ...state.days,
        {
          id: `day-${Date.now()}`,
          name: `Dia ${state.days.length + 1}`,
          places: [],
          pointsOfInterest: [],
          routeProfile: 'driving',
          routeStats: undefined,
        },
      ],
    })),

  removeDay: (dayId) =>
    set((state) => ({
      days: state.days.filter((day) => day.id !== dayId),
    })),

  addPlace: (dayId, place) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? { ...day, places: [...day.places, place] }
          : day
      ),
    })),

  removePlace: (dayId, placeId) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? { ...day, places: day.places.filter((p) => p.id !== placeId) }
          : day
      ),
    })),

  reorderPlaces: (dayId, places) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId ? { ...day, places } : day
      ),
    })),

  updatePlaceCoordinates: (dayId, placeId, coordinates) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              places: day.places.map((place) =>
                place.id === placeId ? { ...place, coordinates } : place
              ),
            }
          : day
      ),
    })),

  updatePlaceInfo: (dayId, placeId, name, address) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              places: day.places.map((place) =>
                place.id === placeId ? { ...place, name, address } : place
              ),
            }
          : day
      ),
    })),

  // Points of Interest implementations
  addPointOfInterest: (dayId, poi) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              pointsOfInterest: [
                ...day.pointsOfInterest,
                { ...poi, id: `poi-${Date.now()}` },
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

  setRouteProfile: (dayId, profile) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId ? { ...day, routeProfile: profile } : day
      ),
    })),

  updateRouteStats: (dayId, stats) =>
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId ? { ...day, routeStats: stats } : day
      ),
    })),

  setCustomRoute: (dayId, customRoute) =>
    set((state) => ({
      days: state.days.map((day) => {
        if (day.id !== dayId) return day

        const existingRoutes = day.customRoutes || []
        const routeIndex = existingRoutes.findIndex(
          (r) =>
            r.fromPlaceId === customRoute.fromPlaceId &&
            r.toPlaceId === customRoute.toPlaceId
        )

        let newCustomRoutes
        if (routeIndex >= 0) {
          // Update existing route
          newCustomRoutes = [...existingRoutes]
          newCustomRoutes[routeIndex] = customRoute
        } else {
          // Add new route
          newCustomRoutes = [...existingRoutes, customRoute]
        }

        return { ...day, customRoutes: newCustomRoutes }
      }),
    })),

  removeCustomRoute: (dayId, fromPlaceId, toPlaceId) =>
    set((state) => ({
      days: state.days.map((day) => {
        if (day.id !== dayId) return day

        const customRoutes = (day.customRoutes || []).filter(
          (r) => !(r.fromPlaceId === fromPlaceId && r.toPlaceId === toPlaceId)
        )

        return { ...day, customRoutes }
      }),
    })),
}))
