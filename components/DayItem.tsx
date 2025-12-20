'use client'

import { useState } from 'react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { PlaceSearch } from '@/components/PlaceSearch'
import { Trash2, ArrowLeft, MapPinPlus, Plus, Palette } from 'lucide-react'
import { useTripStore, ROUTE_PASTEL_COLORS, type Day, type Place } from '@/hooks/useTripStore'
import {
  RouteSection,
  ManualPoiForm,
  AddButtons,
  PoiList,
} from '@/components/dashboardUI'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DayItemProps {
  day: Day
  dayIndex: number
  onPlaceClick: (place: Place) => void
}

export function DayItem({ day, dayIndex, onPlaceClick }: DayItemProps) {
  // Estado para agregar lugares a rutas específicas
  const [addingPlaceToRouteId, setAddingPlaceToRouteId] = useState<string | null>(null)
  const [isAddingPoi, setIsAddingPoi] = useState(false)
  const [isAddingManualPoi, setIsAddingManualPoi] = useState(false)

  const removeDay = useTripStore((state) => state.removeDay)
  const addRoute = useTripStore((state) => state.addRoute)
  const removeRoute = useTripStore((state) => state.removeRoute)
  const addPlace = useTripStore((state) => state.addPlace)
  const addPointOfInterest = useTripStore((state) => state.addPointOfInterest)
  const removePointOfInterest = useTripStore((state) => state.removePointOfInterest)
  const setDayColor = useTripStore((state) => state.setDayColor)

  const dayColor = day.dayColor || ROUTE_PASTEL_COLORS[0]

  // Calcular total de items (todos los lugares de todas las rutas + POIs)
  const totalPlaces = day.routes.reduce((sum, route) => sum + route.places.length, 0)
  const totalItems = totalPlaces + (day.pointsOfInterest?.length || 0)

  // Manejo de agregar lugar a ruta específica
  const handleStartAddingPlace = () => {
    if (day.routes.length === 0) {
      // Si no hay rutas, crear la primera automáticamente
      addRoute(day.id, 'Ruta 1')
      // Esperar un poco para que se actualice el estado
      setTimeout(() => {
        const route = useTripStore.getState().days.find(d => d.id === day.id)?.routes[0]
        if (route) {
          setAddingPlaceToRouteId(route.id)
        }
      }, 50)
    } else {
      // Si ya hay rutas, agregar a la última ruta
      const lastRoute = day.routes[day.routes.length - 1]
      setAddingPlaceToRouteId(lastRoute.id)
    }
  }

  const handleAddPlace = (place: { name: string; coordinates: [number, number]; address: string }) => {
    if (!addingPlaceToRouteId) return
    addPlace(day.id, addingPlaceToRouteId, { id: crypto.randomUUID(), ...place })
    setAddingPlaceToRouteId(null)
  }

  const handleAddNewRoute = () => {
    addRoute(day.id)
    // Abrir formulario para agregar lugar a la nueva ruta
    setTimeout(() => {
      const route = useTripStore.getState().days.find(d => d.id === day.id)?.routes.slice(-1)[0]
      if (route) {
        setAddingPlaceToRouteId(route.id)
      }
    }, 50)
  }

  const handleAddPoi = (place: { name: string; coordinates: [number, number]; address: string }) => {
    addPointOfInterest(day.id, place)
    setIsAddingPoi(false)
  }

  const handleSaveManualPoi = (data: { name: string; coordinates: [number, number]; note?: string; isManual: true }) => {
    addPointOfInterest(day.id, data)
    setIsAddingManualPoi(false)
  }

  // Verificar si hay lugares en alguna ruta
  const hasPlacesInRoutes = day.routes.some(route => route.places.length > 0)
  const hasPointsOfInterest = (day.pointsOfInterest?.length || 0) > 0

  // Renderizado de sección de agregar lugares
  const renderAddPlaceSection = () => {
    if (addingPlaceToRouteId) {
      const route = day.routes.find(r => r.id === addingPlaceToRouteId)
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAddingPlaceToRouteId(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground font-medium">
              Agregar destino a {route?.name || 'Ruta'}:
            </p>
          </div>
          <PlaceSearch onSelect={handleAddPlace} onClose={() => setAddingPlaceToRouteId(null)} />
        </div>
      )
    }

    if (isAddingManualPoi) {
      return (
        <ManualPoiForm
          onSave={handleSaveManualPoi}
          onCancel={() => setIsAddingManualPoi(false)}
        />
      )
    }

    if (isAddingPoi) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsAddingPoi(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground font-medium">Agregar punto de interes:</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <PlaceSearch onSelect={handleAddPoi} onClose={() => setIsAddingPoi(false)} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 border-orange-300 text-orange-600 hover:bg-orange-50 flex-shrink-0 bg-gray-100"
              onClick={() => { setIsAddingPoi(false); setIsAddingManualPoi(true) }}
              title="Colocar manualment"
            >
              <MapPinPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

    // Si ya hay POIs, no mostrar nada aquí (se mostrará abajo)
    if (hasPointsOfInterest) {
      return null
    }

    // Si hay lugares en alguna ruta pero NO hay POIs, solo mostrar botón POI
    if (hasPlacesInRoutes) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="w-full hover:shadow-md hover:cursor-pointer text-xs text-white hover:text-white active:text-white hover:opacity-90"
          style={{ backgroundColor: dayColor, borderColor: dayColor }}
          onClick={() => setIsAddingPoi(true)}
        >
          <MapPinPlus className="h-3 w-3 mr-1" />
          Punto interes
        </Button>
      )
    }

    // Si no hay lugares en ninguna ruta y no hay POIs, mostrar ambos botones
    return (
      <AddButtons
        onAddPlace={handleStartAddingPlace}
        onAddPoi={() => setIsAddingPoi(true)}
        dayColor={dayColor}
      />
    )
  }

  return (
    <AccordionItem value={day.id}>
      <AccordionTrigger className="hover:no-underline group">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dayColor }} />
          <span className="font-semibold">{day.name}</span>
          <span className="text-xs text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'lugar' : 'lugares'}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div
              className="h-6 w-6 p-1 text-white cursor-pointer mr-2 inline-flex items-center justify-center rounded-full hover:opacity-90 transition-all"
              style={{ backgroundColor: dayColor }}
              title="Cambiar color del día"
              role="button"
              tabIndex={0}
            >
              <Palette className="h-3 w-3" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-36 bg-gray-500/80">
            <div className="grid grid-cols-4 gap-1 p-2 ">
              {ROUTE_PASTEL_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-7 w-7 rounded border-2 hover:border-foreground transition-colors"
                  style={{
                    backgroundColor: color,
                    borderColor: day.dayColor === color ? '#000' : '#d1d5db'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDayColor(day.id, color)
                  }}
                  title={color}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          {/* Botones para agregar destino/POI */}
          {renderAddPlaceSection()}

          {/* Renderizar todas las rutas */}
          {day.routes.length > 0 && (
            <div className="space-y-3">
              {day.routes.map((route, index) => (
                <RouteSection
                  key={route.id}
                  dayId={day.id}
                  route={route}
                  routeIndex={index}
                  dayColor={dayColor}
                  onPlaceClick={onPlaceClick}
                  onRemove={() => removeRoute(day.id, route.id)}
                />
              ))}
            </div>
          )}

          {/* Botón agregar nueva ruta (solo si ya hay al menos una ruta) */}
          {day.routes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs cursor-pointer hover:shadow-md text-white hover:text-white active:text-white hover:opacity-90"
              style={{ backgroundColor: dayColor, borderColor: dayColor }}
              onClick={handleAddNewRoute}
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar nueva ruta
            </Button>
          )}

          {/* Points of Interest */}
          <PoiList
            pois={day.pointsOfInterest}
            onPoiClick={onPlaceClick}
            onRemove={(poiId) => removePointOfInterest(day.id, poiId)}
            dayColor={dayColor}
          />

          {/* Botones cuando ya hay POIs */}
          {hasPointsOfInterest && (
            <div className="flex gap-2">
              {/* Botón Agregar destino (solo si no hay lugares en rutas) */}
              {!hasPlacesInRoutes && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:shadow-md hover:cursor-pointer text-xs text-white hover:text-white active:text-white"
                  style={{ backgroundColor: dayColor, borderColor: dayColor }}
                  onClick={handleStartAddingPlace}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar destino
                </Button>
              )}
              {/* Botón Punto interes */}
              <Button
                variant="outline"
                size="sm"
                className={`${!hasPlacesInRoutes ? 'flex-1' : 'w-full'} hover:shadow-md hover:cursor-pointer text-xs text-white hover:text-white active:text-white`}
                style={{ backgroundColor: dayColor, borderColor: dayColor }}
                onClick={() => setIsAddingPoi(true)}
              >
                <MapPinPlus className="h-3 w-3 mr-1" />
                Punto interes
              </Button>
            </div>
          )}

          {/* Empty state */}
          {totalItems === 0 && !addingPlaceToRouteId && !isAddingPoi && !isAddingManualPoi && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se añadieron lugares aún.
            </p>
          )}

          {/* Delete day button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:cursor-pointer bg-red-100 hover:bg-red-200 border-red-400 border"
            onClick={() => removeDay(day.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar día
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
