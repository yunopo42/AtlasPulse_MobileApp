// Ortam değişkenleri tek noktadan okunur. Anahtarlar koda gömülmez; `.env` dosyasından gelir.
// Not: EXPO_PUBLIC_* değerleri uygulama paketine gömülür, buraya yalnızca public anahtarlar konmalıdır.

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
};

if (__DEV__) {
  const missing = Object.entries(env)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.warn('[env] Eksik ortam değişkenleri:', missing.join(', '));
  }
}
