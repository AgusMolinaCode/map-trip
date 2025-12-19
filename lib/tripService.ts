import { supabase } from './supabase'
import type {
  DbTrip,
  DbDay,
  DbRoute,
  DbPlace,
  DbCustomRoute,
  DbPointOfInterest,
  DbSearchPin,
} from '@/types/supabase'
import type {
  Day,
  Route,
  Place,
  CustomRoute,
  PointOfInterest,
  SearchPin,
  RouteProfile,
} from '@/hooks/useTripStore'

// ============================================
// Conversion helpers: DB -> Zustand
// ============================================

function dbPlaceToZustand(dbPlace: DbPlace): Place {
  return {
    id: dbPlace.id,
    name: dbPlace.name,
    coordinates: [dbPlace.lng, dbPlace.lat],
    address: dbPlace.address || undefined,
    bbox: dbPlace.bbox_min_lng !== null &&
      dbPlace.bbox_min_lat !== null &&
      dbPlace.bbox_max_lng !== null &&
      dbPlace.bbox_max_lat !== null
      ? [dbPlace.bbox_min_lng, dbPlace.bbox_min_lat, dbPlace.bbox_max_lng, dbPlace.bbox_max_lat]
      : undefined,
  }
}

function dbCustomRouteToZustand(dbCustomRoute: DbCustomRoute): CustomRoute {
  return {
    fromPlaceId: dbCustomRoute.from_place_id,
    toPlaceId: dbCustomRoute.to_place_id,
    geometry: dbCustomRoute.geometry,
  }
}

function dbRouteToZustand(
  dbRoute: DbRoute,
  places: DbPlace[],
  customRoutes: DbCustomRoute[]
): Route {
  return {
    id: dbRoute.id,
    name: dbRoute.name || undefined,
    places: places
      .sort((a, b) => a.position - b.position)
      .map(dbPlaceToZustand),
    routeProfile: dbRoute.route_profile as RouteProfile,
    routeStats: dbRoute.distance_meters !== null || dbRoute.duration_seconds !== null
      ? {
          distance: dbRoute.distance_meters || undefined,
          duration: dbRoute.duration_seconds || undefined,
        }
      : undefined,
    customRoutes: customRoutes.length > 0 ? customRoutes.map(dbCustomRouteToZustand) : undefined,
    routeColor: dbRoute.route_color || undefined,
  }
}

function dbPoiToZustand(dbPoi: DbPointOfInterest): PointOfInterest {
  return {
    id: dbPoi.id,
    name: dbPoi.name,
    coordinates: [dbPoi.lng, dbPoi.lat],
    address: dbPoi.address || undefined,
    note: dbPoi.note || undefined,
    isManual: dbPoi.is_manual || undefined,
  }
}

function dbDayToZustand(
  dbDay: DbDay,
  routes: (DbRoute & { places: DbPlace[]; customRoutes: DbCustomRoute[] })[],
  pois: DbPointOfInterest[]
): Day {
  return {
    id: dbDay.id,
    name: dbDay.name,
    routes: routes
      .sort((a, b) => a.position - b.position)
      .map((r) => dbRouteToZustand(r, r.places, r.customRoutes)),
    pointsOfInterest: pois
      .sort((a, b) => a.position - b.position)
      .map(dbPoiToZustand),
    dayColor: dbDay.day_color || undefined,
  }
}

function dbSearchPinToZustand(dbPin: DbSearchPin): SearchPin {
  return {
    id: dbPin.id,
    name: dbPin.name,
    coordinates: [dbPin.lng, dbPin.lat],
    address: dbPin.address || undefined,
    bbox: dbPin.bbox_min_lng !== null &&
      dbPin.bbox_min_lat !== null &&
      dbPin.bbox_max_lng !== null &&
      dbPin.bbox_max_lat !== null
      ? [dbPin.bbox_min_lng, dbPin.bbox_min_lat, dbPin.bbox_max_lng, dbPin.bbox_max_lat]
      : undefined,
  }
}

// ============================================
// CRUD Operations
// ============================================

// Trip operations
export async function createTrip(name: string = 'Mi Viaje'): Promise<DbTrip | null> {
  const { data, error } = await supabase
    .from('trips')
    .insert({ name })
    .select()
    .single()

  if (error) {
    console.error('Error creating trip:', error.message, error.code, error.details)
    return null
  }

  return data
}

export async function getTrip(tripId: string): Promise<DbTrip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (error) {
    console.error('Error getting trip:', error)
    return null
  }

  return data
}

export async function getFirstTrip(): Promise<DbTrip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    // No trip exists yet
    return null
  }

  return data
}

// Load full trip with all nested data
export async function loadFullTrip(tripId: string): Promise<{
  days: Day[]
  searchPins: SearchPin[]
} | null> {
  // Fetch all data in parallel
  const [daysResult, searchPinsResult] = await Promise.all([
    supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('position'),
    supabase
      .from('search_pins')
      .select('*')
      .eq('trip_id', tripId),
  ])

  if (daysResult.error) {
    console.error('Error loading days:', daysResult.error)
    return null
  }

  const days = daysResult.data as DbDay[]
  const searchPins = (searchPinsResult.data || []) as DbSearchPin[]

  if (days.length === 0) {
    return {
      days: [],
      searchPins: searchPins.map(dbSearchPinToZustand),
    }
  }

  // Fetch routes for all days
  const dayIds = days.map((d) => d.id)
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select('*')
    .in('day_id', dayIds)
    .order('position')

  if (routesError) {
    console.error('Error loading routes:', routesError)
    return null
  }

  const dbRoutes = (routes || []) as DbRoute[]

  // Fetch places and custom routes for all routes
  const routeIds = dbRoutes.map((r) => r.id)

  let dbPlaces: DbPlace[] = []
  let dbCustomRoutes: DbCustomRoute[] = []

  if (routeIds.length > 0) {
    const [placesResult, customRoutesResult] = await Promise.all([
      supabase
        .from('places')
        .select('*')
        .in('route_id', routeIds)
        .order('position'),
      supabase
        .from('custom_routes')
        .select('*')
        .in('route_id', routeIds),
    ])

    dbPlaces = (placesResult.data || []) as DbPlace[]
    dbCustomRoutes = (customRoutesResult.data || []) as DbCustomRoute[]
  }

  // Fetch POIs for all days
  const { data: pois } = await supabase
    .from('points_of_interest')
    .select('*')
    .in('day_id', dayIds)
    .order('position')

  const dbPois = (pois || []) as DbPointOfInterest[]

  // Assemble the data
  const assembledDays: Day[] = days.map((day) => {
    const dayRoutes = dbRoutes.filter((r) => r.day_id === day.id)
    const routesWithData = dayRoutes.map((route) => ({
      ...route,
      places: dbPlaces.filter((p) => p.route_id === route.id),
      customRoutes: dbCustomRoutes.filter((cr) => cr.route_id === route.id),
    }))
    const dayPois = dbPois.filter((p) => p.day_id === day.id)

    return dbDayToZustand(day, routesWithData, dayPois)
  })

  return {
    days: assembledDays,
    searchPins: searchPins.map(dbSearchPinToZustand),
  }
}

// Day operations
export async function saveDay(
  tripId: string,
  day: Day,
  position: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('days')
    .upsert({
      id: day.id,
      trip_id: tripId,
      name: day.name,
      day_color: day.dayColor || '#EF4444',
      position,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving day:', error)
    return null
  }

  return data.id
}

export async function deleteDay(dayId: string): Promise<boolean> {
  const { error } = await supabase
    .from('days')
    .delete()
    .eq('id', dayId)

  if (error) {
    console.error('Error deleting day:', error)
    return false
  }

  return true
}

// Route operations
export async function saveRoute(
  dayId: string,
  route: Route,
  position: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('routes')
    .upsert({
      id: route.id,
      day_id: dayId,
      name: route.name || null,
      route_profile: route.routeProfile,
      route_color: route.routeColor || null,
      distance_meters: route.routeStats?.distance || null,
      duration_seconds: route.routeStats?.duration || null,
      position,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving route:', error)
    return null
  }

  return data.id
}

export async function deleteRoute(routeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', routeId)

  if (error) {
    console.error('Error deleting route:', error)
    return false
  }

  return true
}

// Place operations
export async function savePlace(
  routeId: string,
  place: Place,
  position: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('places')
    .upsert({
      id: place.id,
      route_id: routeId,
      name: place.name,
      address: place.address || null,
      lng: place.coordinates[0],
      lat: place.coordinates[1],
      bbox_min_lng: place.bbox?.[0] || null,
      bbox_min_lat: place.bbox?.[1] || null,
      bbox_max_lng: place.bbox?.[2] || null,
      bbox_max_lat: place.bbox?.[3] || null,
      position,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving place:', error)
    return null
  }

  return data.id
}

export async function deletePlace(placeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', placeId)

  if (error) {
    console.error('Error deleting place:', error)
    return false
  }

  return true
}

// Custom route operations
export async function saveCustomRoute(
  routeId: string,
  customRoute: CustomRoute
): Promise<boolean> {
  // First delete existing custom route for this segment
  await supabase
    .from('custom_routes')
    .delete()
    .eq('route_id', routeId)
    .eq('from_place_id', customRoute.fromPlaceId)
    .eq('to_place_id', customRoute.toPlaceId)

  // Then insert new one
  const { error } = await supabase
    .from('custom_routes')
    .insert({
      route_id: routeId,
      from_place_id: customRoute.fromPlaceId,
      to_place_id: customRoute.toPlaceId,
      geometry: customRoute.geometry,
    })

  if (error) {
    console.error('Error saving custom route:', error)
    return false
  }

  return true
}

export async function deleteCustomRoute(
  routeId: string,
  fromPlaceId: string,
  toPlaceId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('custom_routes')
    .delete()
    .eq('route_id', routeId)
    .eq('from_place_id', fromPlaceId)
    .eq('to_place_id', toPlaceId)

  if (error) {
    console.error('Error deleting custom route:', error)
    return false
  }

  return true
}

// POI operations
export async function savePoi(
  dayId: string,
  poi: PointOfInterest,
  position: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('points_of_interest')
    .upsert({
      id: poi.id,
      day_id: dayId,
      name: poi.name,
      address: poi.address || null,
      note: poi.note || null,
      lng: poi.coordinates[0],
      lat: poi.coordinates[1],
      is_manual: poi.isManual || false,
      position,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving POI:', error)
    return null
  }

  return data.id
}

export async function deletePoi(poiId: string): Promise<boolean> {
  const { error } = await supabase
    .from('points_of_interest')
    .delete()
    .eq('id', poiId)

  if (error) {
    console.error('Error deleting POI:', error)
    return false
  }

  return true
}

// Search pin operations
export async function saveSearchPin(
  tripId: string,
  pin: SearchPin
): Promise<string | null> {
  const { data, error } = await supabase
    .from('search_pins')
    .upsert({
      id: pin.id,
      trip_id: tripId,
      name: pin.name,
      address: pin.address || null,
      lng: pin.coordinates[0],
      lat: pin.coordinates[1],
      bbox_min_lng: pin.bbox?.[0] || null,
      bbox_min_lat: pin.bbox?.[1] || null,
      bbox_max_lng: pin.bbox?.[2] || null,
      bbox_max_lat: pin.bbox?.[3] || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving search pin:', error)
    return null
  }

  return data.id
}

export async function deleteSearchPin(pinId: string): Promise<boolean> {
  const { error } = await supabase
    .from('search_pins')
    .delete()
    .eq('id', pinId)

  if (error) {
    console.error('Error deleting search pin:', error)
    return false
  }

  return true
}

export async function clearSearchPins(tripId: string): Promise<boolean> {
  const { error } = await supabase
    .from('search_pins')
    .delete()
    .eq('trip_id', tripId)

  if (error) {
    console.error('Error clearing search pins:', error)
    return false
  }

  return true
}

// ============================================
// Full sync operation - save complete state
// ============================================

export async function syncTripToDb(
  tripId: string,
  days: Day[],
  searchPins: SearchPin[]
): Promise<boolean> {
  try {
    // Get existing days to detect deletions
    const { data: existingDays } = await supabase
      .from('days')
      .select('id')
      .eq('trip_id', tripId)

    const existingDayIds = new Set((existingDays || []).map((d) => d.id))
    const currentDayIds = new Set(days.map((d) => d.id))

    // Delete removed days (cascade will handle routes, places, pois)
    for (const existingId of existingDayIds) {
      if (!currentDayIds.has(existingId)) {
        await deleteDay(existingId)
      }
    }

    // Save days and their nested data
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex]
      await saveDay(tripId, day, dayIndex)

      // Get existing routes for this day
      const { data: existingRoutes } = await supabase
        .from('routes')
        .select('id')
        .eq('day_id', day.id)

      const existingRouteIds = new Set((existingRoutes || []).map((r) => r.id))
      const currentRouteIds = new Set(day.routes.map((r) => r.id))

      // Delete removed routes
      for (const existingId of existingRouteIds) {
        if (!currentRouteIds.has(existingId)) {
          await deleteRoute(existingId)
        }
      }

      // Save routes
      for (let routeIndex = 0; routeIndex < day.routes.length; routeIndex++) {
        const route = day.routes[routeIndex]
        await saveRoute(day.id, route, routeIndex)

        // Get existing places for this route
        const { data: existingPlaces } = await supabase
          .from('places')
          .select('id')
          .eq('route_id', route.id)

        const existingPlaceIds = new Set((existingPlaces || []).map((p) => p.id))
        const currentPlaceIds = new Set(route.places.map((p) => p.id))

        // Delete removed places
        for (const existingId of existingPlaceIds) {
          if (!currentPlaceIds.has(existingId)) {
            await deletePlace(existingId)
          }
        }

        // Save places
        for (let placeIndex = 0; placeIndex < route.places.length; placeIndex++) {
          const place = route.places[placeIndex]
          await savePlace(route.id, place, placeIndex)
        }

        // Handle custom routes
        if (route.customRoutes) {
          for (const customRoute of route.customRoutes) {
            await saveCustomRoute(route.id, customRoute)
          }
        }
      }

      // Get existing POIs for this day
      const { data: existingPois } = await supabase
        .from('points_of_interest')
        .select('id')
        .eq('day_id', day.id)

      const existingPoiIds = new Set((existingPois || []).map((p) => p.id))
      const currentPoiIds = new Set(day.pointsOfInterest.map((p) => p.id))

      // Delete removed POIs
      for (const existingId of existingPoiIds) {
        if (!currentPoiIds.has(existingId)) {
          await deletePoi(existingId)
        }
      }

      // Save POIs
      for (let poiIndex = 0; poiIndex < day.pointsOfInterest.length; poiIndex++) {
        const poi = day.pointsOfInterest[poiIndex]
        await savePoi(day.id, poi, poiIndex)
      }
    }

    // Handle search pins
    const { data: existingPins } = await supabase
      .from('search_pins')
      .select('id')
      .eq('trip_id', tripId)

    const existingPinIds = new Set((existingPins || []).map((p) => p.id))
    const currentPinIds = new Set(searchPins.map((p) => p.id))

    // Delete removed pins
    for (const existingId of existingPinIds) {
      if (!currentPinIds.has(existingId)) {
        await deleteSearchPin(existingId)
      }
    }

    // Save search pins
    for (const pin of searchPins) {
      await saveSearchPin(tripId, pin)
    }

    return true
  } catch (error) {
    console.error('Error syncing trip to DB:', error)
    return false
  }
}
