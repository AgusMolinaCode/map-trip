'use client'

import { useEffect, useRef } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Trash2, Car, Bike, Footprints, Clock, Ruler, Info, CheckCircle, RotateCcw } from 'lucide-react'
import { useTripStore, type Place, type RouteProfile } from '@/hooks/useTripStore'
import type { MapRef } from 'react-map-gl/mapbox'
import type { IControl } from 'mapbox-gl'

interface RouteEditorProps {
  mapRef: MapRef | null
  dayId: string
  routeId: string
  fromPlace: Place
  toPlace: Place
  onClose: () => void
}

export function RouteEditor({ mapRef, dayId, routeId, fromPlace, toPlace, onClose }: RouteEditorProps) {
  const drawRef = useRef<MapboxDraw | null>(null)
  const setCustomRoute = useTripStore((state) => state.setCustomRoute)
  const removeCustomRoute = useTripStore((state) => state.removeCustomRoute)
  const day = useTripStore((state) => state.days.find((d) => d.id === dayId))
  const route = day?.routes.find((r) => r.id === routeId)

  // Check if there's an existing custom route
  const existingRoute = route?.customRoutes?.find(
    (r) => r.fromPlaceId === fromPlace.id && r.toPlaceId === toPlace.id
  )

  useEffect(() => {
    if (!mapRef) return

    const map = mapRef.getMap()

    // Initialize draw control
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true,
      },
      styles: [
        // Custom styling for the draw line
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#3B82F6',
            'line-width': 4,
          },
        },
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#fff',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#3B82F6',
          },
        },
      ],
    })

    map.addControl(draw as unknown as IControl)
    drawRef.current = draw

    // If there's an existing custom route, load it
    if (existingRoute) {
      const feature = {
        type: 'Feature' as const,
        properties: {},
        geometry: existingRoute.geometry,
      }
      draw.add(feature)
    }

    // Auto-save on draw events
    const handleDrawUpdate = () => {
      const data = drawRef.current?.getAll()
      const lineFeature = data?.features.find((f) => f.geometry.type === 'LineString')

      if (lineFeature && lineFeature.geometry.type === 'LineString') {
        setCustomRoute(dayId, routeId, {
          fromPlaceId: fromPlace.id,
          toPlaceId: toPlace.id,
          geometry: {
            type: 'LineString',
            coordinates: lineFeature.geometry.coordinates as [number, number][]
          }
        })
      }
    }

    const handleDrawDelete = () => {
      if (existingRoute) {
        removeCustomRoute(dayId, routeId, fromPlace.id, toPlace.id)
      }
    }

    map.on('draw.create', handleDrawUpdate)
    map.on('draw.update', handleDrawUpdate)
    map.on('draw.delete', handleDrawDelete)

    return () => {
      map.off('draw.create', handleDrawUpdate)
      map.off('draw.update', handleDrawUpdate)
      map.off('draw.delete', handleDrawDelete)
      if (drawRef.current) {
        map.removeControl(drawRef.current as unknown as IControl)
        drawRef.current = null
      }
    }
  }, [mapRef, existingRoute, dayId, routeId, fromPlace.id, toPlace.id, setCustomRoute, removeCustomRoute])

  const handleUseAutomatic = () => {
    if (existingRoute) {
      removeCustomRoute(dayId, routeId, fromPlace.id, toPlace.id)
    }
    onClose()
  }

  // Formatting utilities
  const formatDistance = (meters?: number): string => {
    if (!meters) return 'Calculando...'
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Calculando...'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`
  }

  const getTravelModeIcon = (profile: RouteProfile) => {
    switch (profile) {
      case 'driving':
        return <Car className="h-5 w-5 text-blue-600" />
      case 'driving-traffic':
        return (
          <div className="flex items-center gap-1">
            <Car className="h-5 w-5 text-blue-600" />
            <Clock className="h-3 w-3 text-orange-500" />
          </div>
        )
      case 'walking':
        return <Footprints className="h-5 w-5 text-green-600" />
      case 'cycling':
        return <Bike className="h-5 w-5 text-purple-600" />
    }
  }

  const getTravelModeLabel = (profile: RouteProfile) => {
    switch (profile) {
      case 'driving':
        return 'Conduciendo'
      case 'driving-traffic':
        return 'Conduciendo (tráfico)'
      case 'walking':
        return 'Caminando'
      case 'cycling':
        return 'Bicicleta'
    }
  }

  return (
    <Card className="absolute top-5 right-4 z-10 p-5 w-96 shadow-lg bg-white/95 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Información de Ruta</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Travel Mode Badge */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          {route && getTravelModeIcon(route.routeProfile)}
          <div>
            <p className="text-xs text-gray-600">Modo de viaje</p>
            <p className="font-semibold text-gray-900">
              {route ? getTravelModeLabel(route.routeProfile) : 'Cargando...'}
            </p>
          </div>
        </div>

        {/* Route Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Ruler className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Distancia</p>
              <p className="font-semibold text-gray-900">
                {formatDistance(route?.routeStats?.distance)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Duración</p>
              <p className="font-semibold text-gray-900">
                {formatDuration(route?.routeStats?.duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Custom Route Status */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
          {existingRoute ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">Ruta personalizada activa</span>
            </>
          ) : (
            <>
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">Ruta automática (Mapbox)</span>
            </>
          )}
        </div>

        {/* Place Names */}
        <div className="text-sm text-gray-600 space-y-1 pb-4 border-b">
          <p><strong>Desde:</strong> {fromPlace.name}</p>
          <p><strong>Hasta:</strong> {toPlace.name}</p>
        </div>

        {/* Edit Controls */}
        <div className="space-y-2">
          {existingRoute && (
            <Button
              onClick={handleUseAutomatic}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Usar Ruta Automática
            </Button>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 pt-2 border-t space-y-1">
            <p>💡 Haz clic en el mapa para dibujar una ruta personalizada</p>
            <p>💡 Los cambios se guardan automáticamente</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
