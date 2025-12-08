'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTripStore, type Place, type Day } from '@/hooks/useTripStore'

// Day colors for markers and routes
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

export const MapView = forwardRef<MapViewRef, MapViewProps>(({ onPlaceClick }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const routeLayers = useRef<Set<string>>(new Set())

  const days = useTripStore((state) => state.days)
  const updateRouteStats = useTripStore((state) => state.updateRouteStats)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!mapboxToken) {
      console.error('Mapbox token not found')
      return
    }

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update markers and routes when days change
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current.clear()

    // Clear existing route layers
    routeLayers.current.forEach((layerId) => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId)
      }
      const sourceId = layerId.replace('-layer', '-source')
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId)
      }
    })
    routeLayers.current.clear()

    // Add markers for each place
    days.forEach((day, dayIndex) => {
      const color = DAY_COLORS[dayIndex % DAY_COLORS.length]

      day.places.forEach((place) => {
        const el = document.createElement('div')
        el.className = 'marker'
        el.style.backgroundColor = color
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.borderRadius = '50%'
        el.style.border = '2px solid white'
        el.style.cursor = 'pointer'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

        const marker = new mapboxgl.Marker(el)
          .setLngLat(place.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="font-semibold">${place.name}</div><div class="text-sm text-gray-600">${day.name}</div>`
            )
          )
          .addTo(map.current!)

        el.addEventListener('click', () => {
          onPlaceClick?.(place)
        })

        markers.current.set(place.id, marker)
      })

      // Draw route for this day if it has multiple places
      if (day.places.length > 1) {
        drawRoute(day, dayIndex, color)
      }
    })

    // Fit map to show all markers
    if (days.some((day) => day.places.length > 0)) {
      const bounds = new mapboxgl.LngLatBounds()
      days.forEach((day) => {
        day.places.forEach((place) => {
          bounds.extend(place.coordinates)
        })
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [days, onPlaceClick, updateRouteStats])

  const drawRoute = async (day: Day, dayIndex: number, color: string) => {
    if (!map.current || day.places.length < 2) return

    const sourceId = `route-${day.id}-source`
    const layerId = `route-${day.id}-layer`

    try {
      // Get route from Mapbox Directions API
      const coordinates = day.places.map((p) => p.coordinates)
      const coordinatesString = coordinates
        .map((coord) => `${coord[0]},${coord[1]}`)
        .join(';')

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const profile = day.routeProfile || 'driving'

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}?geometries=geojson&overview=full&access_token=${mapboxToken}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch route')
      }

      const data = await response.json()

      if (!data.routes || data.routes.length === 0) {
        console.warn('No route found for day:', day.name)
        return
      }

      const route = data.routes[0]
      const geometry = route.geometry

      // Update route stats in store
      updateRouteStats(day.id, {
        distance: route.distance,
        duration: route.duration,
      })

      // Add route source
      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: geometry,
          },
        })
      } else {
        // Update existing source
        const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: geometry,
        })
      }

      // Add route layer
      if (!map.current.getLayer(layerId)) {
        map.current.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': 4,
            'line-opacity': 0.75,
          },
        })

        routeLayers.current.add(layerId)
      }
    } catch (error) {
      console.error('Error drawing route:', error)
      // Fallback to straight line if API fails
      drawStraightLine(day, color, sourceId, layerId)
    }
  }

  const drawStraightLine = (
    day: Day,
    color: string,
    sourceId: string,
    layerId: string
  ) => {
    if (!map.current) return

    const coordinates = day.places.map((p) => p.coordinates)

    if (!map.current.getSource(sourceId)) {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      })
    }

    if (!map.current.getLayer(layerId)) {
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': 3,
          'line-opacity': 0.7,
        },
      })

      routeLayers.current.add(layerId)
    }
  }

  // Fly to place
  const flyToPlace = (place: Place) => {
    if (!map.current) return
    map.current.flyTo({
      center: place.coordinates,
      zoom: 14,
      essential: true,
    })
  }

  // Expose flyTo method via ref
  useImperativeHandle(ref, () => ({
    flyToPlace,
  }))

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
})

MapView.displayName = 'MapView'
