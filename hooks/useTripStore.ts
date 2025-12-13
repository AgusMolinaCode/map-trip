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

export interface Day {
  id: string
  name: string
  places: Place[]
  routeProfile: RouteProfile
  routeStats?: RouteStats
  customRoutes?: CustomRoute[]
}

interface TripStore {
  days: Day[]
  addDay: () => void
  removeDay: (dayId: string) => void
  addPlace: (dayId: string, place: Place) => void
  removePlace: (dayId: string, placeId: string) => void
  reorderPlaces: (dayId: string, places: Place[]) => void
  updatePlaceCoordinates: (dayId: string, placeId: string, coordinates: [number, number]) => void
  updatePlaceInfo: (dayId: string, placeId: string, name: string, address: string) => void
  setRouteProfile: (dayId: string, profile: RouteProfile) => void
  updateRouteStats: (dayId: string, stats: RouteStats) => void
  setCustomRoute: (dayId: string, customRoute: CustomRoute) => void
  removeCustomRoute: (dayId: string, fromPlaceId: string, toPlaceId: string) => void
}

export const useTripStore = create<TripStore>((set) => ({
  days: [],

  addDay: () =>
    set((state) => ({
      days: [
        ...state.days,
        {
          id: `day-${Date.now()}`,
          name: `Day ${state.days.length + 1}`,
          places: [],
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
