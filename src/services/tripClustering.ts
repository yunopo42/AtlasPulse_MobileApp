// AtlasPulse — Cihaz İçi Gezi Tespiti (Spatio-Temporal Kümeleme)
// Saf TypeScript: React Native'e bağımlı değildir, birim testlenebilir.
//
// Akış:
//  1. Ev konumu tespiti   → uzun süre boyunca en çok farklı günde fotoğraf çekilen ~2 km'lik hücre
//  2. Ev çevresini ele     → gündelik fotoğraflar gezi sayılmaz
//  3. Zaman boşluğuyla böl → ardışık iki fotoğraf arası > tripGapHours ise yeni gezi
//  4. Durak kümeleme       → gezi içinde stopRadiusKm yarıçapındaki fotoğraflar tek durak
//  5. Ülke, mesafe, başlık → her gezi için özet bilgiler

import { haversineDistance, pathLengthKm, isValidGps } from './geo';

export interface GeoPhoto {
  id: string;
  lat: number;
  lng: number;
  /** Çekim zamanı (Unix ms) */
  timestamp: number;
  uri: string;
}

export interface CountryRef {
  code: string;
  name: string;
  flagEmoji: string;
}

export interface TripStop {
  id: string;
  lat: number;
  lng: number;
  startTime: number;
  endTime: number;
  photoIds: string[];
  coverUri: string;
  country: CountryRef;
}

export interface DetectedTrip {
  id: string;
  title: string;
  emoji: string;
  startTime: number;
  endTime: number;
  dateRange: string;
  photoCount: number;
  coverUri: string;
  distanceKm: number;
  countries: CountryRef[];
  stops: TripStop[];
}

export interface ClusterOptions {
  /** Aynı durak sayılacak yarıçap (km) */
  stopRadiusKm?: number;
  /** Bu süreden uzun fotoğraf boşluğu yeni gezi başlatır (saat) */
  tripGapHours?: number;
  /** Ev konumuna bu mesafeden yakın fotoğraflar gündelik sayılır (km) */
  homeRadiusKm?: number;
  /** Bundan az fotoğraflı kümeler gezi sayılmaz */
  minTripPhotos?: number;
  /** Ev konumu biliniyorsa verilir; null → ev filtresi kapalı; undefined → otomatik tespit */
  home?: { lat: number; lng: number } | null;
  /** Koordinattan ülke çözümleyici */
  resolveCountry?: (lat: number, lng: number) => CountryRef;
}

const DEFAULTS = {
  stopRadiusKm: 1.5,
  tripGapHours: 48,
  homeRadiusKm: 30,
  minTripPhotos: 3,
};

const UNKNOWN_COUNTRY: CountryRef = { code: 'UN', name: 'Bilinmeyen Bölge', flagEmoji: '🌍' };
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** "12–18 Eyl 2026", "28 Eyl – 3 Eki 2026", "30 Ara 2025 – 2 Oca 2026" */
export function formatDateRange(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  const sameDay = sameMonth && s.getDate() === e.getDate();

  if (sameDay) return `${s.getDate()} ${TR_MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  if (sameMonth) return `${s.getDate()}–${e.getDate()} ${TR_MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  if (sameYear) {
    return `${s.getDate()} ${TR_MONTHS[s.getMonth()]} – ${e.getDate()} ${TR_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${s.getDate()} ${TR_MONTHS[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${TR_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Ev konumu tespiti: ~2 km'lik ızgara hücrelerinden, en çok FARKLI GÜNDE fotoğraf çekilen hücre.
 * Uzun tek bir gezinin "ev" sanılmaması için hücrenin en az 10 farklı günü kapsaması ve
 * ilk–son fotoğrafı arasında en az 30 gün olması gerekir.
 */
export function detectHome(photos: GeoPhoto[]): { lat: number; lng: number } | null {
  const CELL = 0.02; // derece ≈ 2 km
  const cells = new Map<
    string,
    { days: Set<string>; latSum: number; lngSum: number; n: number; first: number; last: number }
  >();

  for (const p of photos) {
    const key = `${Math.round(p.lat / CELL)}:${Math.round(p.lng / CELL)}`;
    let c = cells.get(key);
    if (!c) {
      c = { days: new Set(), latSum: 0, lngSum: 0, n: 0, first: p.timestamp, last: p.timestamp };
      cells.set(key, c);
    }
    c.days.add(dayKey(p.timestamp));
    c.latSum += p.lat;
    c.lngSum += p.lng;
    c.n += 1;
    c.first = Math.min(c.first, p.timestamp);
    c.last = Math.max(c.last, p.timestamp);
  }

  let best: (typeof cells extends Map<string, infer V> ? V : never) | null = null;
  for (const c of cells.values()) {
    if (!best || c.days.size > best.days.size) best = c;
  }
  if (!best) return null;
  if (best.days.size < 10 || best.last - best.first < 30 * DAY_MS) return null;

  return { lat: best.latSum / best.n, lng: best.lngSum / best.n };
}

/**
 * Bir gezinin fotoğraflarını duraklara ayırır. Her fotoğraf, merkezi stopRadiusKm içinde kalan
 * mevcut bir durağa (en yakınına) eklenir; yoksa yeni durak açılır. Duraklar ilk ziyaret sırasına göre döner.
 */
export function groupIntoStops(
  photos: GeoPhoto[],
  stopRadiusKm = DEFAULTS.stopRadiusKm,
  resolveCountry: (lat: number, lng: number) => CountryRef = () => UNKNOWN_COUNTRY
): TripStop[] {
  const sorted = [...photos].sort((a, b) => a.timestamp - b.timestamp);
  const acc: Array<{ latSum: number; lngSum: number; photos: GeoPhoto[] }> = [];

  for (const p of sorted) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < acc.length; i++) {
      const a = acc[i];
      const n = a.photos.length;
      const d = haversineDistance(a.latSum / n, a.lngSum / n, p.lat, p.lng);
      if (d <= stopRadiusKm && d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      acc[bestIdx].photos.push(p);
      acc[bestIdx].latSum += p.lat;
      acc[bestIdx].lngSum += p.lng;
    } else {
      acc.push({ latSum: p.lat, lngSum: p.lng, photos: [p] });
    }
  }

  return acc.map(a => {
    const n = a.photos.length;
    const lat = a.latSum / n;
    const lng = a.lngSum / n;
    // Kapak: durağın ortasındaki fotoğraf (genelde ilk/son karelerden daha temsili)
    const cover = a.photos[Math.floor(n / 2)];
    return {
      id: `stop_${a.photos[0].id}`,
      lat,
      lng,
      startTime: a.photos[0].timestamp,
      endTime: a.photos[n - 1].timestamp,
      photoIds: a.photos.map(p => p.id),
      coverUri: cover.uri,
      country: resolveCountry(lat, lng),
    };
  });
}

function buildTitle(countries: CountryRef[]): { title: string; emoji: string } {
  const known = countries.filter(c => c.code !== 'UN');
  if (known.length === 0) return { title: 'Keşif Rotası', emoji: '🧭' };
  if (known.length === 1) return { title: `${known[0].name} Seyahati`, emoji: known[0].flagEmoji };
  if (known.length === 2) return { title: `${known[0].name} & ${known[1].name}`, emoji: '🧭' };
  return { title: `${known[0].name}, ${known[1].name} +${known.length - 2}`, emoji: '🧭' };
}

/** Ana giriş noktası: GPS'li fotoğraflardan gezileri çıkarır (en yeni gezi önce). */
export function clusterTrips(input: GeoPhoto[], options: ClusterOptions = {}): DetectedTrip[] {
  const opts = { ...DEFAULTS, ...options };
  const resolveCountry = options.resolveCountry ?? (() => UNKNOWN_COUNTRY);

  const photos = input
    .filter(p => isValidGps(p.lat, p.lng) && Number.isFinite(p.timestamp) && p.timestamp > 0)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (photos.length === 0) return [];

  const home = options.home === undefined ? detectHome(photos) : options.home;
  const away = home
    ? photos.filter(p => haversineDistance(home.lat, home.lng, p.lat, p.lng) > opts.homeRadiusKm)
    : photos;
  if (away.length === 0) return [];

  // Zaman boşluğuna göre gezilere böl
  const groups: GeoPhoto[][] = [];
  let current: GeoPhoto[] = [away[0]];
  for (let i = 1; i < away.length; i++) {
    if (away[i].timestamp - away[i - 1].timestamp > opts.tripGapHours * HOUR_MS) {
      groups.push(current);
      current = [];
    }
    current.push(away[i]);
  }
  groups.push(current);

  const trips: DetectedTrip[] = [];
  for (const g of groups) {
    if (g.length < opts.minTripPhotos) continue;

    const stops = groupIntoStops(g, opts.stopRadiusKm, resolveCountry);
    const countries: CountryRef[] = [];
    for (const s of stops) {
      if (!countries.some(c => c.code === s.country.code)) countries.push(s.country);
    }
    const { title, emoji } = buildTitle(countries);
    const startTime = g[0].timestamp;
    const endTime = g[g.length - 1].timestamp;

    trips.push({
      id: `trip_${g[0].id}_${startTime}`,
      title,
      emoji,
      startTime,
      endTime,
      dateRange: formatDateRange(startTime, endTime),
      photoCount: g.length,
      coverUri: g[Math.floor(g.length / 2)].uri,
      distanceKm: Math.round(pathLengthKm(stops)),
      countries: countries.filter(c => c.code !== 'UN'),
      stops,
    });
  }

  return trips.reverse();
}
