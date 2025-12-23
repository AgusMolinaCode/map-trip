import { createClient } from '@/utils/supabase/client'
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
  console.log('➕ [tripService] createTrip: Iniciando creación de trip con nombre:', name)
  const supabase = createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('❌ [tripService] createTrip: Error obteniendo usuario:', userError?.message || 'No user logged in')
    return null
  }

  console.log('👤 [tripService] createTrip: Usuario autenticado:', {
    userId: user.id,
    email: user.email
  })

  const { data, error } = await supabase
    .from('trips')
    .insert({ name, user_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('❌ [tripService] createTrip: Error creando trip:', error.message, error.code, error.details)
    return null
  }

  console.log('✅ [tripService] createTrip: Trip creado exitosamente:', {
    id: data.id,
    name: data.name,
    user_id: data.user_id,
    created_at: data.created_at
  })

  return data
}

export async function getTrip(tripId: string): Promise<DbTrip | null> {
  const supabase = createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message || 'No user logged in')
    return null
  }

  // Get trip only if it belongs to this user
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error getting trip:', error)
    return null
  }

  return data
}

export async function getUserTrips(): Promise<DbTrip[]> {
  console.log('📋 [tripService] getUserTrips: Iniciando consulta de trips del usuario')
  const supabase = createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('❌ [tripService] getUserTrips: Error obteniendo usuario:', userError?.message || 'No user logged in')
    return []
  }

  console.log('👤 [tripService] getUserTrips: Usuario autenticado:', {
    userId: user.id,
    email: user.email
  })

  // Get all trips for this user
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ [tripService] getUserTrips: Error consultando trips:', error)
    return []
  }

  console.log('✅ [tripService] getUserTrips: Trips encontrados:', {
    count: data?.length || 0,
    trips: data?.map(t => ({
      id: t.id,
      name: t.name,
      user_id: t.user_id,
      created_at: t.created_at
    })) || []
  })

  return data || []
}

export async function getFirstTrip(): Promise<DbTrip | null> {
  console.log('🔍 [tripService] getFirstTrip: Iniciando búsqueda del primer trip del usuario')
  const supabase = createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('❌ [tripService] getFirstTrip: Error obteniendo usuario:', userError?.message || 'No user logged in')
    return null
  }

  console.log('👤 [tripService] getFirstTrip: Usuario autenticado:', {
    userId: user.id,
    email: user.email
  })

  // Get first trip for this user
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    console.log('⚠️ [tripService] getFirstTrip: No se encontró trip para este usuario (puede ser normal si es nuevo):', error.message)
    return null
  }

  console.log('✅ [tripService] getFirstTrip: Primer trip encontrado:', {
    id: data.id,
    name: data.name,
    user_id: data.user_id,
    created_at: data.created_at
  })

  return data
}

// Load full trip with all nested data
export async function loadFullTrip(tripId: string): Promise<{
  days: Day[]
  searchPins: SearchPin[]
} | null> {
  console.log('📥 [tripService] loadFullTrip: Iniciando carga completa del trip:', tripId)
  const supabase = createClient()

  // Fetch all data in parallel
  console.log('🔄 [tripService] loadFullTrip: Consultando days y search_pins...')
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
    console.error('❌ [tripService] loadFullTrip: Error loading days:', daysResult.error)
    return null
  }

  const days = daysResult.data as DbDay[]
  const searchPins = (searchPinsResult.data || []) as DbSearchPin[]

  console.log('📊 [tripService] loadFullTrip: Datos iniciales obtenidos:', {
    daysCount: days.length,
    searchPinsCount: searchPins.length,
    days: days.map(d => ({ id: d.id, name: d.name, trip_id: d.trip_id }))
  })

  if (days.length === 0) {
    console.log('⚠️ [tripService] loadFullTrip: No hay days para este trip, retornando vacío')
    return {
      days: [],
      searchPins: searchPins.map(dbSearchPinToZustand),
    }
  }

  // Fetch routes for all days
  const dayIds = days.map((d) => d.id)
  console.log('🔄 [tripService] loadFullTrip: Consultando routes para days:', dayIds)
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select('*')
    .in('day_id', dayIds)
    .order('position')

  if (routesError) {
    console.error('❌ [tripService] loadFullTrip: Error loading routes:', routesError)
    return null
  }

  const dbRoutes = (routes || []) as DbRoute[]
  console.log('📊 [tripService] loadFullTrip: Routes obtenidas:', {
    routesCount: dbRoutes.length,
    routes: dbRoutes.map(r => ({
      id: r.id,
      name: r.name,
      day_id: r.day_id,
      route_profile: r.route_profile
    }))
  })

  // Fetch places and custom routes for all routes
  const routeIds = dbRoutes.map((r) => r.id)

  let dbPlaces: DbPlace[] = []
  let dbCustomRoutes: DbCustomRoute[] = []

  if (routeIds.length > 0) {
    console.log('🔄 [tripService] loadFullTrip: Consultando places y custom_routes para routes:', routeIds)
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

    console.log('📊 [tripService] loadFullTrip: Places y custom routes obtenidos:', {
      placesCount: dbPlaces.length,
      places: dbPlaces.map(p => ({
        id: p.id,
        name: p.name,
        route_id: p.route_id,
        position: p.position
      })),
      customRoutesCount: dbCustomRoutes.length
    })
  } else {
    console.log('⚠️ [tripService] loadFullTrip: No hay routes, saltando consulta de places')
  }

  // Fetch POIs for all days
  console.log('🔄 [tripService] loadFullTrip: Consultando POIs para days:', dayIds)
  const { data: pois } = await supabase
    .from('points_of_interest')
    .select('*')
    .in('day_id', dayIds)
    .order('position')

  const dbPois = (pois || []) as DbPointOfInterest[]
  console.log('📊 [tripService] loadFullTrip: POIs obtenidos:', {
    poisCount: dbPois.length,
    pois: dbPois.map(p => ({ id: p.id, name: p.name, day_id: p.day_id }))
  })

  // Assemble the data
  console.log('🔧 [tripService] loadFullTrip: Ensamblando datos...')
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

  console.log('✅ [tripService] loadFullTrip: Datos ensamblados exitosamente:', {
    daysCount: assembledDays.length,
    days: assembledDays.map(d => ({
      id: d.id,
      name: d.name,
      routesCount: d.routes.length,
      routes: d.routes.map(r => ({
        id: r.id,
        placesCount: r.places.length
      })),
      poisCount: d.pointsOfInterest.length
    })),
    searchPinsCount: searchPins.length
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
  const supabase = createClient()
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
  const supabase = createClient()
  console.log('🗑️ Deleting day:', dayId)

  const { error, count } = await supabase
    .from('days')
    .delete()
    .eq('id', dayId)

  if (error) {
    console.error('❌ Error deleting day:', error.message, error.code, error.details)
    return false
  }

  console.log('✅ Day deleted:', dayId)
  return true
}

// Route operations
export async function saveRoute(
  dayId: string,
  route: Route,
  position: number
): Promise<string | null> {
  const routeData = {
    id: route.id,
    day_id: dayId,
    name: route.name || null,
    route_profile: route.routeProfile,
    route_color: route.routeColor || null,
    distance_meters: route.routeStats?.distance || null,
    duration_seconds: route.routeStats?.duration || null,
    position,
  }

  console.log('📍 Saving route:', routeData)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('routes')
    .upsert(routeData)
    .select('id')
    .single()

  if (error) {
    console.error('❌ Error saving route:', error.message, error.code, error.details)
    return null
  }

  console.log('✅ Route saved:', data.id)
  return data.id
}

export async function deleteRoute(routeId: string): Promise<boolean> {
  const supabase = createClient()
  console.log('🗑️ Deleting route:', routeId)

  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', routeId)

  if (error) {
    console.error('❌ Error deleting route:', error.message, error.code, error.details)
    return false
  }

  console.log('✅ Route deleted:', routeId)
  return true
}

// Place operations
export async function savePlace(
  routeId: string,
  place: Place,
  position: number
): Promise<string | null> {
  const placeData = {
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
  }

  console.log('📌 Saving place:', placeData)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('places')
    .upsert(placeData)
    .select('id')
    .single()

  if (error) {
    console.error('❌ Error saving place:', error.message, error.code, error.details)
    return null
  }

  console.log('✅ Place saved:', data.id)
  return data.id
}

export async function deletePlace(placeId: string): Promise<boolean> {
  const supabase = createClient()
  console.log('🗑️ Deleting place:', placeId)

  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', placeId)

  if (error) {
    console.error('❌ Error deleting place:', error.message, error.code, error.details)
    return false
  }

  console.log('✅ Place deleted:', placeId)
  return true
}

// Custom route operations
export async function saveCustomRoute(
  routeId: string,
  customRoute: CustomRoute
): Promise<boolean> {
  const supabase = createClient()
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
  const supabase = createClient()
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
  const supabase = createClient()
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
  const supabase = createClient()
  console.log('🗑️ Deleting POI:', poiId)

  const { error } = await supabase
    .from('points_of_interest')
    .delete()
    .eq('id', poiId)

  if (error) {
    console.error('❌ Error deleting POI:', error.message, error.code, error.details)
    return false
  }

  console.log('✅ POI deleted:', poiId)
  return true
}

// Search pin operations
export async function saveSearchPin(
  tripId: string,
  pin: SearchPin
): Promise<string | null> {
  const supabase = createClient()
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
  const supabase = createClient()
  console.log('🗑️ Deleting search pin:', pinId)

  const { error } = await supabase
    .from('search_pins')
    .delete()
    .eq('id', pinId)

  if (error) {
    console.error('❌ Error deleting search pin:', error.message, error.code, error.details)
    return false
  }

  console.log('✅ Search pin deleted:', pinId)
  return true
}

export async function clearSearchPins(tripId: string): Promise<boolean> {
  const supabase = createClient()
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
  const supabase = createClient()
  try {
    // Debug: Log what we're syncing
    console.log('🔄 Syncing trip to DB:', {
      tripId,
      daysCount: days.length,
      days: days.map(d => ({
        id: d.id,
        name: d.name,
        routesCount: d.routes.length,
        routes: d.routes.map(r => ({
          id: r.id,
          placesCount: r.places.length,
          places: r.places.map(p => ({ id: p.id, name: p.name }))
        })),
        poisCount: d.pointsOfInterest.length
      }))
    })

    // Get existing days to detect deletions
    const { data: existingDays, error: existingDaysError } = await supabase
      .from('days')
      .select('id')
      .eq('trip_id', tripId)

    if (existingDaysError) {
      console.error('❌ Error fetching existing days:', existingDaysError.message)
    }

    const existingDayIds = new Set((existingDays || []).map((d) => d.id))
    const currentDayIds = new Set(days.map((d) => d.id))

    console.log('📊 Days comparison:', {
      existingInDb: Array.from(existingDayIds),
      currentInState: Array.from(currentDayIds),
      toDelete: Array.from(existingDayIds).filter(id => !currentDayIds.has(id))
    })

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
      const { data: existingRoutes, error: existingRoutesError } = await supabase
        .from('routes')
        .select('id')
        .eq('day_id', day.id)

      if (existingRoutesError) {
        console.error('❌ Error fetching existing routes:', existingRoutesError.message)
      }

      const existingRouteIds = new Set((existingRoutes || []).map((r) => r.id))
      const currentRouteIds = new Set(day.routes.map((r) => r.id))

      console.log('📊 Routes comparison for day', day.id, ':', {
        existingInDb: Array.from(existingRouteIds),
        currentInState: Array.from(currentRouteIds),
        toDelete: Array.from(existingRouteIds).filter(id => !currentRouteIds.has(id))
      })

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
      const { data: existingPois, error: existingPoisError } = await supabase
        .from('points_of_interest')
        .select('id')
        .eq('day_id', day.id)

      if (existingPoisError) {
        console.error('❌ Error fetching existing POIs:', existingPoisError.message)
      }

      const existingPoiIds = new Set((existingPois || []).map((p) => p.id))
      const currentPoiIds = new Set(day.pointsOfInterest.map((p) => p.id))

      console.log('📊 POIs comparison for day', day.id, ':', {
        existingInDb: Array.from(existingPoiIds),
        currentInState: Array.from(currentPoiIds),
        toDelete: Array.from(existingPoiIds).filter(id => !currentPoiIds.has(id))
      })

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
