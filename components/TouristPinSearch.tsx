'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, Search, X } from 'lucide-react'
import { useTripStore } from '@/hooks/useTripStore'

interface SearchResult {
  id: string
  place_name: string
  text: string
  mapbox_id: string
}

interface TouristPinSearchProps {
  onPinAdded?: (coordinates: [number, number]) => void
}

type Suggestion = {
  mapbox_id?: string
  full_address?: string
  address?: string
  place_formatted?: string
  name?: string
}

function isSuggestion(value: unknown): value is Suggestion {
  return typeof value === 'object' && value !== null
}

export function TouristPinSearch({ onPinAdded }: TouristPinSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionToken = useRef(`${Date.now()}-${Math.random()}`)

  const addSearchPin = useTripStore((state) => state.addSearchPin)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        // Use Mapbox Search Box API for better POI results (stadiums, museums, theaters, etc.)
        const response = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
            query
          )}&access_token=${token}&session_token=${sessionToken.current}&language=es&limit=5&types=poi`
        )
        const data = await response.json()

        // Transform Search API response to match our interface
        const suggestions: unknown[] = Array.isArray(data?.suggestions) ? data.suggestions : []

        const features = suggestions
          .filter(isSuggestion)
          .map((suggestion) => ({
            id: suggestion.mapbox_id ?? '',
            place_name:
              suggestion.full_address || suggestion.address || suggestion.place_formatted || '',
            text: suggestion.name || '',
            mapbox_id: suggestion.mapbox_id ?? '',
          }))
          .filter((f) => f.id && f.mapbox_id)
        setResults(features)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = async (result: SearchResult) => {
    setSelecting(true)
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      // Retrieve full place details including coordinates
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${result.mapbox_id}?access_token=${token}&session_token=${sessionToken.current}`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const coordinates: [number, number] = feature.geometry.coordinates
        const properties = feature.properties || {}

        addSearchPin({
          name: properties.name || result.text,
          coordinates,
          address: properties.full_address || properties.address || result.place_name,
          bbox: properties.bbox,
        })
        onPinAdded?.(coordinates)
      }
    } catch (error) {
      console.error('Retrieve error:', error)
    } finally {
      setSelecting(false)
      setQuery('')
      setResults([])
      setIsOpen(false)
      // Generate new session token for next search
      sessionToken.current = `${Date.now()}-${Math.random()}`
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        Buscar lugar turistico...
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ej: La Bombonera, Teatro Colón..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClose()
            }
          }}
          className="w-full pl-9 pr-8"
        />
        {loading || selecting ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <button
            onClick={handleClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto border rounded-md bg-background">
          {results.map((result) => (
            <button
              key={result.id}
              className="w-full text-left p-2 hover:bg-accent transition-colors block border-b last:border-b-0 disabled:opacity-50"
              onClick={() => handleSelect(result)}
              disabled={selecting}
            >
              <div className="flex items-start gap-2 cursor-pointer">
                <MapPin className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.text}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.place_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No se encontraron resultados
        </p>
      )}
    </div>
  )
}
