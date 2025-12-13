'use client'

import { useEffect, useRef } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Check, Trash2 } from 'lucide-react'
import { useTripStore, type Place } from '@/hooks/useTripStore'
import type { MapRef } from 'react-map-gl/mapbox'

interface RouteEditorProps {
  mapRef: MapRef | null
  dayId: string
  fromPlace: Place
  toPlace: Place
  onClose: () => void
}

export function RouteEditor({ mapRef, dayId, fromPlace, toPlace, onClose }: RouteEditorProps) {
  const drawRef = useRef<MapboxDraw | null>(null)
  const setCustomRoute = useTripStore((state) => state.setCustomRoute)
  const removeCustomRoute = useTripStore((state) => state.removeCustomRoute)
  const day = useTripStore((state) => state.days.find((d) => d.id === dayId))

  // Check if there's an existing custom route
  const existingRoute = day?.customRoutes?.find(
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

    map.addControl(draw as any)
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

    return () => {
      if (drawRef.current) {
        map.removeControl(drawRef.current as any)
        drawRef.current = null
      }
    }
  }, [mapRef, existingRoute])

  const handleSave = () => {
    if (!drawRef.current) return

    const data = drawRef.current.getAll()
    if (data.features.length === 0) {
      alert('Por favor dibuja una ruta en el mapa')
      return
    }

    // Get the first LineString feature
    const lineFeature = data.features.find((f) => f.geometry.type === 'LineString')
    if (!lineFeature || lineFeature.geometry.type !== 'LineString') {
      alert('Por favor dibuja una línea en el mapa')
      return
    }

    // Save the custom route
    setCustomRoute(dayId, {
      fromPlaceId: fromPlace.id,
      toPlaceId: toPlace.id,
      geometry: {
        type: 'LineString',
        coordinates: lineFeature.geometry.coordinates as [number, number][],
      },
    })

    onClose()
  }

  const handleDelete = () => {
    if (existingRoute) {
      removeCustomRoute(dayId, fromPlace.id, toPlace.id)
    }
    onClose()
  }

  const handleUseAutomatic = () => {
    if (existingRoute) {
      removeCustomRoute(dayId, fromPlace.id, toPlace.id)
    }
    onClose()
  }

  return (
    <Card className="absolute top-4 left-4 z-10 p-4 w-80 shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Editar Ruta</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Desde:</strong> {fromPlace.name}
          </p>
          <p>
            <strong>Hasta:</strong> {toPlace.name}
          </p>
        </div>

        <div className="text-sm">
          {existingRoute ? (
            <p className="text-green-600">✓ Ruta personalizada activa</p>
          ) : (
            <p className="text-muted-foreground">
              Dibuja una línea en el mapa para crear una ruta personalizada
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleSave} className="w-full">
            <Check className="h-4 w-4 mr-2" />
            Guardar Ruta
          </Button>

          {existingRoute && (
            <>
              <Button onClick={handleUseAutomatic} variant="outline" className="w-full">
                Usar Ruta Automática
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Ruta
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-2">
          <p>💡 Haz clic en el mapa para agregar puntos a la ruta</p>
          <p>💡 Arrastra los puntos para ajustar la ruta</p>
        </div>
      </div>
    </Card>
  )
}
