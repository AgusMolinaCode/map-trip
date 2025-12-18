'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTripStore, type Place, type Day, type SearchPin, type PointOfInterest, type RouteProfile } from '@/hooks/useTripStore'
import { useMapboxRoute } from '@/hooks/useMapboxRoute'
import { RouteEditor } from '@/components/RouteEditor'
import { SearchPinPopup } from '@/components/SearchPinPopup'
import { PoiPinPopup } from '@/components/PoiPinPopup'

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
  getCenter: () => [number, number] | null
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
  profile: RouteProfile
  color: string
  customRoute?: { geometry: { type: 'LineString'; coordinates: [number, number][] } }
}) {
  // Only fetch automatic route if no custom route exists
  const shouldFetchRoute = !customRoute

  // Memoize coordinates to prevent infinite loop
  const fromCoords = fromPlace.coordinates
  const toCoords = toPlace.coordinates
  const coordinates = useMemo(
    () => (shouldFetchRoute ? [fromCoords, toCoords] : []),
    [shouldFetchRoute, fromCoords, toCoords]
  )

  const { geometry } = useMapboxRoute({
    coordinates,
    profile,
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
  if (!day.routes || day.routes.length === 0) return null

  return (
    <>
      {day.routes.map((route) => {
        if (route.places.length < 2) return null

        return route.places.slice(0, -1).map((place, index) => {
          const nextPlace = route.places[index + 1]
          const customRoute = route.customRoutes?.find(
            (r) => r.fromPlaceId === place.id && r.toPlaceId === nextPlace.id
          )

          return (
            <RouteSegment
              key={`${route.id}-${place.id}-${nextPlace.id}`}
              dayId={day.id}
              fromPlace={place}
              toPlace={nextPlace}
              profile={route.routeProfile}
              color={color}
              customRoute={customRoute}
            />
          )
        })
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
    routeId: string
    fromPlace: Place
    toPlace: Place
  } | null>(null)

  // State for search pin popup
  const [selectedSearchPin, setSelectedSearchPin] = useState<SearchPin | null>(null)

  // State for POI pin popup
  const [selectedPoi, setSelectedPoi] = useState<{ dayId: string; poi: PointOfInterest } | null>(
    null
  )

  const days = useTripStore((state) => state.days)
  const searchPins = useTripStore((state) => state.searchPins)
  const addPlace = useTripStore((state) => state.addPlace)
  const addRoute = useTripStore((state) => state.addRoute)
  const updatePlaceCoordinates = useTripStore((state) => state.updatePlaceCoordinates)
  const updatePlaceInfo = useTripStore((state) => state.updatePlaceInfo)
  const updatePoiCoordinates = useTripStore((state) => state.updatePoiCoordinates)
  const updatePoiInfo = useTripStore((state) => state.updatePoiInfo)

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

  // Reverse geocode coordinates for POI (same as place, but kept separate for clarity)
  const reverseGeocodePoi = reverseGeocode

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

  // Get current map center
  const getCenter = useCallback((): [number, number] | null => {
    if (!mapRef.current) return null
    const center = mapRef.current.getCenter()
    return [center.lng, center.lat]
  }, [])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    flyToPlace,
    getCenter,
  }))

  // Fit bounds to show all places when days change
  useEffect(() => {
    if (!mapRef.current) return

    const allPlaces = days.flatMap((day) =>
      day.routes.flatMap((route) => route.places)
    )
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

  // Handler for adding search pin to a day
  const handleAddSearchPinToDay = useCallback((dayId: string) => {
    if (!selectedSearchPin) return

    const day = days.find((d) => d.id === dayId)
    if (!day) return

    const newPlace: Place = {
      id: `place-${Date.now()}`,
      name: selectedSearchPin.name,
      coordinates: selectedSearchPin.coordinates,
      address: selectedSearchPin.address,
      bbox: selectedSearchPin.bbox,
    }

    // If day has no routes, create first route
    if (day.routes.length === 0) {
      addRoute(dayId, 'Ruta 1')
      // Wait for state update, then add place to the new route
      setTimeout(() => {
        const updatedDay = useTripStore.getState().days.find((d) => d.id === dayId)
        if (updatedDay && updatedDay.routes.length > 0) {
          addPlace(dayId, updatedDay.routes[0].id, newPlace)
        }
      }, 50)
    } else {
      // Add to last existing route
      const lastRoute = day.routes[day.routes.length - 1]
      addPlace(dayId, lastRoute.id, newPlace)
    }

    setSelectedSearchPin(null)
  }, [selectedSearchPin, days, addPlace, addRoute])

  // Handler for pin click to edit route
  const handlePinClick = (dayId: string, routeId: string, placeIndex: number, place: Place) => {
    const day = days.find((d) => d.id === dayId)
    if (!day) return

    const route = day.routes.find((r) => r.id === routeId)
    if (!route) return

    // If it's the last place in the route, can't edit route to next
    if (placeIndex >= route.places.length - 1) {
      onPlaceClick?.(place)
      return
    }

    const nextPlace = route.places[placeIndex + 1]
    setEditingRoute({
      dayId,
      routeId,
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


        {/* Render markers with numbers */}
        {days.map((day, dayIndex) => {
          const color = DAY_COLORS[dayIndex % DAY_COLORS.length]
          let globalPlaceIndex = 0

          return day.routes.map((route) =>
            route.places.map((place, placeIndex) => {
              const currentIndex = globalPlaceIndex++
              return (
                <Marker
                  key={place.id}
                  longitude={place.coordinates[0]}
                  latitude={place.coordinates[1]}
                  anchor="center"
                  draggable
                  onDragEnd={async (e) => {
                    const newCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat]
                    updatePlaceCoordinates(day.id, route.id, place.id, newCoords)

                    // Reverse geocode to get new place name
                    const locationInfo = await reverseGeocode(newCoords[0], newCoords[1])
                    if (locationInfo) {
                      updatePlaceInfo(day.id, route.id, place.id, locationInfo.name, locationInfo.address)
                    }
                  }}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    handlePinClick(day.id, route.id, placeIndex, place)
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
                    {currentIndex + 1}
                  </div>
                </Marker>
              )
            })
          )
        })}

        {/* Render POI markers (standalone pins) */}
        {days.map((day, dayIndex) => {
          const color = DAY_COLORS[dayIndex % DAY_COLORS.length]

          return (day.pointsOfInterest || []).map((poi) => (
            <Marker
              key={poi.id}
              longitude={poi.coordinates[0]}
              latitude={poi.coordinates[1]}
              anchor="bottom"
              draggable
              onDragEnd={async (e) => {
                const newCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat]
                updatePoiCoordinates(day.id, poi.id, newCoords)

                const locationInfo = await reverseGeocodePoi(newCoords[0], newCoords[1])
                if (locationInfo) {
                  // Si es manual, mantener el nombre original; solo actualizar la dirección
                  const nameToUse = poi.isManual ? poi.name : locationInfo.name
                  updatePoiInfo(day.id, poi.id, nameToUse, locationInfo.address)
                }
              }}
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                // Toggle: si el mismo POI ya está seleccionado, cerrar
                if (selectedPoi?.poi.id === poi.id && selectedPoi?.dayId === day.id) {
                  setSelectedPoi(null)
                } else {
                  setSelectedPoi({ dayId: day.id, poi })
                }
              }}
            >
              <div
                style={{
                  backgroundColor: color,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  padding: '6px 8px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  cursor: 'move',
                  maxWidth: 180,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title="Arrastra para mover • Click para editar"
              >
                {poi.name}
              </div>
            </Marker>
          ))
        })}

        {/* Render search pins (tourist exploration pins) */}
        {searchPins.map((pin) => (
          <Marker
            key={pin.id}
            longitude={pin.coordinates[0]}
            latitude={pin.coordinates[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              // Toggle: si el mismo pin ya está seleccionado, cerrar
              if (selectedSearchPin?.id === pin.id) {
                setSelectedSearchPin(null)
              } else {
                setSelectedSearchPin(pin)
              }
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              title={`${pin.name} - Click para agregar a un dia`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <svg
                width="32"
                height="40"
                viewBox="0 0 32 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 0C7.164 0 0 7.164 0 16c0 12 16 24 16 24s16-12 16-24c0-8.836-7.164-16-16-16z"
                  fill="#F97316"
                />
                <circle cx="16" cy="16" r="8" fill="white" />
                <circle cx="16" cy="16" r="4" fill="#F97316" />
              </svg>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Search Pin Popup */}
      {selectedSearchPin && (
        <>
          {/* Backdrop oscuro */}
          <div
            className="absolute inset-0 bg-black/40 z-20"
            onClick={() => setSelectedSearchPin(null)}
          />
          {/* Popup centrado */}
          <div
            className="absolute z-30"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <SearchPinPopup
              pin={selectedSearchPin}
              onClose={() => setSelectedSearchPin(null)}
              onAddToDay={handleAddSearchPinToDay}
            />
          </div>
        </>
      )}

      {/* POI Pin Popup */}
      {selectedPoi && (
        <>
          {/* Backdrop oscuro */}
          <div
            className="absolute inset-0 bg-black/40 z-20"
            onClick={() => setSelectedPoi(null)}
          />
          {/* Popup centrado */}
          <div
            className="absolute z-30"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <PoiPinPopup
              key={selectedPoi.poi.id}
              dayId={selectedPoi.dayId}
              poi={selectedPoi.poi}
              onClose={() => setSelectedPoi(null)}
            />
          </div>
        </>
      )}

      {/* Route Editor Panel */}
      {editingRoute && (
        <RouteEditor
          mapRef={mapRef.current}
          dayId={editingRoute.dayId}
          routeId={editingRoute.routeId}
          fromPlace={editingRoute.fromPlace}
          toPlace={editingRoute.toPlace}
          onClose={() => setEditingRoute(null)}
        />
      )}
    </div>
  )
})

MapView.displayName = 'MapView'
