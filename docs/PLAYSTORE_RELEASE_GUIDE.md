# AtlasPulse — Google Play Store Yayına Çıkış Kılavuzu (Release & Deployment)

Bu doküman, **AtlasPulse** Android uygulamasının Google Play Store'da resmi olarak yayınlanması için adım adım izlenecek tüm teknik ve mağaza süreçlerini içerir.

---

## 1. Uygulama ve Paket Kimliği
- **Uygulama Adı:** AtlasPulse — Seyahat & Keşif Haritası
- **Paket Adı (Package Name):** `com.atlaspulse.app`
- **Versiyon (Version):** `1.0.0`
- **Versiyon Kodu (VersionCode):** `1`
- **Hedef SDK (Target SDK):** Android 14 (API 34+)
- **Minimum SDK (Min SDK):** Android 7.0 (API 24+)

---

## 2. Gerekli İzinler (Android Permissions)
`app.json` dosyasına eklenen izinlerin kullanım gerekçeleri:
1. `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`: Kullanıcının bulunduğu noktayı haritada anlık durak/pin olarak işaretleyebilmesi ve seyahat rotası oluşturabilmesi için.
2. `READ_MEDIA_IMAGES` & `READ_MEDIA_VIDEO`: Cihaz içi gizlilik odaklı EXIF zaman/koordinat taraması yaparak otomatik seyahat kümeleri oluşturabilmek için.
3. `CAMERA`: Keşif esnasında doğrudan durak fotoğrafı çekebilmek için.

---

## 3. Üretim Derlemesi (Android App Bundle - `.aab`) Üretimi

AtlasPulse projesinde Expo Application Services (EAS Build) yapılandırılmıştır.

### 3.1. EAS CLI Kurulumu ve Giriş
```bash
npm install -g eas-cli
eas login
```

### 3.2. Projeyi Yapılandırma & Keystore Oluşturma
```bash
eas build:configure
```
*(EAS sizin adınıza Google Play uyumlu güvenli bir Android Keystore oluşturur ve bulutta saklar.)*

### 3.3. Google Play İçin Production `.aab` Derleme
```bash
eas build --platform android --profile production
```
Derleme tamamlandığında EAS paneli üzerinden doğrudan Google Play Console'a yüklenebilir `.aab` dosyasını indirebilirsiniz.

---

## 4. Google Play Console Mağaza Girişi (Store Listing) Metinleri

### 4.1. Uygulama Başlığı (Max 30 Karakter)
`AtlasPulse: Seyahat & Keşif`

### 4.2. Kısa Açıklama (Max 80 Karakter)
`Fotoğraflarını interaktif haritalara ve dikey Reels videolarına dönüştür.`

### 4.3. Tam Açıklama (Full Description)
```text
AtlasPulse ile seyahatlerinizi sıfır eforla büyüleyici bir kaşif günlüğüne dönüştürün!

Gizlilik odaklı cihaz içi akıllı motoru sayesinde AtlasPulse, galerinizdeki fotoğrafların EXIF verilerini sunucuya yüklemeden tamamen telefonunuzda işler, seyahatlerinizi otomatik olarak duraklara ve rotalara kümeler.

ÖNE ÇIKAN ÖZELLİKLER:
🗺️ İnteraktif Kartografik Harita: Ziyaret ettiğiniz ülkeleri boyayın, uçuş ve seyahat yaylarınızı kavisli çizgilerle görselleştirin.
🎈 Özel Keşif Pinleri: Drone çekimlerinizi, tüplü/serbest dalışlarınızı, doğa kamplarınızı ve fotoğraf noktalarınızı özel damla pinlerle etiketleyin.
🎬 9:16 Dikey Seyahat Animasyonu (Reels Stüdyo): Seyahat rotanızı canlı telemetri, polaroid fotoğraflar ve müzik dalgasıyla Instagram Reels ve TikTok uyumlu dikey videolara dönüştürün.
🛂 Kaşif Pasaportu & Posta Pulları: Keşfettiğiniz ülkelerin tırtıklı nostaljik posta pullarını toplayın, dünya keşif yüzdenizi takip edin ve rozetler kazanın.
🔒 %100 Gizlilik ve Local-First: Fotoğraflarınız sunucuya yüklenmez, cihazınızda güvenle işlenir. İnternetsiz veya uçak modunda dahi kesintisiz çalışır.

Hemen indirin ve kendi dünya haritanızı keşfetmeye başlayın!
```

---

## 5. Google Play Veri Güvenliği (Data Safety) Yanıt Formu

Google Play Console'daki "Veri Güvenliği" formunu doldururken aşağıdaki beyanları girin:

| Veri Türü | Toplanıyor mu? | Paylaşılıyor mu? | Amacı | Şifreleniyor mu? | Kullanıcı Silebilir mi? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hassas Konum (Approximate & Precise Location)** | Evet (İsteğe bağlı) | Hayır | Uygulama işlevselliği (Durak ve rota çizimi) | Evet (Aktarımda HTTPS) | Evet |
| **Fotoğraflar ve Videolar** | Hayır (Lokal işlenir) | Hayır | Cihaz içinde EXIF meta veri okuma | N/A (Sunucuya gitmez) | Cihaz kontrolünde |
| **Kullanıcı Kimliği / E-posta** | Evet (Kayıt olunursa) | Hayır | Hesap yönetimi ve abonelik senkronizasyonu | Evet | Evet |
| **Satın Alma Geçmişi** | Evet (Pro abonelik) | Hayır | Google Play Billing yetkilendirmesi | Evet | Evet |

---

## 6. Yayın Öncesi Kontrol Listesi (Pre-Launch Checklist)
- [x] Paket adı: `com.atlaspulse.app`
- [x] Android Adaptive Icon ve Splash Screen tanımlandı.
- [x] İzin metinleri ve gizlilik beyanları hazırlandı.
- [x] Supabase veritabanı şeması ve PostGIS migration SQL'i hazır.
- [x] RevenueCat / Google Play Billing entegrasyon arayüzü hazır.
- [x] `.env.example` ve konfigürasyon değişkenleri belgelendi.
- [ ] Google Play Console'da "Internal Test" (Dahili Test) kanalına `.aab` yüklenmesi.
- [ ] 20 dahili test kullanıcısının tanımlanması (Google Play zorunlu testi).
