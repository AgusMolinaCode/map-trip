-- ============================================
-- Map Trip - Agregar CASCADE a Foreign Keys
-- ============================================
-- Este archivo actualiza las foreign keys para que las eliminaciones
-- se propaguen en cascada y no queden datos huérfanos.

-- IMPORTANTE: Ejecutar esto solo UNA vez. Si ya tienes datos, esto puede
-- causar eliminaciones en cascada no deseadas.

-- ============================================
-- 1. DAYS - Eliminar constraint antigua y crear nueva con CASCADE
-- ============================================

-- Eliminar constraint antigua
ALTER TABLE public.days
  DROP CONSTRAINT IF EXISTS days_trip_id_fkey;

-- Crear nueva constraint con ON DELETE CASCADE
ALTER TABLE public.days
  ADD CONSTRAINT days_trip_id_fkey
  FOREIGN KEY (trip_id)
  REFERENCES public.trips(id)
  ON DELETE CASCADE;

-- ============================================
-- 2. ROUTES - Eliminar constraint antigua y crear nueva con CASCADE
-- ============================================

-- Eliminar constraint antigua
ALTER TABLE public.routes
  DROP CONSTRAINT IF EXISTS routes_day_id_fkey;

-- Crear nueva constraint con ON DELETE CASCADE
ALTER TABLE public.routes
  ADD CONSTRAINT routes_day_id_fkey
  FOREIGN KEY (day_id)
  REFERENCES public.days(id)
  ON DELETE CASCADE;

-- ============================================
-- 3. PLACES - Eliminar constraint antigua y crear nueva con CASCADE
-- ============================================

-- Eliminar constraint antigua
ALTER TABLE public.places
  DROP CONSTRAINT IF EXISTS places_route_id_fkey;

-- Crear nueva constraint con ON DELETE CASCADE
ALTER TABLE public.places
  ADD CONSTRAINT places_route_id_fkey
  FOREIGN KEY (route_id)
  REFERENCES public.routes(id)
  ON DELETE CASCADE;

-- ============================================
-- 4. CUSTOM_ROUTES - Eliminar constraints antiguas y crear nuevas con CASCADE
-- ============================================

-- Eliminar constraints antiguas
ALTER TABLE public.custom_routes
  DROP CONSTRAINT IF EXISTS custom_routes_route_id_fkey;

ALTER TABLE public.custom_routes
  DROP CONSTRAINT IF EXISTS custom_routes_from_place_id_fkey;

ALTER TABLE public.custom_routes
  DROP CONSTRAINT IF EXISTS custom_routes_to_place_id_fkey;

-- Crear nuevas constraints con ON DELETE CASCADE
ALTER TABLE public.custom_routes
  ADD CONSTRAINT custom_routes_route_id_fkey
  FOREIGN KEY (route_id)
  REFERENCES public.routes(id)
  ON DELETE CASCADE;

ALTER TABLE public.custom_routes
  ADD CONSTRAINT custom_routes_from_place_id_fkey
  FOREIGN KEY (from_place_id)
  REFERENCES public.places(id)
  ON DELETE CASCADE;

ALTER TABLE public.custom_routes
  ADD CONSTRAINT custom_routes_to_place_id_fkey
  FOREIGN KEY (to_place_id)
  REFERENCES public.places(id)
  ON DELETE CASCADE;

-- ============================================
-- 5. POINTS_OF_INTEREST - Eliminar constraint antigua y crear nueva con CASCADE
-- ============================================

-- Eliminar constraint antigua
ALTER TABLE public.points_of_interest
  DROP CONSTRAINT IF EXISTS points_of_interest_day_id_fkey;

-- Crear nueva constraint con ON DELETE CASCADE
ALTER TABLE public.points_of_interest
  ADD CONSTRAINT points_of_interest_day_id_fkey
  FOREIGN KEY (day_id)
  REFERENCES public.days(id)
  ON DELETE CASCADE;

-- ============================================
-- 6. SEARCH_PINS - Eliminar constraint antigua y crear nueva con CASCADE
-- ============================================

-- Eliminar constraint antigua
ALTER TABLE public.search_pins
  DROP CONSTRAINT IF EXISTS search_pins_trip_id_fkey;

-- Crear nueva constraint con ON DELETE CASCADE
ALTER TABLE public.search_pins
  ADD CONSTRAINT search_pins_trip_id_fkey
  FOREIGN KEY (trip_id)
  REFERENCES public.trips(id)
  ON DELETE CASCADE;
