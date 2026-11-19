// Tespit edilen gezileri haritadaki hikaye/durak kayıtlarına dönüştürür (saf fonksiyon).

import type { StoryDetail } from './localStore';
import { DetectedTrip, formatDateRange } from './tripClustering';
import { formatCoords } from './geo';

const MAX_PHOTOS_PER_STOP = 12;

/** Diziden en fazla `max` elemanı eşit aralıklarla seçer. */
export function sampleEvenly<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  return Array.from({ length: max }, (_, k) => items[Math.floor((k * items.length) / max)]);
}

/**
 * Bir gezinin her durağı için bir StoryDetail üretir.
 * ID'ler gezi + durak kimliğinden türetilir → aynı gezi tekrar aktarılırsa kayıt güncellenir, kopya oluşmaz.
 */
export function tripToStories(trip: DetectedTrip, photoUriById: Map<string, string>): StoryDetail[] {
  return trip.stops.map((stop, i) => {
    const uris = stop.photoIds
      .map(id => photoUriById.get(id))
      .filter((u): u is string => Boolean(u));

    return {
      id: `${trip.id}__${stop.id}`,
      tripId: trip.id,
      exif: `${trip.title} • EXIF`,
      date: formatDateRange(stop.startTime, stop.endTime),
      startTime: stop.startTime,
      title: trip.stops.length > 1 ? `${stop.country.name} • Durak ${i + 1}` : trip.title,
      coords: `${formatCoords(stop.lat, stop.lng)} • ${stop.country.name}`,
      weather: '',
      elev: '',
      count: `🖼️ ${stop.photoIds.length} Fotoğraf`,
      note: `"${trip.title} rotasından cihaz içi EXIF taramasıyla aktarıldı."`,
      category: 'exif',
      emoji: stop.country.flagEmoji,
      lat: stop.lat,
      lng: stop.lng,
      countryCode: stop.country.code !== 'UN' ? stop.country.code : undefined,
      photoUris: uris.length > 0 ? sampleEvenly(uris, MAX_PHOTOS_PER_STOP) : [stop.coverUri],
    };
  });
}
