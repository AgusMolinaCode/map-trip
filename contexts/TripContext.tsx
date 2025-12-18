'use client'

import { createContext, useContext, useRef, type ReactNode } from 'react'
import type { MapViewRef } from '@/components/MapView'
import type { Place } from '@/hooks/useTripStore'

interface TripContextType {
  mapRef: React.RefObject<MapViewRef | null>
  handlePlaceClick: (place: Place) => void
  handleFlyToCoordinates: (coordinates: [number, number]) => void
  getMapCenter: () => [number, number] | null
}

const TripContext = createContext<TripContextType | undefined>(undefined)

export function TripProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<MapViewRef>(null)

  const handlePlaceClick = (place: Place) => {
    mapRef.current?.flyToPlace(place)
  }

  const handleFlyToCoordinates = (coordinates: [number, number]) => {
    // Create a temporary place to fly to
    const tempPlace: Place = {
      id: 'temp',
      name: 'temp',
      coordinates,
    }
    mapRef.current?.flyToPlace(tempPlace)
  }

  const getMapCenter = (): [number, number] | null => {
    return mapRef.current?.getCenter() ?? null
  }

  return (
    <TripContext.Provider value={{ mapRef, handlePlaceClick, handleFlyToCoordinates, getMapCenter }}>
      {children}
    </TripContext.Provider>
  )
}

export function useTripContext() {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error('useTripContext must be used within TripProvider')
  }
  return context
}
