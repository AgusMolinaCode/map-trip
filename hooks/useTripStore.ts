import { create } from 'zustand'

export interface Place {
  id: string
  name: string
  coordinates: [number, number] // [lng, lat]
  address?: string
}

export type RouteProfile = 'driving' | 'walking' | 'cycling' | 'driving-traffic'

export interface RouteStats {
  distance?: number // in meters
  duration?: number // in seconds
}

export interface Day {
  id: string
  name: string
  places: Place[]
  routeProfile: RouteProfile
  routeStats?: RouteStats
}

interface TripStore {
  days: Day[]
  addDay: () => void
  removeDay: (dayId: string) => void
  addPlace: (dayId: string, place: Place) => void
  removePlace: (dayId: string, placeId: string) => void
  reorderPlaces: (dayId: string, places: Place[]) => void
  setRouteProfile: (dayId: string, profile: RouteProfile) => void
  updateRouteStats: (dayId: string, stats: RouteStats) => void
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
}))
