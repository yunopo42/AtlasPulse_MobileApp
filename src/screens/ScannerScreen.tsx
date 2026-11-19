import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { ScanSearch, MapPin, Check, Image as ImageIcon, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { TactileButton } from '../components/ui/TactileButton';
import { TactileCard } from '../components/ui/TactileCard';
import { DetectedTrip, formatDateRange } from '../services/tripClustering';
import { realGalleryService } from '../services/realGalleryService';
import { resolveCountrySync } from '../services/countryService';
import { tripToStories } from '../services/tripImport';
import { formatCoords } from '../services/geo';
import { localStore, StoryDetail } from '../services/localStore';

interface ScannerScreenProps {
  onImportComplete?: () => void;
}

type SelectableTrip = DetectedTrip & { selected: boolean };

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onImportComplete }) => {
  const { colors, addXp } = useTheme();
  const [trips, setTrips] = useState<SelectableTrip[]>([]);
  const [photoUriById, setPhotoUriById] = useState<Map<string, string>>(new Map());
  const [importedTripIds, setImportedTripIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTitle, setScanTitle] = useState('Telefon Galerisi Taramaya Hazır');
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const applyTrips = (detected: DetectedTrip[], imported: Set<string>) => {
    setTrips(detected.map(t => ({ ...t, selected: !imported.has(t.id) })));
  };

  // Açılışta önceki taramanın sonuçlarını göster (galeriyi yeniden okumadan)
  useEffect(() => {
    (async () => {
      const stories = await localStore.getStories();
      const imported = new Set(
        Object.values(stories)
          .map(s => s.tripId)
          .filter((id): id is string => Boolean(id))
      );
      setImportedTripIds(imported);

      const cached = await realGalleryService.getCachedTrips();
      if (cached) {
        setPhotoUriById(cached.photoUriById);
        applyTrips(cached.trips, imported);
        setScanProgress(1);
        setScanTitle(`${cached.trips.length} gezi • ${cached.gpsPhotoCount} konumlu fotoğraf`);
      }
    })();
  }, []);

  const handleScan = async (full = false) => {
    if (isScanning) {
      cancelRef.current = true;
      return;
    }
    cancelRef.current = false;
    setIsScanning(true);
    setScanProgress(0);
    setInfoNotice(null);

    const result = await realGalleryService.scanGallery({
      full,
      onProgress: (progress, label) => {
        setScanProgress(progress);
        setScanTitle(label);
      },
      isCancelled: () => cancelRef.current,
    });
    setIsScanning(false);

    if (result.permission === 'denied') {
      setScanTitle('Galeri İzni Verilmedi');
      setInfoNotice(
        'Fotoğraflardaki GPS konumunu okuyabilmek için Ayarlar > Uygulamalar > AtlasPulse > İzinler bölümünden fotoğraf iznini "Tümüne izin ver" olarak açın.'
      );
      return;
    }
    if (result.error) {
      setScanTitle('Tarama Başarısız');
      setInfoNotice(
        `Galeri okunamadı: ${result.error}. Expo Go yerine geliştirme sürümünü (dev build) kullandığınızdan emin olun.`
      );
      return;
    }

    setPhotoUriById(result.photoUriById);
    applyTrips(result.trips, importedTripIds);

    if (result.permission === 'limited') {
      setInfoNotice(
        'Yalnızca seçtiğiniz fotoğraflara erişim izni var. Tüm gezileri bulmak için galeri iznini "Tümüne izin ver" yapın.'
      );
    }

    if (result.trips.length > 0) {
      setScanTitle(`${result.cancelled ? 'Durduruldu' : 'Tamamlandı'} • ${result.trips.length} gezi bulundu`);
      if (!result.cancelled && result.totalScanned > 0) {
        addXp(100, `${result.gpsPhotoCount} GPS Konumlu Fotoğraf Kümelendi!`);
      }
    } else if (result.gpsPhotoCount === 0) {
      setScanTitle('Konumlu Fotoğraf Bulunamadı');
      setInfoNotice(
        `${result.totalScanned} fotoğraf tarandı ama hiçbirinde GPS bilgisi yok. Kamera ayarlarından "Konum etiketi"ni açın; WhatsApp gibi uygulamalarla gelen fotoğraflarda konum silinmiş olur.`
      );
    } else {
      setScanTitle('Gezi Bulunamadı');
      setInfoNotice(
        `${result.gpsPhotoCount} konumlu fotoğraf var ama hepsi ev çevrenizde görünüyor. Seyahatlerde çekilen fotoğraflar eklendikçe geziler burada belirecek.`
      );
    }
  };

  const handlePickSinglePhoto = async () => {
    const picked = await realGalleryService.pickPhoto();
    if (!picked) return;
    if (picked.lat === undefined || picked.lng === undefined) {
      setInfoNotice(
        'Seçilen fotoğrafta GPS konumu yok. Haritadaki "Durak" butonuyla konumu elle işaretleyebilirsiniz.'
      );
      return;
    }
    const country = resolveCountrySync(picked.lat, picked.lng);
    const ts = picked.timestamp ?? Date.now();
    const story: StoryDetail = {
      id: `photo_${picked.uri.split('/').pop()}_${ts}`,
      exif: 'Galeri • EXIF GPS',
      date: formatDateRange(ts, ts),
      startTime: ts,
      title: `${country.name} Anısı`,
      coords: `${formatCoords(picked.lat, picked.lng)} • ${country.name}`,
      weather: '',
      elev: '',
      count: '🖼️ 1 Fotoğraf',
      note: '"Galeriden seçilen fotoğrafın konumundan eklendi."',
      category: 'exif',
      emoji: country.flagEmoji,
      lat: picked.lat,
      lng: picked.lng,
      countryCode: country.code !== 'UN' ? country.code : undefined,
      photoUris: [picked.uri],
    };
    await localStore.saveStory(story);
    addXp(30, `${country.name} fotoğrafı haritaya pinlendi!`);
    onImportComplete?.();
  };

  const toggleTrip = (id: string) => {
    setTrips(prev => prev.map(t => (t.id === id ? { ...t, selected: !t.selected } : t)));
  };

  const handleImportToMap = async () => {
    const selected = trips.filter(t => t.selected);
    if (selected.length === 0) {
      setInfoNotice('Haritaya aktarmak için en az bir gezi seçin.');
      return;
    }

    const stories = selected.flatMap(t => tripToStories(t, photoUriById));
    await localStore.saveStories(stories);

    const newlyImported = selected.filter(t => !importedTripIds.has(t.id)).length;
    setImportedTripIds(prev => new Set([...prev, ...selected.map(t => t.id)]));
    if (newlyImported > 0) {
      addXp(120, `${newlyImported} Gezi Rotası Dünya Haritasına Eklendi!`);
    }
    onImportComplete?.();
  };

  const selectedCount = trips.filter(t => t.selected).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgApp }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Başlık & Gizlilik Rozeti */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textMain }]}>Keşif Tarayıcı</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>
            Gizlilik odaklı cihaz içi EXIF kümeleme
          </Text>
        </View>
        <View style={[styles.privacyBadge, { backgroundColor: colors.bgSubtle }]}>
          <Text style={[styles.privacyBadgeText, { color: colors.sage }]}>🔒 %100 Cihaz İçi</Text>
        </View>
      </View>

      {/* Tarama Durum Kartı */}
      <TactileCard style={styles.scanCard}>
        <View style={styles.scanCardInner}>
          <View style={styles.scanCardLeft}>
            <View style={[styles.scanIconBox, { backgroundColor: colors.azure }]}>
              <ScanSearch size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.scanTitle, { color: colors.textMain }]}>{scanTitle}</Text>
              <Text style={[styles.scanSub, { color: colors.textSub }]}>GPS + Tarih EXIF meta verisi</Text>
            </View>
          </View>

          <TactileButton
            onPress={() => handleScan(false)}
            variant={isScanning ? 'coral' : 'azure'}
            size="sm"
          >
            {isScanning ? 'Durdur' : trips.length > 0 ? 'Güncelle' : 'Galeriyi Tara'}
          </TactileButton>
        </View>

        <View style={[styles.progressBarTrack, { backgroundColor: colors.bgSubtle }]}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: colors.sage, width: `${scanProgress * 100}%` },
            ]}
          />
        </View>

        {!isScanning && trips.length > 0 && (
          <Pressable onPress={() => handleScan(true)} style={styles.fullRescan}>
            <Text style={[styles.fullRescanText, { color: colors.textMuted }]}>
              Tüm galeriyi baştan tara
            </Text>
          </Pressable>
        )}

        {infoNotice && (
          <View style={[styles.noticeBox, { backgroundColor: colors.bgSubtle }]}>
            <AlertCircle size={15} color={colors.amber} />
            <Text style={[styles.noticeText, { color: colors.textSub }]}>{infoNotice}</Text>
          </View>
        )}
      </TactileCard>

      {/* Galeriden Tek Fotoğraf */}
      <TactileButton onPress={handlePickSinglePhoto} variant="surface" size="md" style={styles.pickPhotoBtn}>
        <View style={styles.pickPhotoBtnInner}>
          <ImageIcon size={16} color={colors.textMain} />
          <Text style={[styles.pickPhotoText, { color: colors.textMain }]}>
            Galeriden Fotoğraf Seç ve Pinle
          </Text>
        </View>
      </TactileButton>

      {trips.length > 0 && (
        <>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            {`TESPİT EDİLEN GEZİLER (${trips.length})`}
          </Text>

          <View style={styles.clusterList}>
            {trips.map(trip => {
              const imported = importedTripIds.has(trip.id);
              return (
                <Pressable key={trip.id} onPress={() => toggleTrip(trip.id)}>
                  <TactileCard style={[styles.clusterCard, trip.selected && { borderColor: colors.sage }]}>
                    <View style={styles.clusterRow}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: trip.selected ? colors.sage : colors.borderInk,
                            backgroundColor: trip.selected ? colors.sage : 'transparent',
                          },
                        ]}
                      >
                        {trip.selected && <Check size={13} color="#FFF" strokeWidth={3} />}
                      </View>

                      <Image source={{ uri: trip.coverUri }} style={styles.cover} />

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.clusterTitle, { color: colors.textMain }]} numberOfLines={1}>
                          {`${trip.emoji} ${trip.title}`}
                        </Text>
                        <Text style={[styles.clusterSub, { color: colors.textSub }]} numberOfLines={1}>
                          {trip.dateRange}
                        </Text>
                        <Text style={[styles.clusterSub, { color: colors.textSub }]} numberOfLines={1}>
                          {`${trip.photoCount} foto • ${trip.stops.length} durak • ${trip.distanceKm.toLocaleString('tr-TR')} km`}
                        </Text>
                      </View>

                      {imported && (
                        <View style={[styles.importedBadge, { backgroundColor: colors.bgSubtle }]}>
                          <Text style={[styles.importedText, { color: colors.sage }]}>Haritada</Text>
                        </View>
                      )}
                    </View>
                  </TactileCard>
                </Pressable>
              );
            })}
          </View>

          <TactileButton onPress={handleImportToMap} variant="sage" size="lg" style={styles.importBtn}>
            <View style={styles.importBtnInner}>
              <MapPin size={16} color="#FFF" />
              <Text style={styles.importBtnText}>{`Seçilen ${selectedCount} Geziyi Haritaya Aktar`}</Text>
            </View>
          </TactileButton>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  privacyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  privacyBadgeText: { fontSize: 10, fontWeight: '900' },
  scanCard: { marginBottom: 14 },
  scanCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scanCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  scanIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontSize: 13, fontWeight: '900' },
  scanSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  progressBarTrack: { height: 8, borderRadius: 4, marginTop: 14, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  fullRescan: { alignSelf: 'flex-end', marginTop: 8 },
  fullRescanText: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
  },
  noticeText: { fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 15 },
  pickPhotoBtn: { marginBottom: 16 },
  pickPhotoBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickPhotoText: { fontSize: 12, fontWeight: '800' },
  sectionHeading: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 10 },
  clusterList: { gap: 10, marginBottom: 18 },
  clusterCard: { padding: 12 },
  clusterRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: { width: 52, height: 52, borderRadius: 12, marginLeft: 10, backgroundColor: '#CBD5E1' },
  clusterTitle: { fontSize: 14, fontWeight: '900' },
  clusterSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  importedBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginLeft: 6 },
  importedText: { fontSize: 9, fontWeight: '900' },
  importBtn: { width: '100%' },
  importBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  importBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
