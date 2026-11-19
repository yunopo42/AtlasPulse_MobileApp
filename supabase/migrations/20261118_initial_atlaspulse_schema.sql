-- ====================================================================
-- AtlasPulse — Supabase PostgreSQL + PostGIS Başlangıç Şeması ve RLS
-- ====================================================================

-- 1. PostGIS Eklentisini Etkinleştir
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Kullanıcı Profilleri
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  home_location GEOGRAPHY(Point, 4326),
  public_profile BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seyahatler (Trips)
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  visibility TEXT CHECK (visibility IN ('private', 'friends', 'public')) DEFAULT 'private',
  total_distance_km NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Gezi Durakları / Pinler (Waypoints)
CREATE TABLE IF NOT EXISTS public.waypoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  country_code CHAR(2),
  city_name TEXT,
  elevation_m NUMERIC(7, 1),
  weather_desc TEXT,
  pin_type TEXT CHECK (pin_type IN ('standard', 'drone', 'diving', 'camping', 'landmark', 'exif')) DEFAULT 'standard',
  visited_at TIMESTAMPTZ NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Durak Medyaları (Waypoint Media)
CREATE TABLE IF NOT EXISTS public.waypoint_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  waypoint_id UUID REFERENCES public.waypoints(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
  local_asset_id TEXT,
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ziyaret Edilen Ülkeler ve Alt Bölgeler (User Visited Regions)
CREATE TABLE IF NOT EXISTS public.user_visited_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  country_code CHAR(2) NOT NULL,
  region_code TEXT,
  status TEXT CHECK (status IN ('visited', 'lived', 'wishlist')) DEFAULT 'visited',
  first_visited_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, country_code, region_code)
);

-- 7. Ortak Seyahat Katılımcıları (Co-op Trips - Pro)
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('editor', 'viewer')) DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

-- Coğrafi ve Performans İndeksleri
CREATE INDEX IF NOT EXISTS idx_waypoints_location ON public.waypoints USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_waypoints_trip_id ON public.waypoints(trip_id);
CREATE INDEX IF NOT EXISTS idx_waypoints_user_id ON public.waypoints(user_id);
CREATE INDEX IF NOT EXISTS idx_visited_regions_user ON public.user_visited_regions(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);

-- ====================================================================
-- OTOMATİK MESAFE HESAPLAMA TRIGGER'I
-- Yeni durak eklendiğinde veya silindiğinde seyahat mesafesini günceller
-- ====================================================================
CREATE OR REPLACE FUNCTION public.recalculate_trip_distance()
RETURNS TRIGGER AS $$
DECLARE
  target_trip_id UUID;
  total_meters DOUBLE PRECISION := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_trip_id := OLD.trip_id;
  ELSE
    target_trip_id := NEW.trip_id;
  END IF;

  -- Duraklar arası sırayla mesafe toplamı
  WITH ordered_waypoints AS (
    SELECT location, order_index,
           LAG(location) OVER (ORDER BY order_index ASC) AS prev_loc
    FROM public.waypoints
    WHERE trip_id = target_trip_id
  )
  SELECT COALESCE(SUM(ST_Distance(prev_loc, location)), 0)
  INTO total_meters
  FROM ordered_waypoints
  WHERE prev_loc IS NOT NULL;

  UPDATE public.trips
  SET total_distance_km = ROUND((total_meters / 1000.0)::numeric, 2),
      updated_at = NOW()
  WHERE id = target_trip_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_trip_distance ON public.waypoints;
CREATE TRIGGER trg_recalculate_trip_distance
AFTER INSERT OR UPDATE OR DELETE ON public.waypoints
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_trip_distance();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waypoint_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_visited_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Profiles: Herkes açık profilleri okuyabilir, sadece sahibi günceller
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (public_profile = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trips: Sahibi veya açık seyahatleri herkes görebilir, sadece sahibi/ortak düzenler
CREATE POLICY "Trips viewable by owner or public"
  ON public.trips FOR SELECT
  USING (
    visibility = 'public' 
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.trip_collaborators
      WHERE trip_id = trips.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- Waypoints: Gezinin görünürlüğüne bağlı
CREATE POLICY "Waypoints viewable if trip accessible"
  ON public.waypoints FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = waypoints.trip_id AND (trips.visibility = 'public' OR trips.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own waypoints"
  ON public.waypoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waypoints"
  ON public.waypoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own waypoints"
  ON public.waypoints FOR DELETE
  USING (auth.uid() = user_id);

-- Visited Regions: Kendi bölgelerini yönetme
CREATE POLICY "Users can view visited regions"
  ON public.user_visited_regions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update visited regions"
  ON public.user_visited_regions FOR ALL
  USING (auth.uid() = user_id);
