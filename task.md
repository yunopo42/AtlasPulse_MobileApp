# AtlasPulse — Geliştirme Yol Haritası ve Görev Planı (task.md)

Bu doküman, **AtlasPulse** hibrit seyahat ve keşif uygulamasının teknik mimari (`atlaspulse_teknik_mimari_ve_veritaban_dok_man.md`) ve interaktif UI/UX tasarım prototipi (`atlaspulse_etkile_imli_ui_ux_mobil_prototipi.html`) referans alınarak Google Play Store'da yayına hazır hale getirilmesi için adım adım hazırlanmış resmi yol haritasıdır.

---

## 🎯 Proje Hedefi & Kapsam
- **Stack:** React Native (Expo SDK 58+), React 19, TypeScript, Custom Tactile 3D Styling, Expo Router & Native Stack
- **Local-First Mimari:** Cihaz içi EXIF tarama, Spatio-Temporal DBSCAN kümeleme, Yerel önbellek
- **Harita & Görselleştirme:** Kartografik vektör harita, choropleth ülke sınırları, kavisli rota yayları, özel pinler (Drone, Dalış, Kamp, EXIF)
- **Hikaye / Reels Stüdyo:** 9:16 dikey seyahat animasyon kanvası, canlı telemetri, Free (filigranlı) & Pro (filigransız)
- **Gamification & Pasaport:** Tırtıklı pullar, XP/Seviye takibi, başarı rozetleri, Pip kaşif maskotu
- **Monetization & Backend:** Supabase (Auth, PostgreSQL, PostGIS, Storage, RLS) + RevenueCat (Google Play Billing)
- **Play Store Ready:** Android App Bundle (`.aab`), Adaptive Icon, Splash Screen, İzinler, Veri Güvenliği

---

## 📋 Faz ve Görev Durumu

### 🟢 FAZ 1: Proje Altyapısı, Konfigürasyon ve Tasarım Sistemi
- [x] **Görev 1.1:** React Native / Expo projesinin başlatılması (`package.json`, `tsconfig.json`, `babel.config.js`)
- [x] **Görev 1.2:** Google Play Store uyumlu `app.json` ve `eas.json` yapılandırması (Paket Adı: `com.atlaspulse.app`, Android izinleri, adaptive icon, splash)
- [x] **Görev 1.3:** Tasarım Sistemi Kurulumu (`src/theme/colors.ts`, `src/theme/ThemeContext.tsx`, `TactileButton.tsx`, `TactileCard.tsx`, `GlassBar.tsx`)
- [x] **Görev 1.4:** Varlıklar ve İkon Sistemi (`src/components/mascot/PipMascot.tsx` animasyonlu kuşu, placeholder asset üretici `scripts/create-assets.js`)

---

### 🟢 FAZ 2: Supabase Backend & Yerel Veri Katmanı
- [x] **Görev 2.1:** Supabase Client ve ortam değişkenleri (`src/services/supabase.ts`, `.env` aktif ve canlı bağlantı doğrulandı ✓)
- [x] **Görev 2.2:** PostgreSQL + PostGIS Veritabanı Şeması ve RLS Güvenlik Politikaları migration dosyası (`supabase/migrations/20261118_initial_atlaspulse_schema.sql` Supabase'de başarıyla çalıştırıldı ✓)
- [x] **Görev 2.3:** Otomatik mesafe hesaplama trigger'ı (`ST_Distance`) ve geocoding fonksiyonları
- [x] **Görev 2.4:** Yerel Veri Deposu (Offline-First / Local-First Store: `src/services/localStore.ts` ve 5 amiral gemisi rota durağı)

---

### 🟢 FAZ 3: Ana Navigasyon ve Sekme Ekranları İskeleti
- [x] **Görev 3.1:** Yüzen alt cam bar (`src/components/layout/BottomTabBar.tsx`) ve 4 ana sekme geçişi:
  1. 🧭 **Atlas** (İnteraktif Harita)
  2. 🔍 **Tarayıcı** (EXIF & Kümeleme)
  3. 🎬 **Reels** (Dikey Video Stüdyosu)
  4. 🛂 **Pasaport** (Pullar ve Rozetler)
- [x] **Görev 3.2:** Üst Durum Çubuğu (`src/components/layout/AppHeader.tsx`: Pip Maskot, Seviye & Streak/XP sayacı, Free/Pro rozeti, Tema anahtarı)
- [x] **Görev 3.3:** Gamification Toast Bildirimi (`src/components/ui/CelebrationToast.tsx`) ve XP animasyon motoru

---

### 🟢 FAZ 4: Sekme 1 — Atlas (İnteraktif Kartografik Harita)
- [x] **Görev 4.1:** Kartografik Vektör Harita Motoru (`src/components/map/CartographicCanvas.tsx`: Izgara, eşyükselti halkaları, ziyaret edilen ülkeler Mint dolgusu)
- [x] **Görev 4.2:** Kavisli Rota Yayları (Kesikli animasyonlu seyahat çizgileri)
- [x] **Görev 4.3:** Fotoğraf Önizlemeli Özel Damla Pinler (Drone, Dalış, Kamp, EXIF, Standart) ve kategori filtreleme butonları
- [x] **Görev 4.4:** Expedition Story Sheet (`src/components/map/ExpeditionStorySheet.tsx`: EXIF künyesi, koordinatlar, rakım, hava durumu, fotoğraf kolajı ve el yazısı seyahat notu)
- [x] **Görev 4.5:** Yeni Keşif Durağı Ekleme Modalı (`src/components/map/NewPinModal.tsx`: Haritaya dokunarak koordinat alma, durak adı, emoji/kategori seçimi, rotaya bağlama, +XP, canlı PostGIS senkronizasyonu)

---

### 🟢 FAZ 5: Sekme 2 — Keşif Tarayıcı (Gizlilik Odaklı Cihaz İçi EXIF Kümeleme)
- [x] **Görev 5.1:** Cihaz Galeri İzinleri ve EXIF Okuma Servisi (`src/services/exifClustering.ts`)
- [x] **Görev 5.2:** Spatio-Temporal Kümeleme Algoritması (Haversine formülü, mesafe <50 km ve zaman <72 saat gezi birleştirme)
- [x] **Görev 5.3:** Tarama UI ve İlerleme Göstergesi (`src/screens/ScannerScreen.tsx`: Animasyonlu ilerleme çubuğu, bulunan gezi kartları listesi)
- [x] **Görev 5.4:** Seçilen Gezi Kümelerini Haritaya Aktarma Akışı ve XP ödül mekanizması

---

### 🟢 FAZ 6: Sekme 3 — Reels Stüdyo (9:16 Dikey Seyahat Video Motoru)
- [x] **Görev 6.1:** 9:16 Dikey Video Önizleme Kanvası (`src/screens/ReelsScreen.tsx`: Canlı telemetri HUD, polaroid fotoğraf kartı, ses dalgası animasyonu)
- [x] **Görev 6.2:** Stüdyo Kontrolleri (Animasyon hızı 1x/2x, Harita Temaları: Pastel Atlas, Uydu Hibrit, Gece Radarı)
- [x] **Görev 6.3:** Free & Pro Ayrımı: Dinamik filigran ('AtlasPulse' watermark) kontrolü
- [x] **Görev 6.4:** Reels Dışa Aktarım Akışı ve Pro Yükseltme Bottom Sheet'i (7 gün ücretsiz deneme, filigransız 4K/60FPS tanıtımı)

---

### 🟢 FAZ 7: Sekme 4 — Pasaport, Koleksiyon & Monetization
- [x] **Görev 7.1:** Açık Pasaport Kimlik Kartı (`src/screens/PassportScreen.tsx`: Dairesel keşif % halkası, seviye, toplam ülke ve kıta istatistiği)
- [x] **Görev 7.2:** Tırtıklı Ülke Posta Pulları Koleksiyonu (Damga tarihi, ISO kodu, bayrak, rotasyonlu pul yerleşimi)
- [x] **Görev 7.3:** Başarı Rozetleri Sistemi (Gökyüzü Gözcüsü, Mavi Yolcu, Kıtalararası rozetleri)
- [x] **Görev 7.4:** RevenueCat Entegrasyon Servisi (`src/services/revenueCat.ts`: Anahtar bağlandı ✓)

---

### 🟢 FAZ 8: Google Play Store Yayına Hazırlık & Dağıtım Yapılandırması
- [x] **Görev 8.1:** Android Proje Konfigürasyonu (`app.json` package: `com.atlaspulse.app`, permissions: Fine Location, Media Library)
- [x] **Görev 8.2:** Uygulama Simgesi (Adaptive Icon) ve Açılış Ekranı (Splash Screen) varlıklarının hazırlanması
- [x] **Görev 8.3:** `eas.json` oluşturulması ve Android App Bundle (`.aab`) üretim adımlarının dokümante edilmesi
- [x] **Görev 8.4:** Google Play Store Mağaza Girişi Kontrol Listesi & Veri Güvenliği Kılavuzu (`docs/PLAYSTORE_RELEASE_GUIDE.md`)

---

## 🔑 Canlı Entegrasyon Durumu
1. **Supabase:**
   - Proje URL: `https://ixslbqimlooejezehsxv.supabase.co`
   - Bağlantı Durumu: **Doğrulandı (HTTP 200 OK)**
   - Tablolar (`profiles`, `trips`, `waypoints`, `user_visited_regions`): **Hazır ve Erişilebilir**
2. **Mapbox:**
   - Public Token: `pk.eyJ1IjoieXVub3BvNDIi...`
   - Durum: **Doğrulandı (HTTP 200 OK)**
3. **RevenueCat:**
   - API Anahtarı: `[KALDIRILDI — gizli anahtar istemcide olmamalı, iptal edip yenisini oluşturun]`
   - Durum: **Entegre Edildi**

---

# 🔍 GERÇEKLİK DENETİMİ (19 Kasım 2026)

Yukarıdaki fazlar "tamamlandı" işaretli ama kod incelemesi farklı bir tablo gösteriyor. Ekranların çoğu **UI prototipi**; temel özellikler gerçek veriyle çalışmıyor.

| Alan | Durum | Bulgu |
|---|---|---|
| EXIF tarama | ❌ Çalışmıyor | `expo-media-library` v58 kök import'unda `getAssetsAsync` / `getAssetInfoAsync` **çalışma zamanında hata fırlatıyor** (legacy uyarı stub'ları). `MediaType.photo` ve `SortBy` yok (`tsc` hatası). Hata yutuluyor → "0 fotoğrafta GPS bulunamadı" + örnek kümeler gösteriliyor. |
| Android GPS izni | ❌ Eksik | `ACCESS_MEDIA_LOCATION` yok (`isAccessMediaLocationEnabled: true`). Android 10+ bu izin olmadan GPS'i siler. Expo Go da tam galeri erişimi vermez; **dev build şart**. |
| Kümeleme | ⚠️ Kaba | Her fotoğraf ayrı durak oluyor (500 m birleştirme yok), ev/gündelik fotoğraflar da "gezi" sayılıyor, yalnızca son 120 fotoğraf taranıyor. |
| Haritaya aktarma | ⚠️ Hatalı | ID'ler `Date.now()+i` → birden fazla gezi aktarılınca kayıtlar birbirinin üstüne yazılabiliyor. Hava/rakım sabit sahte değer. Batı/güney koordinatları "N/E" ile yazılıyor. |
| Ülke tespiti | ⚠️ Hatalı | Dikdörtgen sınır kutuları üst üste biniyor (İsviçre → Almanya, Rodos → Türkiye). |
| Reels | ❌ Sahte | Sabit SVG + emoji. Gerçek fotoğraf/rota yok, video üretimi yok, "Dışa aktar" yalnızca XP veriyor. |
| Pro / Ödeme | ❌ Sahte | `togglePro` ile herkes Pro olabiliyor; RevenueCat SDK yüklü değil. İstemcide **`sk_` gizli anahtarı** vardı → iptal edilmeli, `goog_` public key kullanılmalı. |
| Supabase senkron | ❌ Sessizce başarısız | Auth yok; RLS `auth.uid() = user_id` istiyor ve insert `user_id` göndermiyor. |
| Harita | ⚠️ | `WorldGlobeMap.tsx` içinde `GlassBar` import edilmemiş/dosya yok → render'da çöker. Mapbox GL WebView'den CDN ile yükleniyor (internetsiz çalışmaz). |
| Build | ❌ | `eas.json` projectId geçersiz (`eas init` gerekir). `tsc` 6 hata. `app/_layout` + `app/index` + `App.tsx` AppRoot'u iki kez sarabilir. |

---

# 🚀 APK'YA GİDEN YOL HARİTASI

## Sprint 0 — Derlenebilir temel (½ gün)
- [x] 0.1 `GlassBar` bileşenini oluştur / import et; `tsc --noEmit` sıfır hata
- [x] 0.2 Router girişini sadeleştir (`_layout` → `Slot`, `index` → AppRoot; `App.tsx` kaldır)
- [x] 0.3 Gömülü anahtarları koddan çıkar, sadece `.env` (EXPO_PUBLIC_*); RevenueCat `sk_` anahtarını iptal et
- [ ] 0.4 ✅ `expo-dev-client` eklendi · ⏳ `eas login` + `eas init` (projectId) ve `eas build -p android --profile development` ile ilk dev APK

## Sprint 1 — Gerçek EXIF tarama (1–2 gün) ✅ kod tamam, cihazda doğrulanacak
- [x] 1.1 `expo-media-library` yeni API'ye (`Query` / `Asset.getInfo`) veya `expo-media-library/legacy` importuna geç
- [x] 1.2 `app.json` plugin: `isAccessMediaLocationEnabled: true`; izin reddi/kısıtlı erişim UI'ı
- [x] 1.3 Sayfalı tarama (tüm galeri, iptal edilebilir, arka planda ilerleme), sonuçları önbelleğe al (artımlı tarama)
- [x] 1.4 Kümeleme v2: önce 500 m/aynı gün durak birleştirme, sonra gezi kümeleme; "ev konumu" tespiti ile gündelik fotoğrafları ele
- [x] 1.5 Durak verisi: gerçek tarih aralığı, fotoğraf URI listesi, kapak fotoğrafı, EXIF kamera modeli; sahte hava/rakım kaldır
- [x] 1.6 Ülke tespiti: offline Natural Earth (simplified GeoJSON) point-in-polygon; kutu listesini kaldır
- [x] 1.7 Benzersiz ID (uuid), koordinat biçimi (N/S/E/W), tekrar içe aktarmada çift kayıt engeli
- [x] 1.8 Saf fonksiyonlar için birim testleri (jest): haversine, kümeleme, ülke tespiti

## Sprint 2 — Veri modeli ve kalıcılık (1 gün)
- [ ] 2.1 `localStore` → Trip + Waypoint + MediaRef modeli (Supabase şemasıyla aynı); `expo-sqlite` önerilir
- [ ] 2.2 Örnek (INITIAL_STORIES) verileri yalnızca boş hesapta "demo" olarak göster
- [ ] 2.3 Pasaport istatistiklerini gerçek veriden hesapla

## Sprint 3 — Gerçek Reels (3–5 gün, en riskli kısım)
- [ ] 3.1 Seçilen gezinin gerçek fotoğrafları + rota ile animasyonlu önizleme (Reanimated + `@shopify/react-native-skia`)
- [ ] 3.2 Video dışa aktarma için teknik spike: Skia ile kare üretimi + Android MediaCodec kodlayıcı (Skia video kütüphanesi veya küçük Expo native modül). ffmpeg-kit arşivlendi, kaçınılmalı
- [ ] 3.3 1080×1920 MP4 export, filigran Free'de gerçekten videoya basılı
- [ ] 3.4 `expo-media-library` ile galeriye kaydet + `expo-sharing` ile paylaş
- [ ] 3.5 Müzik: lisanslı/telifsiz birkaç parça, ses kanalı ekleme

## Sprint 4 — Hesap, senkron, ödeme (2 gün) — APK testi için opsiyonel
- [ ] 4.1 Supabase Auth (anonim + e-posta/Google), profil oluşturma trigger'ı
- [ ] 4.2 Insert'lerde `user_id`, offline kuyruk ile senkron
- [ ] 4.3 `react-native-purchases` (RevenueCat), Pro durumunu entitlement'tan oku; `togglePro` yalnızca dev'de

## Sprint 5 — APK test sürümü (½ gün)
- [ ] 5.1 Gerçek ikon/splash, izin metinleri, çökme raporlama (Sentry vb.)
- [ ] 5.2 `eas build -p android --profile preview` → kurulabilir APK
- [ ] 5.3 Gerçek cihazda test senaryosu: 1000+ fotoğraflık galeri tarama, internetsiz açılış, video export
