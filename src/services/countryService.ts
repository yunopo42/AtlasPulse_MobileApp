// AtlasPulse — Çevrimdışı Ülke Tespiti ve Keşif Yüzdesi
// Gerçek ülke sınırları (country-coder, OSM tabanlı poligonlar) ile cihaz içinde, internetsiz çözülür.
// Yalnızca BİZZAT duraklanan/fotoğraf çekilen ülkeler sayılır; transit geçişler sayılmaz.

import { iso1A2Code, feature } from '@rapideditor/country-coder';

export const TOTAL_WORLD_COUNTRIES = 195; // BM üyesi + gözlemci devletler

export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2 (örn: TR) — bulunamazsa 'UN'
  name: string; // Türkçe ad (yoksa İngilizce)
  flagEmoji: string;
}

export interface VisitedCountryInfo extends CountryInfo {
  waypointCount: number;
}

// Intl.DisplayNames her JS motorunda yok; sık görülen ülkeler için Türkçe ad tablosu.
const TR_NAMES: Record<string, string> = {
  TR: 'Türkiye', GR: 'Yunanistan', BG: 'Bulgaristan', GE: 'Gürcistan', AZ: 'Azerbaycan',
  CY: 'Kıbrıs', IT: 'İtalya', FR: 'Fransa', DE: 'Almanya', ES: 'İspanya', PT: 'Portekiz',
  GB: 'Birleşik Krallık', IE: 'İrlanda', NL: 'Hollanda', BE: 'Belçika', LU: 'Lüksemburg',
  CH: 'İsviçre', AT: 'Avusturya', PL: 'Polonya', CZ: 'Çekya', SK: 'Slovakya', HU: 'Macaristan',
  RO: 'Romanya', RS: 'Sırbistan', HR: 'Hırvatistan', SI: 'Slovenya', BA: 'Bosna-Hersek',
  ME: 'Karadağ', AL: 'Arnavutluk', MK: 'Kuzey Makedonya', XK: 'Kosova', DK: 'Danimarka',
  NO: 'Norveç', SE: 'İsveç', FI: 'Finlandiya', IS: 'İzlanda', EE: 'Estonya', LV: 'Letonya',
  LT: 'Litvanya', UA: 'Ukrayna', RU: 'Rusya', MT: 'Malta', MC: 'Monako', VA: 'Vatikan',
  EG: 'Mısır', MA: 'Fas', TN: 'Tunus', ZA: 'Güney Afrika', KE: 'Kenya', TZ: 'Tanzanya',
  AE: 'Birleşik Arap Emirlikleri', SA: 'Suudi Arabistan', QA: 'Katar', JO: 'Ürdün',
  IL: 'İsrail', IR: 'İran', IQ: 'Irak', SY: 'Suriye', LB: 'Lübnan', JP: 'Japonya',
  CN: 'Çin', KR: 'Güney Kore', TH: 'Tayland', VN: 'Vietnam', ID: 'Endonezya', MY: 'Malezya',
  SG: 'Singapur', PH: 'Filipinler', IN: 'Hindistan', NP: 'Nepal', LK: 'Sri Lanka',
  MV: 'Maldivler', US: 'Amerika Birleşik Devletleri', CA: 'Kanada', MX: 'Meksika',
  BR: 'Brezilya', AR: 'Arjantin', CL: 'Şili', PE: 'Peru', CO: 'Kolombiya', CU: 'Küba',
  AU: 'Avustralya', NZ: 'Yeni Zelanda', UZ: 'Özbekistan', KZ: 'Kazakistan', KG: 'Kırgızistan',
};

let displayNames: { of(code: string): string | undefined } | null = null;
try {
  const DN = (Intl as any).DisplayNames;
  if (DN) displayNames = new DN(['tr'], { type: 'region' });
} catch {
  displayNames = null;
}

export function getFlagEmoji(countryCode: string): string {
  if (!/^[A-Z]{2}$/.test(countryCode)) return '🌍';
  return String.fromCodePoint(...countryCode.split('').map(c => 127397 + c.charCodeAt(0)));
}

export function countryName(code: string, fallback?: string): string {
  if (TR_NAMES[code]) return TR_NAMES[code];
  try {
    const n = displayNames?.of(code);
    if (n && n !== code) return n;
  } catch {
    // yoksay
  }
  return fallback || code;
}

const UNKNOWN: CountryInfo = { code: 'UN', name: 'Açık Deniz / Bölge', flagEmoji: '🌍' };
const cache = new Map<string, CountryInfo>();

/** Koordinattan ülke bilgisi (senkron, çevrimdışı). ~1 km hassasiyetle önbelleklenir. */
export function resolveCountrySync(lat: number, lng: number): CountryInfo {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let info = UNKNOWN;
  try {
    const loc: [number, number] = [lng, lat];
    const code = iso1A2Code(loc, { level: 'territory' }) ?? iso1A2Code(loc);
    if (code) {
      const en = feature(loc, { level: 'territory' })?.properties?.nameEn;
      info = { code, name: countryName(code, en), flagEmoji: getFlagEmoji(code) };
    }
  } catch (err) {
    console.warn('[Country] çözümleme hatası:', err);
  }
  cache.set(key, info);
  return info;
}

export const countryService = {
  async resolveCountry(lat: number, lng: number): Promise<CountryInfo> {
    return resolveCountrySync(lat, lng);
  },

  // Yalnızca BİZZAT duraklanan/fotoğraf çekilen tekil ülkeleri hesaplar
  calculateVisitedCountries(
    waypoints: Array<{ lat: number; lng: number; country_code?: string; title?: string }>
  ): {
    uniqueCountries: VisitedCountryInfo[];
    visitedCount: number;
    percentage: number;
    percentageFormatted: string;
  } {
    const map = new Map<string, VisitedCountryInfo>();

    for (const wp of waypoints) {
      const info = wp.country_code
        ? { code: wp.country_code, name: countryName(wp.country_code), flagEmoji: getFlagEmoji(wp.country_code) }
        : resolveCountrySync(wp.lat, wp.lng);
      if (info.code === 'UN') continue;

      const existing = map.get(info.code);
      if (existing) existing.waypointCount += 1;
      else map.set(info.code, { ...info, waypointCount: 1 });
    }

    const uniqueCountries = Array.from(map.values());
    const visitedCount = uniqueCountries.length;
    const percentage = Number(((visitedCount / TOTAL_WORLD_COUNTRIES) * 100).toFixed(1));

    return { uniqueCountries, visitedCount, percentage, percentageFormatted: `%${percentage}` };
  },
};
