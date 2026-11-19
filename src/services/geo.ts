// Saf coğrafi yardımcılar (React Native bağımlılığı yok → birim testlenebilir)

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Haversine formülü ile iki nokta arası büyük daire mesafesi (km). */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Ardışık noktalardan oluşan bir rotanın toplam uzunluğu (km). */
export function pathLengthKm(points: Array<{ lat: number; lng: number }>): number {
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    km += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return km;
}

/** "38.6431° N, 9.1301° W" biçiminde, işaretleri doğru yarımküreye çeviren koordinat metni. */
export function formatCoords(lat: number, lng: number, digits = 4): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(digits)}° ${ns}, ${Math.abs(lng).toFixed(digits)}° ${ew}`;
}

/** Geçerli bir GPS konumu mu? (0,0 "Null Island" ve aralık dışı değerler elenir) */
export function isValidGps(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}
