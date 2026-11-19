import { clusterTrips, detectHome, groupIntoStops, formatDateRange, GeoPhoto } from '../tripClustering';
import { haversineDistance, formatCoords, isValidGps } from '../geo';
import { resolveCountrySync, countryService } from '../countryService';
import { parseExifGps } from '../realGalleryService';
import { tripToStories, sampleEvenly } from '../tripImport';

jest.mock('expo-media-library/legacy', () => ({}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const BASE = new Date(2026, 0, 1, 10, 0, 0).getTime();

let seq = 0;
const photo = (lat: number, lng: number, ts: number): GeoPhoto => ({
  id: `p${++seq}`,
  lat,
  lng,
  timestamp: ts,
  uri: `file:///p${seq}.jpg`,
});

const ISTANBUL = { lat: 41.0082, lng: 28.9784 };
const ROME = { lat: 41.9028, lng: 12.4964 };
const FLORENCE = { lat: 43.7696, lng: 11.2558 };
const ZURICH = { lat: 47.3769, lng: 8.5417 };

/** 60 gün boyunca, 2 günde bir İstanbul'da çekilmiş gündelik fotoğraflar */
const homePhotos = () =>
  Array.from({ length: 30 }, (_, i) => photo(ISTANBUL.lat + (i % 3) * 0.001, ISTANBUL.lng, BASE + i * 2 * DAY));

describe('geo', () => {
  test('haversine İstanbul–Roma ≈ 1370 km', () => {
    const d = haversineDistance(ISTANBUL.lat, ISTANBUL.lng, ROME.lat, ROME.lng);
    expect(d).toBeGreaterThan(1340);
    expect(d).toBeLessThan(1400);
  });

  test('formatCoords yarımküreleri doğru yazar', () => {
    expect(formatCoords(38.7117, -9.1301)).toBe('38.7117° N, 9.1301° W');
    expect(formatCoords(-22.9, -43.2, 1)).toBe('22.9° S, 43.2° W');
  });

  test('isValidGps 0,0 ve aralık dışını reddeder', () => {
    expect(isValidGps(0, 0)).toBe(false);
    expect(isValidGps(91, 10)).toBe(false);
    expect(isValidGps(NaN, 10)).toBe(false);
    expect(isValidGps(41, 29)).toBe(true);
  });
});

describe('countryService (çevrimdışı sınırlar)', () => {
  test.each([
    [47.37, 8.54, 'CH', 'İsviçre'],
    [36.43, 28.22, 'GR', 'Yunanistan'], // Rodos: eski kutu yöntemi Türkiye diyordu
    [41.0, 29.0, 'TR', 'Türkiye'],
    [38.71, -9.13, 'PT', 'Portekiz'],
    [35.68, 139.69, 'JP', 'Japonya'],
  ])('%f,%f → %s', (lat, lng, code, name) => {
    const c = resolveCountrySync(lat, lng);
    expect(c.code).toBe(code);
    expect(c.name).toBe(name);
    expect(c.flagEmoji).not.toBe('🌍');
  });

  test('açık deniz UN döner ve ziyaret sayılmaz', () => {
    expect(resolveCountrySync(35, -40).code).toBe('UN');
    const stats = countryService.calculateVisitedCountries([
      { lat: 35, lng: -40 },
      { lat: 41.0, lng: 29.0 },
      { lat: 39.9, lng: 32.8 },
    ]);
    expect(stats.visitedCount).toBe(1);
    expect(stats.uniqueCountries[0].waypointCount).toBe(2);
  });
});

describe('detectHome', () => {
  test('uzun süre tekrar eden konumu ev olarak bulur', () => {
    const home = detectHome(homePhotos());
    expect(home).not.toBeNull();
    expect(haversineDistance(home!.lat, home!.lng, ISTANBUL.lat, ISTANBUL.lng)).toBeLessThan(1);
  });

  test('tek bir uzun gezi ev sanılmaz', () => {
    const trip = Array.from({ length: 40 }, (_, i) => photo(ROME.lat, ROME.lng, BASE + i * 5 * HOUR));
    expect(detectHome(trip)).toBeNull();
  });
});

describe('groupIntoStops', () => {
  test('yakın fotoğrafları tek durakta toplar, uzaktakini ayırır', () => {
    const photos = [
      photo(ROME.lat, ROME.lng, BASE),
      photo(ROME.lat + 0.003, ROME.lng, BASE + HOUR), // ~330 m
      photo(FLORENCE.lat, FLORENCE.lng, BASE + DAY),
      photo(ROME.lat + 0.001, ROME.lng, BASE + 2 * DAY), // Roma'ya geri dönüş → aynı durak
    ];
    const stops = groupIntoStops(photos, 1.5);
    expect(stops).toHaveLength(2);
    expect(stops[0].photoIds).toHaveLength(3);
    expect(stops[1].photoIds).toHaveLength(1);
  });
});

describe('clusterTrips', () => {
  test('ev fotoğraflarını eler, gezileri zaman boşluğuyla ayırır', () => {
    const tripStart = BASE + 20 * DAY + 3 * HOUR;
    const italy = [
      photo(ROME.lat, ROME.lng, tripStart),
      photo(ROME.lat, ROME.lng + 0.002, tripStart + 2 * HOUR),
      photo(FLORENCE.lat, FLORENCE.lng, tripStart + DAY),
      photo(ZURICH.lat, ZURICH.lng, tripStart + 2 * DAY),
    ];
    const laterStart = BASE + 45 * DAY + 3 * HOUR;
    const japan = [0, 1, 2].map(i => photo(35.68, 139.69, laterStart + i * HOUR));

    const trips = clusterTrips([...homePhotos(), ...italy, ...japan], {
      resolveCountry: resolveCountrySync,
    });

    expect(trips).toHaveLength(2);
    // En yeni gezi önce
    expect(trips[0].countries.map(c => c.code)).toEqual(['JP']);
    expect(trips[0].title).toBe('Japonya Seyahati');

    const italyTrip = trips[1];
    expect(italyTrip.photoCount).toBe(4);
    expect(italyTrip.stops).toHaveLength(3);
    expect(italyTrip.countries.map(c => c.code)).toEqual(['IT', 'CH']);
    expect(italyTrip.title).toBe('İtalya & İsviçre');
    expect(italyTrip.distanceKm).toBeGreaterThan(500);
  });

  test('yurt içi gezi (evden uzak) de gezi sayılır', () => {
    const t = BASE + 30 * DAY + HOUR;
    const kapadokya = [0, 1, 2, 3].map(i => photo(38.6431, 34.8289, t + i * HOUR));
    const trips = clusterTrips([...homePhotos(), ...kapadokya], { resolveCountry: resolveCountrySync });
    expect(trips).toHaveLength(1);
    expect(trips[0].title).toBe('Türkiye Seyahati');
  });

  test('az fotoğraflı kümeler ve geçersiz GPS elenir', () => {
    const trips = clusterTrips(
      [photo(0, 0, BASE), photo(ROME.lat, ROME.lng, BASE), photo(ROME.lat, ROME.lng, BASE + HOUR)],
      { home: null }
    );
    expect(trips).toHaveLength(0);
  });

  test('gezi kimliği deterministik (tekrar taramada aynı)', () => {
    const photos = [0, 1, 2].map(i => ({ id: `x${i}`, lat: ROME.lat, lng: ROME.lng, timestamp: BASE + i * HOUR, uri: '' }));
    expect(clusterTrips(photos, { home: null })[0].id).toBe(clusterTrips(photos, { home: null })[0].id);
  });
});

describe('formatDateRange', () => {
  test('aynı ay / farklı ay / farklı yıl', () => {
    expect(formatDateRange(new Date(2026, 8, 12).getTime(), new Date(2026, 8, 18).getTime())).toBe('12–18 Eyl 2026');
    expect(formatDateRange(new Date(2026, 8, 28).getTime(), new Date(2026, 9, 3).getTime())).toBe('28 Eyl – 3 Eki 2026');
    expect(formatDateRange(new Date(2025, 11, 30).getTime(), new Date(2026, 0, 2).getTime())).toBe(
      '30 Ara 2025 – 2 Oca 2026'
    );
  });
});

describe('parseExifGps', () => {
  test('Android ondalık + Ref', () => {
    expect(
      parseExifGps({ GPSLatitude: 38.71, GPSLatitudeRef: 'N', GPSLongitude: 9.13, GPSLongitudeRef: 'W' })
    ).toMatchObject({ lat: 38.71, lng: -9.13 });
  });

  test('Android rasyonel metin', () => {
    const r = parseExifGps({ GPSLatitude: '41/1,0/1,30/1', GPSLatitudeRef: 'N', GPSLongitude: '28/1,58/1,0/1' });
    expect(r.lat).toBeCloseTo(41.00833, 4);
    expect(r.lng).toBeCloseTo(28.96667, 4);
  });

  test('iOS iç içe {GPS} ve tarih', () => {
    const r = parseExifGps({
      '{GPS}': { Latitude: 22.9, LatitudeRef: 'S', Longitude: 43.2, LongitudeRef: 'W' },
      DateTimeOriginal: '2026:09:14 07:32:10',
    });
    expect(r).toMatchObject({ lat: -22.9, lng: -43.2 });
    expect(r.timestamp).toBe(new Date(2026, 8, 14, 7, 32, 10).getTime());
  });

  test('GPS yoksa konum dönmez', () => {
    expect(parseExifGps({ Make: 'Google' })).toEqual({ timestamp: undefined });
  });
});

describe('tripToStories', () => {
  test('durak başına kayıt, deterministik ID, fotoğraf örnekleme', () => {
    const t = BASE + 30 * DAY;
    const photos = Array.from({ length: 30 }, (_, i) => photo(ROME.lat, ROME.lng, t + i * 10 * 60 * 1000));
    const [trip] = clusterTrips(photos, { home: null, resolveCountry: resolveCountrySync });
    const uriMap = new Map(photos.map(p => [p.id, p.uri]));

    const stories = tripToStories(trip, uriMap);
    expect(stories).toHaveLength(1);
    expect(stories[0].id).toBe(`${trip.id}__${trip.stops[0].id}`);
    expect(stories[0].photoUris).toHaveLength(12);
    expect(stories[0].countryCode).toBe('IT');
    expect(stories[0].coords).toContain('° N');
    expect(tripToStories(trip, uriMap)[0].id).toBe(stories[0].id);
  });

  test('sampleEvenly', () => {
    expect(sampleEvenly([1, 2, 3], 5)).toEqual([1, 2, 3]);
    expect(sampleEvenly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5)).toEqual([0, 2, 4, 6, 8]);
  });
});
