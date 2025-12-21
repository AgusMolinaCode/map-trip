// Database types for Supabase tables

export interface DbTrip {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface DbDay {
  id: string
  trip_id: string
  name: string
  day_color: string
  position: number
  created_at: string
}

export interface DbRoute {
  id: string
  day_id: string
  name: string | null
  route_profile: 'driving' | 'walking' | 'cycling' | 'driving-traffic'
  route_color: string | null
  distance_meters: number | null
  duration_seconds: number | null
  position: number
  created_at: string
}

export interface DbPlace {
  id: string
  route_id: string
  name: string
  address: string | null
  lng: number
  lat: number
  bbox_min_lng: number | null
  bbox_min_lat: number | null
  bbox_max_lng: number | null
  bbox_max_lat: number | null
  position: number
  created_at: string
}

export interface DbCustomRoute {
  id: string
  route_id: string
  from_place_id: string
  to_place_id: string
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  created_at: string
}

export interface DbPointOfInterest {
  id: string
  day_id: string
  name: string
  address: string | null
  note: string | null
  lng: number
  lat: number
  is_manual: boolean
  position: number
  created_at: string
}

export interface DbSearchPin {
  id: string
  trip_id: string
  name: string
  address: string | null
  lng: number
  lat: number
  bbox_min_lng: number | null
  bbox_min_lat: number | null
  bbox_max_lng: number | null
  bbox_max_lat: number | null
  created_at: string
}

// Full trip with all nested data
export interface DbTripWithData extends DbTrip {
  days: (DbDay & {
    routes: (DbRoute & {
      places: DbPlace[]
      custom_routes: DbCustomRoute[]
    })[]
    points_of_interest: DbPointOfInterest[]
  })[]
  search_pins: DbSearchPin[]
}
