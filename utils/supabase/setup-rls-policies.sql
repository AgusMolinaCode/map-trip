-- ============================================
-- Map Trip - Row Level Security (RLS) Policies
-- ============================================
-- Este archivo configura las políticas RLS para permitir a los usuarios
-- acceder solo a sus propios datos.

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_of_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_pins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIPS - Solo el propietario puede ver/editar sus trips
-- ============================================

-- Permitir SELECT a trips propios
CREATE POLICY "Users can view their own trips"
ON public.trips FOR SELECT
USING (auth.uid() = user_id);

-- Permitir INSERT de trips propios
CREATE POLICY "Users can create their own trips"
ON public.trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permitir UPDATE de trips propios
CREATE POLICY "Users can update their own trips"
ON public.trips FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir DELETE de trips propios
CREATE POLICY "Users can delete their own trips"
ON public.trips FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- DAYS - Solo el propietario del trip puede ver/editar days
-- ============================================

-- Permitir SELECT a days de trips propios
CREATE POLICY "Users can view days from their own trips"
ON public.days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = days.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir INSERT de days en trips propios
CREATE POLICY "Users can create days in their own trips"
ON public.days FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = days.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir UPDATE de days en trips propios
CREATE POLICY "Users can update days in their own trips"
ON public.days FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = days.trip_id
    AND trips.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = days.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir DELETE de days en trips propios
CREATE POLICY "Users can delete days from their own trips"
ON public.days FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = days.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- ============================================
-- ROUTES - Solo el propietario del trip puede ver/editar routes
-- ============================================

-- Permitir SELECT a routes de trips propios
CREATE POLICY "Users can view routes from their own trips"
ON public.routes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = routes.day_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir INSERT de routes en trips propios
CREATE POLICY "Users can create routes in their own trips"
ON public.routes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = routes.day_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir UPDATE de routes en trips propios
CREATE POLICY "Users can update routes in their own trips"
ON public.routes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = routes.day_id
    AND trips.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = routes.day_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir DELETE de routes en trips propios
CREATE POLICY "Users can delete routes from their own trips"
ON public.routes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = routes.day_id
    AND trips.user_id = auth.uid()
  )
);

-- ============================================
-- PLACES - Solo el propietario del trip puede ver/editar places
-- ============================================

-- Permitir SELECT a places de trips propios
CREATE POLICY "Users can view places from their own trips"
ON public.places FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = places.route_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir INSERT de places en trips propios
CREATE POLICY "Users can create places in their own trips"
ON public.places FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = places.route_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir UPDATE de places en trips propios
CREATE POLICY "Users can update places in their own trips"
ON public.places FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = places.route_id
    AND trips.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = places.route_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir DELETE de places en trips propios
CREATE POLICY "Users can delete places from their own trips"
ON public.places FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = places.route_id
    AND trips.user_id = auth.uid()
  )
);

-- ============================================
-- CUSTOM_ROUTES - Solo el propietario del trip puede ver/editar custom routes
-- ============================================

-- Permitir SELECT a custom_routes de trips propios
CREATE POLICY "Users can view custom routes from their own trips"
ON public.custom_routes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = custom_routes.route_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir INSERT de custom_routes en trips propios
CREATE POLICY "Users can create custom routes in their own trips"
ON public.custom_routes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = custom_routes.route_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir UPDATE de custom_routes en trips propios
CREATE POLICY "Users can update custom routes in their own trips"
ON public.custom_routes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = custom_routes.route_id
    AND trips.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = custom_routes.route_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir DELETE de custom_routes en trips propios
CREATE POLICY "Users can delete custom routes from their own trips"
ON public.custom_routes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.routes
    JOIN public.days ON days.id = routes.day_id
    JOIN public.trips ON trips.id = days.trip_id
    WHERE routes.id = custom_routes.route_id
    AND trips.user_id = auth.uid()
  )
);

-- ============================================
-- POINTS_OF_INTEREST - Solo el propietario del trip puede ver/editar POIs
-- ============================================

-- Permitir SELECT a POIs de trips propios
CREATE POLICY "Users can view POIs from their own trips"
ON public.points_of_interest FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = points_of_interest.day_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir INSERT de POIs en trips propios
CREATE POLICY "Users can create POIs in their own trips"
ON public.points_of_interest FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = points_of_interest.day_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir UPDATE de POIs en trips propios
CREATE POLICY "Users can update POIs in their own trips"
ON public.points_of_interest FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = points_of_interest.day_id
    AND trips.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = points_of_interest.day_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir DELETE de POIs en trips propios
CREATE POLICY "Users can delete POIs from their own trips"
ON public.points_of_interest FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.days
    JOIN public.trips ON trips.id = days.trip_id
    WHERE days.id = points_of_interest.day_id
    AND trips.user_id = auth.uid()
  )
);

-- ============================================
-- SEARCH_PINS - Solo el propietario del trip puede ver/editar search pins
-- ============================================

-- Permitir SELECT a search_pins de trips propios
CREATE POLICY "Users can view search pins from their own trips"
ON public.search_pins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = search_pins.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir INSERT de search_pins en trips propios
CREATE POLICY "Users can create search pins in their own trips"
ON public.search_pins FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = search_pins.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir UPDATE de search_pins en trips propios
CREATE POLICY "Users can update search pins in their own trips"
ON public.search_pins FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = search_pins.trip_id
    AND trips.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = search_pins.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Permitir DELETE de search_pins en trips propios
CREATE POLICY "Users can delete search pins from their own trips"
ON public.search_pins FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = search_pins.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- ============================================
-- ÍNDICES para mejorar rendimiento de consultas RLS
-- ============================================

-- Índice para búsquedas por user_id en trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);

-- Índice para búsquedas por trip_id en days
CREATE INDEX IF NOT EXISTS idx_days_trip_id ON public.days(trip_id);

-- Índice para búsquedas por day_id en routes
CREATE INDEX IF NOT EXISTS idx_routes_day_id ON public.routes(day_id);

-- Índice para búsquedas por route_id en places
CREATE INDEX IF NOT EXISTS idx_places_route_id ON public.places(route_id);

-- Índice para búsquedas por route_id en custom_routes
CREATE INDEX IF NOT EXISTS idx_custom_routes_route_id ON public.custom_routes(route_id);

-- Índice para búsquedas por day_id en points_of_interest
CREATE INDEX IF NOT EXISTS idx_points_of_interest_day_id ON public.points_of_interest(day_id);

-- Índice para búsquedas por trip_id en search_pins
CREATE INDEX IF NOT EXISTS idx_search_pins_trip_id ON public.search_pins(trip_id);
