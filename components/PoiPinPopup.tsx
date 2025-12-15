'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Save, Trash2, X, Eraser } from 'lucide-react'
import { useTripStore, type PointOfInterest } from '@/hooks/useTripStore'

interface PoiPinPopupProps {
  dayId: string
  poi: PointOfInterest
  onClose: () => void
}

export function PoiPinPopup({ dayId, poi, onClose }: PoiPinPopupProps) {
  const updatePoiInfo = useTripStore((s) => s.updatePoiInfo)
  const removePointOfInterest = useTripStore((s) => s.removePointOfInterest)

  const [name, setName] = useState(poi.name)
  const [note, setNote] = useState(poi.note ?? '')

  const canSave = useMemo(() => name.trim().length > 0, [name])

  const handleSave = () => {
    if (!canSave) return

    const state = useTripStore.getState()
    const day = state.days.find((d) => d.id === dayId)
    const existing = day?.pointsOfInterest.find((p) => p.id === poi.id)
    updatePoiInfo(dayId, poi.id, name.trim(), existing?.address ?? '')

    useTripStore.setState((prev) => ({
      days: prev.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              pointsOfInterest: d.pointsOfInterest.map((p) =>
                p.id === poi.id ? { ...p, note: note.trim() || undefined } : p
              ),
            }
          : d
      ),
    }))

    onClose()
  }

  const handleDelete = () => {
    removePointOfInterest(dayId, poi.id)
    onClose()
  }

  const handleClearNote = () => {
    setNote('')
    useTripStore.setState((prev) => ({
      days: prev.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              pointsOfInterest: d.pointsOfInterest.map((p) =>
                p.id === poi.id ? { ...p, note: undefined } : p
              ),
            }
          : d
      ),
    }))
  }

  return (
    <Card className="w-72 p-3 shadow-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <MapPin className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">Punto de interés</p>
            {poi.address && (
              <p className="text-xs text-muted-foreground truncate">{poi.address}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Nombre</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mirador" />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Comentario (opcional)</p>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: sacar fotos al atardecer" />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleSave}
            disabled={!canSave}
          >
            <Save className="h-3 w-3 mr-1" />
            Guardar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearNote}
            title="Quitar comentario"
          >
            <Eraser className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            title="Eliminar pin"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
