'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTripStore, type Place, type Day } from '@/hooks/useTripStore'
import { useMapboxRoute } from '@/hooks/useMapboxRoute'
import { RouteEditor } from '@/components/RouteEditor'

// Day colors for markers and areas
const DAY_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

interface MapViewProps {
  onPlaceClick?: (place: Place) => void
}

export interface MapViewRef {
  flyToPlace: (place: Place) => void
}

// Component to render a single segment route (between two places)
function RouteSegment({
  dayId,
  fromPlace,
  toPlace,
  profile,
  color,
  customRoute,
}: {
  dayId: string
  fromPlace: Place
  toPlace: Place
  profile: string
  color: string
  customRoute?: { geometry: { type: 'LineString'; coordinates: [number, number][] } }
}) {
  // Only fetch automatic route if no custom route exists
  const shouldFetchRoute = !customRoute

  // Memoize coordinates to prevent infinite loop - use string comparison for stability
  const coordinates = useMemo(
    () => (shouldFetchRoute ? [fromPlace.coordinates, toPlace.coordinates] : []),
    [shouldFetchRoute, JSON.stringify(fromPlace.coordinates), JSON.stringify(toPlace.coordinates)]
  )

  const { geometry } = useMapboxRoute({
    coordinates,
    profile: profile as any,
  })

  // Use custom route if available, otherwise use automatic route
  const routeGeometry = useMemo(() => {
    if (customRoute) {
      return { type: 'Feature' as const, properties: {}, geometry: customRoute.geometry }
    }
    return geometry
  }, [customRoute, geometry])

  if (!routeGeometry) return null

  return (
    <Source
      id={`route-${dayId}-${fromPlace.id}-${toPlace.id}`}
      type="geojson"
      data={routeGeometry}
    >
      <Layer
        id={`route-${dayId}-${fromPlace.id}-${toPlace.id}-layer`}
        type="line"
        paint={{
          'line-color': color,
          'line-width': customRoute ? 5 : 4,
          'line-opacity': customRoute ? 0.9 : 0.75,
          'line-dasharray': customRoute ? [1, 0] : [2, 0],
        }}
      />
    </Source>
  )
}

// Component to render all routes for a day
function DayRoutes({ day, color }: { day: Day; color: string }) {
  if (day.places.length < 2) return null

  return (
    <>
      {day.places.slice(0, -1).map((place, index) => {
        const nextPlace = day.places[index + 1]
        const customRoute = day.customRoutes?.find(
          (r) => r.fromPlaceId === place.id && r.toPlaceId === nextPlace.id
        )

        return (
          <RouteSegment
            key={`${place.id}-${nextPlace.id}`}
            dayId={day.id}
            fromPlace={place}
            toPlace={nextPlace}
            profile={day.routeProfile}
            color={color}
            customRoute={customRoute}
          />
        )
      })}
    </>
  )
}

export const MapView = forwardRef<MapViewRef, MapViewProps>(({ onPlaceClick }, ref) => {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState({
    longitude: -63.6167, // Argentina center
    latitude: -38.4161,
    zoom: 4,
  })

  // State for route editing
  const [editingRoute, setEditingRoute] = useState<{
    dayId: string
    fromPlace: Place
    toPlace: Place
  } | null>(null)

  const days = useTripStore((state) => state.days)
  const updatePlaceCoordinates = useTripStore((state) => state.updatePlaceCoordinates)
  const updatePlaceInfo = useTripStore((state) => state.updatePlaceInfo)

  // Reverse geocode coordinates to get place name
  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`
      )

      if (!response.ok) {
        throw new Error('Failed to reverse geocode')
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        return {
          name: feature.text || feature.place_name,
          address: feature.place_name,
        }
      }

      return null
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  // Fly to place
  const flyToPlace = useCallback((place: Place) => {
    if (!mapRef.current) return

    // If place has bbox, fit to the bbox bounds
    if (place.bbox) {
      const [minLng, minLat, maxLng, maxLat] = place.bbox
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: 50,
          duration: 1000,
        }
      )
    } else {
      // Otherwise, just fly to the center point
      mapRef.current.flyTo({
        center: [place.coordinates[0], place.coordinates[1]],
        zoom: 12,
        duration: 1000,
      })
    }
  }, [])

  // Expose flyTo method via ref
  useImperativeHandle(ref, () => ({
    flyToPlace,
  }))

  // Fit bounds to show all places when days change
  useEffect(() => {
    if (!mapRef.current) return

    const allPlaces = days.flatMap((day) => day.places)
    if (allPlaces.length === 0) return

    // Calculate bounds from all places
    const coordinates = allPlaces.map((place) => place.coordinates)
    if (coordinates.length === 1) {
      // If only one place, just fly to it
      const place = allPlaces[0]
      if (place.bbox) {
        const [minLng, minLat, maxLng, maxLat] = place.bbox
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          {
            padding: 50,
            duration: 1000,
          }
        )
      } else {
        mapRef.current.flyTo({
          center: [place.coordinates[0], place.coordinates[1]],
          zoom: 12,
          duration: 1000,
        })
      }
    } else {
      // Multiple places, fit to all
      const lngs = coordinates.map((c) => c[0])
      const lats = coordinates.map((c) => c[1])
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)

      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: 50,
          duration: 1000,
        }
      )
    }
  }, [days])

  // Handler for pin click to edit route
  const handlePinClick = (dayId: string, placeIndex: number, place: Place) => {
    const day = days.find((d) => d.id === dayId)
    if (!day) return

    // If it's the last place, can't edit route to next
    if (placeIndex >= day.places.length - 1) {
      onPlaceClick?.(place)
      return
    }

    const nextPlace = day.places[placeIndex + 1]
    setEditingRoute({
      dayId,
      fromPlace: place,
      toPlace: nextPlace,
    })
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        {/* Render routes for each day */}
        {days.map((day, dayIndex) => {
          const color = DAY_COLORS[dayIndex % DAY_COLORS.length]
          return <DayRoutes key={day.id} day={day} color={color} />
        })}

        {/* Render areas for each place */}
        {days.map((day, dayIndex) => {
          const color = DAY_COLORS[dayIndex % DAY_COLORS.length]

          return day.places.map((place) => {
            if (!place.bbox) return null

            const [minLng, minLat, maxLng, maxLat] = place.bbox

            // Create polygon coordinates from bbox
            const coordinates = [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ]

            return (
              <Source
                key={`area-${place.id}`}
                id={`area-${place.id}`}
                type="geojson"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Polygon',
                    coordinates,
                  },
                }}
              >
                {/* Fill layer */}
                <Layer
                  id={`area-${place.id}-fill`}
                  type="fill"
                  paint={{
                    'fill-color': color,
                    'fill-opacity': 0.2,
                  }}
                />
                {/* Outline layer */}
                <Layer
                  id={`area-${place.id}-outline`}
                  type="line"
                  paint={{
                    'line-color': color,
                    'line-width': 2,
                    'line-opacity': 0.8,
                  }}
                />
              </Source>
            )
          })
        })}

        {/* Render markers with numbers */}
        {days.map((day, dayIndex) => {
          const color = DAY_COLORS[dayIndex % DAY_COLORS.length]

          return day.places.map((place, placeIndex) => (
            <Marker
              key={place.id}
              longitude={place.coordinates[0]}
              latitude={place.coordinates[1]}
              anchor="center"
              draggable
              onDragEnd={async (e) => {
                const newCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat]
                updatePlaceCoordinates(day.id, place.id, newCoords)

                // Reverse geocode to get new place name
                const locationInfo = await reverseGeocode(newCoords[0], newCoords[1])
                if (locationInfo) {
                  updatePlaceInfo(day.id, place.id, locationInfo.name, locationInfo.address)
                }
              }}
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                handlePinClick(day.id, placeIndex, place)
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  color,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${color}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  cursor: 'move',
                  transition: 'transform 0.2s',
                }}
                title="Arrastra para mover • Click para editar ruta"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {placeIndex + 1}
              </div>
            </Marker>
          ))
        })}
      </Map>

      {/* Route Editor Panel */}
      {editingRoute && (
        <RouteEditor
          mapRef={mapRef.current}
          dayId={editingRoute.dayId}
          fromPlace={editingRoute.fromPlace}
          toPlace={editingRoute.toPlace}
          onClose={() => setEditingRoute(null)}
        />
      )}
    </div>
  )
})

MapView.displayName = 'MapView'
