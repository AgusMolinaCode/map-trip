'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, MapPinPlus } from 'lucide-react'
import { validateManualPoi } from '@/lib/validaciones'
import { useTripContext } from '@/contexts/TripContext'

interface ManualPoiFormProps {
  onSave: (data: { name: string; coordinates: [number, number]; note?: string; isManual: true }) => void
  onCancel: () => void
}

export function ManualPoiForm({ onSave, onCancel }: ManualPoiFormProps) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { getMapCenter } = useTripContext()

  const handleSave = () => {
    const center = getMapCenter()
    if (!center) return

    const result = validateManualPoi({
      name: name.trim(),
      note: note.trim() || undefined,
    })

    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    onSave({
      name: result.data.name,
      coordinates: center,
      note: result.data.note,
      isManual: true,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground font-medium">
          Colocar pin en el centro del mapa:
        </p>
      </div>
      <div className="space-y-2">
        <div>
          <Input
            placeholder="Nombre del lugar *"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(null)
            }}
            className={`text-sm ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <Input
          placeholder="Nota o comentario (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-sm"
        />
        <Button
          size="sm"
          className="w-full bg-orange-100 hover:bg-orange-200 cursor-pointer border-orange-300 text-orange-800 border"
          onClick={handleSave}
        >
          <MapPinPlus className="h-4 w-4 mr-2" />
          Crear pin en centro del mapa
        </Button>
      </div>
    </div>
  )
}
