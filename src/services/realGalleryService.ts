// Cihaz Galerisi → GPS'li Fotoğraf İndeksi → Gezi Kümeleri
//
// expo-media-library v58'in kök import'u yeni (next) API'yi verir; eski getAssetsAsync /
// getAssetInfoAsync orada yalnızca hata fırlatan uyarı stub'larıdır. Toplu konum okuma için
// `expo-media-library/legacy` kullanılır: Android'de `resolveWithFullInfo: true` her sayfada
// EXIF GPS'i birlikte çözer (ACCESS_MEDIA_LOCATION izni gerekir, app.json'da açık).
//
// Not: Expo Go tam galeri erişimi vermez → bu özellik dev build / APK'da test edilmelidir.

import * as MediaLibrary from 'expo-media-library/legacy';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidGps } from './geo';
import { clusterTrips, DetectedTrip, GeoPhoto } from './tripClustering';
import { resolveCountrySync } from './countryService';

const INDEX_KEY = '@atlaspulse_gps_index_v1';
const PAGE_SIZE = 200;

export type PermissionState = 'granted' | 'limited' | 'denied';

export interface GalleryScanResult {
  permission: PermissionState;
  /** Bu taramada okunan fotoğraf sayısı */
  totalScanned: number;
  /** İndeksteki toplam GPS'li fotoğraf sayısı */
  gpsPhotoCount: number;
  trips: DetectedTrip[];
  /** Fotoğraf kimliği → dosya URI (durak kolajları için) */
  photoUriById: Map<string, string>;
  cancelled: boolean;
  error?: string;
}

export interface ScanOptions {
  /** true → önbelleği yok sayıp tüm galeriyi baştan tara */
  full?: boolean;
  onProgress?: (progress: number, label: string) => void;
  isCancelled?: () => boolean;
}

// Önbellek biçimi: kompakt dizi [id, lat, lng, timestamp, uri]
type IndexRow = [string, number, number, number, string];
interface GpsIndex {
  version: 1;
  lastScanAt: number;
  rows: IndexRow[];
}

async function loadIndex(): Promise<GpsIndex | null> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GpsIndex;
    return parsed?.version === 1 && Array.isArray(parsed.rows) ? parsed : null;
  } catch {
    return null;
  }
}

async function saveIndex(index: GpsIndex): Promise<void> {
  try {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch (err) {
    console.warn('[Gallery] İndeks kaydedilemedi:', err);
  }
}

const rowToPhoto = (r: IndexRow): GeoPhoto => ({ id: r[0], lat: r[1], lng: r[2], timestamp: r[3], uri: r[4] });

const uriMap = (rows: IndexRow[]) => new Map(rows.map(r => [r[0], r[4]] as [string, string]));

export const realGalleryService = {
  async ensurePermission(): Promise<PermissionState> {
    try {
      let res = await MediaLibrary.getPermissionsAsync(false, ['photo']);
      if (res.status !== 'granted' && res.canAskAgain) {
        res = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      }
      if (res.status !== 'granted') return 'denied';
      return res.accessPrivileges === 'limited' ? 'limited' : 'granted';
    } catch (err) {
      console.warn('[Gallery] İzin hatası:', err);
      return 'denied';
    }
  },

  /** Daha önce taranmış indeksten gezileri hemen üretir (galeri okumadan). */
  async getCachedTrips(): Promise<{
    trips: DetectedTrip[];
    photoUriById: Map<string, string>;
    gpsPhotoCount: number;
    lastScanAt: number;
  } | null> {
    const index = await loadIndex();
    if (!index || index.rows.length === 0) return null;
    const photos = index.rows.map(rowToPhoto);
    return {
      trips: clusterTrips(photos, { resolveCountry: resolveCountrySync }),
      photoUriById: uriMap(index.rows),
      gpsPhotoCount: photos.length,
      lastScanAt: index.lastScanAt,
    };
  },

  /** Galeriyi sayfa sayfa tarar, GPS'li fotoğrafları indeksler ve gezileri çıkarır. */
  async scanGallery({ full = false, onProgress, isCancelled }: ScanOptions = {}): Promise<GalleryScanResult> {
    const permission = await this.ensurePermission();
    if (permission === 'denied') {
      return { permission, totalScanned: 0, gpsPhotoCount: 0, trips: [], photoUriById: new Map(), cancelled: false };
    }

    const previous = full ? null : await loadIndex();
    const byId = new Map<string, IndexRow>((previous?.rows ?? []).map(r => [r[0], r]));
    const scanStartedAt = Date.now();
    // Artımlı tarama: son taramadan 1 gün öncesinden itibaren (saat dilimi / gecikmeli senkron payı)
    const createdAfter = previous ? previous.lastScanAt - 24 * 60 * 60 * 1000 : undefined;

    let totalScanned = 0;
    let totalCount = 0;
    let after: string | undefined;
    let cancelled = false;

    try {
      onProgress?.(0.02, previous ? 'Yeni fotoğraflar aranıyor...' : 'Galeri taranıyor...');

      while (true) {
        if (isCancelled?.()) {
          cancelled = true;
          break;
        }

        const page = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          after,
          mediaType: [MediaLibrary.MediaType.photo],
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          createdAfter,
          resolveWithFullInfo: true,
        });

        totalCount = Math.max(totalCount, page.totalCount);
        for (const asset of page.assets) {
          const loc = asset.location;
          if (loc && isValidGps(loc.latitude, loc.longitude)) {
            const ts = asset.creationTime || asset.modificationTime;
            if (ts > 0) {
              byId.set(asset.id, [asset.id, loc.latitude, loc.longitude, ts, asset.uri]);
            }
          }
        }
        totalScanned += page.assets.length;

        const ratio = totalCount > 0 ? Math.min(totalScanned / totalCount, 1) : 1;
        onProgress?.(0.02 + ratio * 0.83, `EXIF GPS okunuyor (${totalScanned}/${totalCount})...`);

        if (!page.hasNextPage || page.assets.length === 0) break;
        after = page.endCursor;
      }
    } catch (err) {
      console.warn('[Gallery] Tarama hatası:', err);
      return {
        permission,
        totalScanned,
        gpsPhotoCount: byId.size,
        trips: [],
        photoUriById: new Map(),
        cancelled: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const rows = Array.from(byId.values());
    // Yarıda kesilen taramada lastScanAt ilerletilmez → bir sonraki tarama eksikleri tamamlar
    await saveIndex({
      version: 1,
      lastScanAt: cancelled ? previous?.lastScanAt ?? 0 : scanStartedAt,
      rows,
    });

    onProgress?.(0.9, `${rows.length} GPS konumlu fotoğraf kümeleniyor...`);
    const trips = clusterTrips(rows.map(rowToPhoto), { resolveCountry: resolveCountrySync });
    onProgress?.(1, cancelled ? 'Tarama durduruldu' : `Tarama tamamlandı: ${trips.length} gezi bulundu`);

    return { permission, totalScanned, gpsPhotoCount: rows.length, trips, photoUriById: uriMap(rows), cancelled };
  },

  async clearIndex(): Promise<void> {
    await AsyncStorage.removeItem(INDEX_KEY);
  },

  /** Kullanıcının galeriden tek fotoğraf seçmesi (EXIF dahil) */
  async pickPhoto(): Promise<{
    uri: string;
    width: number;
    height: number;
    lat?: number;
    lng?: number;
    timestamp?: number;
  } | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: true,
      });
      if (result.canceled || !result.assets?.length) return null;

      const asset = result.assets[0];
      const gps = parseExifGps(asset.exif ?? undefined);
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        ...gps,
      };
    } catch (err) {
      console.warn('[ImagePicker] Seçim hatası:', err);
      return null;
    }
  },
};

/**
 * ImagePicker EXIF nesnesinden GPS + tarih çıkarır.
 * Android: GPSLatitude ondalık veya "41/1,0/1,30/1" rasyonel metin, Ref ile işaret.
 * iOS: {GPS: {Latitude, LatitudeRef, ...}} iç içe olabilir.
 */
export function parseExifGps(exif?: Record<string, any>): { lat?: number; lng?: number; timestamp?: number } {
  if (!exif) return {};
  const gps = (exif['{GPS}'] as Record<string, any>) ?? exif.GPS ?? exif;

  const toDecimal = (v: unknown): number | undefined => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const parts = v.split(',').map(part => {
        const [n, d] = part.trim().split('/').map(Number);
        return d ? n / d : n;
      });
      if (parts.some(Number.isNaN)) return undefined;
      return parts.length === 3 ? parts[0] + parts[1] / 60 + parts[2] / 3600 : parts[0];
    }
    if (Array.isArray(v) && v.length === 3) return Number(v[0]) + Number(v[1]) / 60 + Number(v[2]) / 3600;
    return undefined;
  };

  let lat = toDecimal(gps.GPSLatitude ?? gps.Latitude);
  let lng = toDecimal(gps.GPSLongitude ?? gps.Longitude);
  const latRef = gps.GPSLatitudeRef ?? gps.LatitudeRef;
  const lngRef = gps.GPSLongitudeRef ?? gps.LongitudeRef;
  if (lat !== undefined && latRef === 'S') lat = -Math.abs(lat);
  if (lng !== undefined && lngRef === 'W') lng = -Math.abs(lng);

  let timestamp: number | undefined;
  const dt: unknown = exif.DateTimeOriginal ?? exif.DateTime ?? exif['{Exif}']?.DateTimeOriginal;
  if (typeof dt === 'string') {
    // EXIF biçimi: "2026:09:14 07:32:10" (yerel saat)
    const m = dt.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (m) timestamp = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
  }

  return isValidGps(lat, lng) ? { lat, lng: lng as number, timestamp } : { timestamp };
}
