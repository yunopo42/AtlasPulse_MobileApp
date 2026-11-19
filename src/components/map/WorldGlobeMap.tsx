import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme/ThemeContext';
import { StoryDetail } from '../../services/localStore';
import { TactileButton } from '../ui/TactileButton';
import { GlassBar } from '../ui/TactileCard';
import { env } from '../../config/env';
import { countryService } from '../../services/countryService';
import { haversineDistance } from '../../services/geo';

interface WorldGlobeMapProps {
  stories: Record<string, StoryDetail>;
  onSelectStory: (story: StoryDetail) => void;
  isAddPinMode: boolean;
  onMapClickForPin: (coords: { lat: number; lng: number }) => void;
  onCancelAddPin: () => void;
  activeStory: StoryDetail | null;
}

const MAPBOX_TOKEN = env.mapboxToken;

export const WorldGlobeMap: React.FC<WorldGlobeMapProps> = ({
  stories,
  onSelectStory,
  isAddPinMode,
  onMapClickForPin,
  onCancelAddPin,
  activeStory,
}) => {
  const { colors } = useTheme();
  const webViewRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Varsayılan olarak Atlas Haritası
  const [mapStyleMode, setMapStyleMode] = useState<'outdoors' | 'satellite' | 'dark'>('outdoors');

  const storiesList = Object.values(stories).filter(s => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  // Sıralı rota noktaları (Lizbon -> Dolomitler -> Krakow -> Kapadokya -> Kaş)
  const sortedStories = [...storiesList].sort((a, b) => (a.lng || 0) - (b.lng || 0));

  // Yalnızca BİZZAT duraklanan ülkeleri hesapla (Transit geçilenler ASLA sayılmaz)
  const countryStats = React.useMemo(() => {
    return countryService.calculateVisitedCountries(
      Object.values(stories).map(s => ({
        lat: s.lat,
        lng: s.lng,
        title: s.title,
      }))
    );
  }, [stories]);

  // Toplam rota mesafesi (ardışık duraklar arası gerçek km)
  const totalKm = React.useMemo(() => {
    let km = 0;
    for (let i = 1; i < sortedStories.length; i++) {
      km += haversineDistance(
        sortedStories[i - 1].lat,
        sortedStories[i - 1].lng,
        sortedStories[i].lat,
        sortedStories[i].lng
      );
    }
    return Math.round(km);
  }, [sortedStories]);

  const routeGeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: sortedStories.map(s => [s.lng, s.lat]),
    },
  };

  const markersData = storiesList.map(s => ({
    id: s.id,
    title: s.title,
    emoji: s.emoji,
    category: s.category,
    lat: s.lat,
    lng: s.lng,
  }));

  // HTML Web/Globe Şablonu
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet" />
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #070B14; }
    .custom-marker {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .custom-marker:hover, .custom-marker:active {
      transform: scale(1.18) translateY(-4px);
    }
    .marker-bubble {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      border: 2.5px solid #ffffff;
      box-shadow: 0 8px 20px rgba(0,0,0,0.45);
      position: relative;
    }
    .marker-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 14px;
      animation: pulseAnim 2s infinite;
      border: 2px solid rgba(255,255,255,0.7);
    }
    @keyframes pulseAnim {
      0% { transform: scale(1); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .marker-label {
      margin-top: 4px;
      background: rgba(15, 23, 42, 0.88);
      color: #F8FAFC;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      white-space: nowrap;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = '${MAPBOX_TOKEN}';

    let currentMode = '${mapStyleMode}';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/outdoors-v12', // Varsayılan Atlas
      center: [25.0, 42.0], // Akdeniz & Avrupa & Türkiye merkezli
      zoom: 3.2,
      pitch: 35, // 3D Keşif açısı
      projection: 'globe' // 3D Dünya Küresi
    });

    let currentMarkers = [];

    function setupRouteAndMarkers() {
      // Atmosfer Işığı
      if (currentMode === 'dark') {
        map.setFog({
          color: 'rgb(11, 14, 20)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.15,
          'space-color': 'rgb(7, 11, 20)',
          'star-intensity': 0.75
        });
      } else if (currentMode === 'satellite') {
        map.setFog({
          color: 'rgb(180, 210, 240)',
          'high-color': 'rgb(30, 90, 200)',
          'horizon-blend': 0.2,
          'space-color': 'rgb(10, 15, 30)',
          'star-intensity': 0.6
        });
      } else {
        // Outdoors / Atlas
        map.setFog({
          color: 'rgb(225, 240, 252)',
          'high-color': 'rgb(70, 140, 240)',
          'horizon-blend': 0.15,
          'space-color': 'rgb(185, 220, 255)',
          'star-intensity': 0.1
        });
      }

      // ROTA KATMANI (GeoJSON Kavisli Bağlantı Hattı)
      const routeData = ${JSON.stringify(routeGeoJson)};
      
      if (!map.getSource('travel-route')) {
        map.addSource('travel-route', {
          type: 'geojson',
          data: routeData
        });

        // Rota Parlaması
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'travel-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#0EA5E9',
            'line-width': 8,
            'line-opacity': 0.35,
            'line-blur': 4
          }
        });

        // Rota Ana Çizgisi (Kesikli Uçuş Çizgisi)
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'travel-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#F97316',
            'line-width': 3.5,
            'line-dasharray': [2, 2]
          }
        });
      }

      // Mevcut pinleri temizle ve yenilerini ekle
      currentMarkers.forEach(m => m.remove());
      currentMarkers = [];

      const markers = ${JSON.stringify(markersData)};
      const categoryColors = {
        drone: '#F97316',
        dive: '#0EA5E9',
        camp: '#22C55E',
        exif: '#8B5CF6',
        standard: '#F59E0B'
      };

      markers.forEach(m => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        const color = categoryColors[m.category] || '#F59E0B';
        el.innerHTML = \`
          <div class="marker-bubble" style="background: \${color};">
            <div class="marker-pulse"></div>
            <span>\${m.emoji}</span>
          </div>
          <div class="marker-label">\${m.title}</div>
        \`;

        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          map.flyTo({ center: [m.lng, m.lat], zoom: 6.5, speed: 1.4 });
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_PIN', id: m.id }));
        });

        const markerInstance = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([m.lng, m.lat])
          .addTo(map);

        currentMarkers.push(markerInstance);
      });
    }

    map.on('style.load', () => {
      setupRouteAndMarkers();
    });

    // Haritaya tıklama (Durak Ekleme Modu)
    let isAddPinActive = ${isAddPinMode ? 'true' : 'false'};
    map.on('click', (e) => {
      if (isAddPinActive) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_CLICK',
          lat: e.lngLat.lat,
          lng: e.lngLat.lng
        }));
      }
    });

    // React Native'den gelen mesajları dinleme (Kamerayı odakla, stil değiştir, zoom)
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'FLY_TO') {
          map.flyTo({ center: [data.lng, data.lat], zoom: 7.5, duration: 1800 });
        } else if (data.type === 'SET_STYLE') {
          currentMode = data.mode;
          map.setStyle('mapbox://styles/mapbox/' + data.style);
        } else if (data.type === 'ZOOM_IN') {
          map.zoomIn({ duration: 300 });
        } else if (data.type === 'ZOOM_OUT') {
          map.zoomOut({ duration: 300 });
        } else if (data.type === 'SET_ADD_PIN_MODE') {
          isAddPinActive = data.active;
        }
      } catch(e){}
    });
  </script>
</body>
</html>
  `;

  // Aktif durak değiştiğinde kamerayı otomatik oraya uçur
  useEffect(() => {
    if (activeStory && webViewRef.current) {
      const msg = JSON.stringify({
        type: 'FLY_TO',
        lat: activeStory.lat,
        lng: activeStory.lng,
      });
      webViewRef.current.postMessage(msg);
    }
  }, [activeStory]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_PIN') {
        const found = stories[data.id];
        if (found) onSelectStory(found);
      } else if (data.type === 'MAP_CLICK') {
        onMapClickForPin({ lat: data.lat, lng: data.lng });
      }
    } catch (err) {
      console.warn('WebView message error:', err);
    }
  };

  const handleStyleChange = (mode: 'outdoors' | 'satellite' | 'dark') => {
    setMapStyleMode(mode);
    const styleId =
      mode === 'dark'
        ? 'dark-v11'
        : mode === 'satellite'
        ? 'satellite-streets-v12'
        : 'outdoors-v12';
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: 'SET_STYLE', style: styleId, mode })
      );
    }
  };

  const handleZoom = (delta: 'in' | 'out') => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: delta === 'in' ? 'ZOOM_IN' : 'ZOOM_OUT' })
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Üst Telemetri ve Filtre Şeridi */}
      <View style={styles.topOverlay}>
        {/* 1. Satır: Telemetri HUD & Zoom Butonları */}
        <GlassBar style={styles.telemetryBar}>
          <View style={styles.telemetryLeft}>
            <View>
              <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                DÜNYA KEŞFİ
              </Text>
              <Text style={[styles.telemetryValue, { color: colors.sage }]}>
                {`${countryStats.percentageFormatted} `}
                <Text style={{ color: colors.textSub, fontSize: 11 }}>
                  {`(${countryStats.visitedCount} Ülke)`}
                </Text>
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderInk }]} />

            <View>
              <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                ROTA MESAFESİ
              </Text>
              <Text style={[styles.telemetryValue, { color: colors.textMain }]}>
                {`${totalKm.toLocaleString('tr-TR')} km`}
              </Text>
            </View>
          </View>

          {/* Zoom Butonları (+ / -) */}
          <View style={styles.zoomButtonsRow}>
            <TactileButton
              onPress={() => handleZoom('in')}
              variant="surface"
              size="sm"
              style={styles.zoomBtn}
            >
              +
            </TactileButton>
            <TactileButton
              onPress={() => handleZoom('out')}
              variant="surface"
              size="sm"
              style={styles.zoomBtn}
            >
              −
            </TactileButton>
          </View>
        </GlassBar>

        {/* 2. Satır: Harita Katmanı Seçici (Segmented Control - Asla Kaymaz, Ergonomik) */}
        <GlassBar style={styles.segmentedControlBar}>
          <Pressable
            onPress={() => handleStyleChange('outdoors')}
            style={[
              styles.segmentBtn,
              mapStyleMode === 'outdoors' && {
                backgroundColor: colors.azure,
                borderColor: colors.azureLip,
              },
            ]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                {
                  color: mapStyleMode === 'outdoors' ? '#FFFFFF' : colors.textSub,
                  fontWeight: mapStyleMode === 'outdoors' ? '900' : '700',
                },
              ]}
            >
              🗺️ Atlas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleStyleChange('satellite')}
            style={[
              styles.segmentBtn,
              mapStyleMode === 'satellite' && {
                backgroundColor: colors.azure,
                borderColor: colors.azureLip,
              },
            ]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                {
                  color: mapStyleMode === 'satellite' ? '#FFFFFF' : colors.textSub,
                  fontWeight: mapStyleMode === 'satellite' ? '900' : '700',
                },
              ]}
            >
              🛰️ Uydu
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleStyleChange('dark')}
            style={[
              styles.segmentBtn,
              mapStyleMode === 'dark' && {
                backgroundColor: colors.azure,
                borderColor: colors.azureLip,
              },
            ]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                {
                  color: mapStyleMode === 'dark' ? '#FFFFFF' : colors.textSub,
                  fontWeight: mapStyleMode === 'dark' ? '900' : '700',
                },
              ]}
            >
              🌙 Gece
            </Text>
          </Pressable>
        </GlassBar>

        {/* 3. Satır: Kategori Filtre Butonları */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TactileButton
            onPress={() => setSelectedCategory('all')}
            variant={selectedCategory === 'all' ? 'azure' : 'surface'}
            size="sm"
            style={styles.filterChip}
          >
            {`Tüm Rota (${Object.keys(stories).length})`}
          </TactileButton>

          <TactileButton
            onPress={() => setSelectedCategory('exif')}
            variant={selectedCategory === 'exif' ? 'azure' : 'surface'}
            size="sm"
            style={styles.filterChip}
          >
            📸 Fotoğraf EXIF
          </TactileButton>

          <TactileButton
            onPress={() => setSelectedCategory('drone')}
            variant={selectedCategory === 'drone' ? 'azure' : 'surface'}
            size="sm"
            style={styles.filterChip}
          >
            🚁 Drone & Hava
          </TactileButton>

          <TactileButton
            onPress={() => setSelectedCategory('dive')}
            variant={selectedCategory === 'dive' ? 'azure' : 'surface'}
            size="sm"
            style={styles.filterChip}
          >
            🤿 Kıyı & Dalış
          </TactileButton>

          <TactileButton
            onPress={() => setSelectedCategory('camp')}
            variant={selectedCategory === 'camp' ? 'azure' : 'surface'}
            size="sm"
            style={styles.filterChip}
          >
            ⛺ Doğa & Kamp
          </TactileButton>
        </ScrollView>

        {/* Durak Ekleme Modu Bilgi Bandı */}
        {isAddPinMode && (
          <View style={[styles.addPinBanner, { backgroundColor: colors.coral }]}>
            <Text style={styles.addPinBannerText}>
              📍 Dünyada istediğin noktaya dokunarak pinle!
            </Text>
            <Pressable onPress={onCancelAddPin}>
              <Text style={styles.addPinCancelText}>İptal</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 3D MAPBOX GL İNTERAKTİF DÜNYA KÜRESİ */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
    overflow: 'hidden',
  },
  topOverlay: {
    position: 'absolute',
    top: 8,
    left: 14,
    right: 14,
    zIndex: 20,
    gap: 8,
  },
  telemetryBar: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  divider: {
    width: 1.5,
    height: 24,
  },
  zoomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 12,
  },
  segmentedControlBar: {
    borderRadius: 16,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
  filterScroll: {
    gap: 6,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addPinBanner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  addPinBannerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  addPinCancelText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  webView: {
    flex: 1,
    backgroundColor: '#070B14',
  },
});
