'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MapPin, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  place_name: string
  center: [number, number]
  text: string
  bbox?: [number, number, number, number]
}

interface PlaceSearchProps {
  onSelect: (place: { name: string; coordinates: [number, number]; address: string; bbox?: [number, number, number, number] }) => void
  onClose: () => void
}

export function PlaceSearch({ onSelect, onClose }: PlaceSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${token}&limit=5&autocomplete=true`
        )
        const data = await response.json()
        setResults(data.features || [])
      } catch (error) {
        console.error('Geocoding error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    onSelect({
      name: result.text,
      coordinates: result.center,
      address: result.place_name,
      bbox: result.bbox,
    })
    onClose()
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a place..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose()
            }
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {results.length > 0 && (
        <Card className="p-2 max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
              onClick={() => handleSelect(result)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.text}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.place_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  )
}
