import { useState, useEffect } from 'react'
import { lineString } from '@turf/turf'
import type { Feature, LineString } from 'geojson'

interface RouteOptions {
  coordinates: [number, number][]
  profile?: 'driving' | 'walking' | 'cycling' | 'driving-traffic'
}

interface RouteResult {
  geometry: Feature<LineString> | null
  distance?: number // in meters
  duration?: number // in seconds
  loading: boolean
  error: string | null
}

export function useMapboxRoute({ coordinates, profile = 'driving' }: RouteOptions): RouteResult {
  const [geometry, setGeometry] = useState<Feature<LineString> | null>(null)
  const [distance, setDistance] = useState<number | undefined>()
  const [duration, setDuration] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Need at least 2 points to create a route
    if (coordinates.length < 2) {
      setGeometry(null)
      setDistance(undefined)
      setDuration(undefined)
      return
    }

    const fetchRoute = async () => {
      setLoading(true)
      setError(null)

      try {
        const coordinatesString = coordinates
          .map((coord) => `${coord[0]},${coord[1]}`)
          .join(';')

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}?geometries=geojson&overview=full&access_token=${token}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch route')
        }

        const data = await response.json()

        if (!data.routes || data.routes.length === 0) {
          // Fallback to straight line if no route found
          const straightLine = lineString(coordinates)
          setGeometry(straightLine)
          setDistance(undefined)
          setDuration(undefined)
          setError('No route found, showing straight line')
        } else {
          const route = data.routes[0]

          // Create GeoJSON feature from the route geometry
          const routeFeature: Feature<LineString> = {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          }

          setGeometry(routeFeature)
          setDistance(route.distance)
          setDuration(route.duration)
        }
      } catch (err) {
        console.error('Error fetching route:', err)
        // Fallback to straight line on error
        const straightLine = lineString(coordinates)
        setGeometry(straightLine)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(coordinates), profile])

  return { geometry, distance, duration, loading, error }
}
