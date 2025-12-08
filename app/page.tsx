'use client'

import { useRef } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { MapView, type MapViewRef } from '@/components/MapView'
import type { Place } from '@/hooks/useTripStore'

export default function Home() {
  const mapRef = useRef<MapViewRef>(null)

  const handlePlaceClick = (place: Place) => {
    // Fly to place on map
    mapRef.current?.flyToPlace(place)
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar onPlaceClick={handlePlaceClick} />
      <div className="flex-1">
        <MapView ref={mapRef} onPlaceClick={handlePlaceClick} />
      </div>
    </div>
  )
}
