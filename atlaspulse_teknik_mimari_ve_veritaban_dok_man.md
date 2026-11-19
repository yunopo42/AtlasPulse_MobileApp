# AtlasPulse — Teknik Mimari ve Sistem Tasarımı Dokümanı

## 1. Ürün Vizyonu ve Temel Yaklaşım
**AtlasPulse**, gezginlerin geçmiş ve anlık seyahat rotalarını sıfır eforla haritalandıran, aksiyon/drone çekimlerini özel pinlerle işaretleyen ve rotalarını sosyal medya (Instagram Reels / TikTok) uyumlu dikey videolara dönüştüren **Local-First (Önce Cihazda İşle)** mimarisine sahip hibrit bir seyahat platformudur.

---

## 2. Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Kütüphane | Mimari Gerekçe |
| :--- | :--- | :--- |
| **Mobil İstemci** | React Native (Expo SDK 58+) + TypeScript | Android & iOS tek kod tabanı, native modül desteği ve hızlı OTA güncellemeleri. |
| **Lokal Veritabanı** | WatermelonDB / Expo SQLite | Uçak modu veya yurt dışı gibi internetsiz ortamlarda sıfır gecikmeli harita ve gezi kaydı. |
| **Harita Motoru** | Mapbox GL (`@rnmapbox/maps`) | Vektör tabanlı haritalar, özel stil dosyaları (Dark, Retro, Uydu), 3D arazi ve akıcı `flyTo` kamera geçişleri. |
| **EXIF & Kümeleme** | `expo-media-library` + `exifr` | Sunucuya dosya yüklemeden cihaz içinde GPS/tarih taraması ve DBSCAN tabanlı gezi gruplama. |
| **Video Render** | `@shopify/react-native-skia` + `FFmpeg` | Sunucu GPU maliyeti olmadan cihaz içinde 1080x1920 (9:16) 30 FPS rota animasyonu üretimi. |
| **Backend & DB** | Supabase (PostgreSQL + PostGIS) | Coğrafi poligon sorguları, Auth, sıkıştırılmış medya depolama ve Edge Functions. |
| **Abonelik Yönetimi** | RevenueCat | Google Play Billing entegrasyonu, Free/Pro yetki (`entitlement`) senkronizasyonu. |

---

## 3. Çekirdek Veri Akışları

### 3.1. Gizlilik Odaklı EXIF Tarama ve Kümeleme (Clustering)
1. **Metadata Okuma:** Galerideki medya varlıklarının yalnızca `location` (lat/lng) ve `creationTime` bilgileri okunur; görsel dosyaları belleğe alınmaz.
2. **Zaman-Mekan Kümeleme (Spatio-Temporal Clustering):**
   - Ardışık fotoğraflar arası mesafe **$< 50\text{ km}$** ve zaman farkı **$< 72\text{ saat}$** ise aynı **Seyahat (`Trip`)** altında birleştirilir.
   - Aynı seyahat içerisindeki **$500\text{ m}$** yarıçapındaki fotoğraflar tek bir **Durak (`Waypoint`)** olarak kümelenir.
3. **Ters Coğrafi Kodlama (Reverse Geocoding):** Yalnızca durak merkezlerinin koordinatları PostGIS sınır poligonlarıyla eşleştirilerek ISO ülke kodu ve şehir adı atanır.

### 3.2. Çok Katmanlı Harita Render Mimarisi
- **Katman 1 (Choropleth Ülke/Bölge Boyama):** Ziyaret edilen ülkelerin ISO-3166 kodları Mapbox `country-boundaries` vektör katmanına dinamik renk ifadesi (`match` expression) olarak uygulanır.
- **Katman 2 (Rota Yayları):** Duraklar arasındaki geçişler Büyük Daire (Great Circle) veya Bezier eğrileriyle `LineLayer` üzerinde çizilir.
- **Katman 3 (Özel Pin İkonları):** Standart, Drone (`drone`), Dalış (`diving`), Kamp (`camping`) ve Turistik (`landmark`) noktalar tip bazlı SVG sembolleriyle render edilir.

### 3.3. Cihaz İçi Reels / Story Video Export
1. Mapbox kamerası seçilen seyahatin durakları arasında programatik olarak hareket ettirilir.
2. Her karede kamera görüntüsü ile Skia üzerinde çizilen istatistik/fotoğraf katmanları birleştirilir.
3. `FFmpeg` kareleri 30 FPS MP4 formatında kodlar; Free sürümde filigran eklenir, Pro sürümde 4K/60FPS ve filigransız çıktı üretilir.

---

## 4. Veritabanı Şeması (PostgreSQL + PostGIS)

```sql
-- PostGIS eklentisini aktif et
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Kullanıcı Profilleri
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  home_location GEOGRAPHY(Point, 4326),
  public_profile BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seyahatler (Trips)
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  visibility TEXT CHECK (visibility IN ('private', 'friends', 'public')) DEFAULT 'private',
  total_distance_km NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Gezi Durakları / Pinler (Waypoints)
CREATE TABLE waypoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  note TEXT,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  country_code CHAR(2),
  city_name TEXT,
  pin_type TEXT CHECK (pin_type IN ('standard', 'drone', 'diving', 'camping', 'landmark')) DEFAULT 'standard',
  visited_at TIMESTAMPTZ NOT NULL,
  order_index INT NOT NULL
);

-- 4. Durak Medyaları
CREATE TABLE waypoint_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  waypoint_id UUID REFERENCES waypoints(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
  local_asset_id TEXT,
  taken_at TIMESTAMPTZ
);

-- 5. Ziyaret Edilen Ülkeler ve Alt Bölgeler
CREATE TABLE user_visited_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  country_code CHAR(2) NOT NULL,
  region_code TEXT,
  status TEXT CHECK (status IN ('visited', 'lived', 'wishlist')) DEFAULT 'visited',
  first_visited_year INT,
  UNIQUE(user_id, country_code, region_code)
);

-- 6. Ortak Seyahat Katılımcıları (Co-op Trips - Pro)
CREATE TABLE trip_collaborators (
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('editor', 'viewer')) DEFAULT 'editor',
  PRIMARY KEY (trip_id, user_id)
);

-- Performans ve Coğrafi İndeksler
CREATE INDEX idx_waypoints_location ON waypoints USING GIST (location);
CREATE INDEX idx_waypoints_trip_id ON waypoints(trip_id);
CREATE INDEX idx_visited_regions_user ON user_visited_regions(user_id);
```

---

## 5. Güvenlik (RLS) ve Maliyet Optimizasyonu
- **Row Level Security (RLS):** Tüm tablolarda `auth.uid() = user_id` veya `visibility = 'public'` kuralları uygulanır.
- **Medya Sıkıştırma:** Buluta yalnızca kullanıcının seçtiği öne çıkan fotoğraflar `WebP` (max `1440px`, `%80` kalite, ortalama `~150 KB`) formatında yüklenir; diğer binlerce galeri fotoğrafı `local_asset_id` ile cihaz içinde referanslanır.
- **Otomatik Mesafe Trigger'ı:** Yeni bir `waypoint` eklendiğinde PostGIS `ST_Distance` fonksiyonu duraklar arası mesafeyi toplayarak `trips.total_distance_km` değerini günceller.

---

## 6. UI/UX Tasarım Sistemi (Design Tokens)
- **Renk Paleti (Karanlık Mod Öncelikli Harita Estetiği):**
  - Arka Plan (Deep Ocean): `#070B14`
  - Yüzey / Cam Kartlar (Glass Surface): `rgba(15, 23, 42, 0.78)` + `backdrop-filter: blur(16px)`
  - Ana Vurgu (Atlas Emerald): `#10B981` (Ziyaret edilen ülkeler ve aktif rotalar)
  - İkincil Vurgu (Horizon Amber): `#F59E0B` (Drone/Özel pinler ve Pro rozetleri)
- **Tipografi:** Başlıklarda `Plus Jakarta Sans` (yüksek okunabilirlik), istatistik ve koordinatlarda `JetBrains Mono` (teknik/keşif hissi).
- **Navigasyon Modeli:** Tam ekran etkileşimli harita kanvası üzerinde yüzen (floating) alt cam bar ve sürüklenebilir Bottom Sheet detay kartları.