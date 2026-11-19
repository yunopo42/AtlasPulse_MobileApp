import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import Svg, {
  Defs,
  Pattern,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import { ChevronUp } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { StoryDetail } from '../../services/localStore';
import { TactileButton } from '../ui/TactileButton';
import { TactileCard, GlassBar } from '../ui/TactileCard';

interface CartographicCanvasProps {
  stories: Record<string, StoryDetail>;
  onSelectStory: (story: StoryDetail) => void;
  isAddPinMode: boolean;
  onMapClickForPin: (coords: { x: number; y: number }) => void;
  onCancelAddPin: () => void;
  activeStory: StoryDetail | null;
}

export const CartographicCanvas: React.FC<CartographicCanvasProps> = ({
  stories,
  onSelectStory,
  isAddPinMode,
  onMapClickForPin,
  onCancelAddPin,
  activeStory,
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(1.4, Math.max(0.85, prev + delta)));
  };

  const handleMapPress = (e: GestureResponderEvent) => {
    if (!isAddPinMode) return;
    const { locationX, locationY } = e.nativeEvent;
    onMapClickForPin({
      x: Math.round(locationX),
      y: Math.round(locationY),
    });
  };

  const filteredStories = Object.values(stories).filter(story => {
    if (selectedCategory === 'all') return true;
    return story.category === selectedCategory;
  });

  const getPinColor = (category: string) => {
    switch (category) {
      case 'drone':
        return colors.coral;
      case 'dive':
        return colors.azure;
      case 'camp':
        return colors.sage;
      case 'exif':
        return colors.violet;
      default:
        return colors.amber;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mapSea }]}>
      {/* Üst Telemetri & Kategori Filtreleri */}
      <View style={styles.topOverlay}>
        {/* İlerleme Özeti Şeridi */}
        <GlassBar style={styles.telemetryBar}>
          <View style={styles.telemetryLeft}>
            <View>
              <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                DÜNYA KEŞFİ
              </Text>
              <Text style={[styles.telemetryValue, { color: colors.sage }]}>
                {`%16.4 `}
                <Text style={{ color: colors.textSub, fontSize: 11 }}>
                  (32 Ülke)
                </Text>
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderInk }]} />

            <View>
              <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                MESAFE
              </Text>
              <Text style={[styles.telemetryValue, { color: colors.textMain }]}>
                48.920 km
              </Text>
            </View>
          </View>

          {/* Zoom Butonları */}
          <View style={styles.zoomButtons}>
            <TactileButton
              onPress={() => handleZoom(0.15)}
              variant="surface"
              size="sm"
              style={styles.zoomBtn}
            >
              +
            </TactileButton>
            <TactileButton
              onPress={() => handleZoom(-0.15)}
              variant="surface"
              size="sm"
              style={styles.zoomBtn}
            >
              −
            </TactileButton>
          </View>
        </GlassBar>

        {/* Kategori Filtre Butonları */}
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
            {`Tümü (${Object.keys(stories).length})`}
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
              📍 Haritada istediğin noktaya dokun!
            </Text>
            <Pressable onPress={onCancelAddPin}>
              <Text style={styles.addPinCancelText}>İptal</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* İnteraktif Kartografik Harita Yüzeyi */}
      <Pressable
        onPress={handleMapPress}
        style={[
          styles.mapSurface,
          { transform: [{ scale: zoomLevel }] },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 402 740">
          <Defs>
            <Pattern
              id="graticulePattern"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M 44 0 L 0 0 0 44"
                fill="none"
                stroke={colors.mapGraticule}
                strokeWidth="1"
              />
            </Pattern>
          </Defs>

          {/* Izgara */}
          <Rect width="402" height="740" fill="url(#graticulePattern)" />

          {/* Eşyükselti Halkaları */}
          <Circle
            cx="290"
            cy="335"
            r="85"
            fill="none"
            stroke={colors.mapGraticule}
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <Circle
            cx="155"
            cy="260"
            r="65"
            fill="none"
            stroke={colors.mapGraticule}
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />

          {/* Keşfedilmemiş Kıta Kütleleri */}
          <Path
            d="M25,180 Q75,165 110,205 T95,265 L35,255 Z"
            fill={colors.mapLand}
            stroke={colors.mapLandStroke}
            strokeWidth="1.5"
          />
          <Path
            d="M210,165 Q290,150 355,195 T330,260 L220,245 Z"
            fill={colors.mapLand}
            stroke={colors.mapLandStroke}
            strokeWidth="1.5"
          />
          <Path
            d="M215,415 Q305,400 355,465 T310,565 L225,530 Z"
            fill={colors.mapLand}
            stroke={colors.mapLandStroke}
            strokeWidth="1.5"
          />

          {/* Ziyaret Edilen Ülkeler (Pastel Mint Dolgu) */}
          {/* İber Yarımadası */}
          <Path
            d="M72,320 Q112,308 128,332 L118,372 Q82,375 72,320 Z"
            fill={colors.mapVisited}
            stroke={colors.mapVisitedStroke}
            strokeWidth="1.8"
          />
          {/* İtalya & Alpler */}
          <Path
            d="M138,245 Q176,232 188,262 L172,305 Q148,298 138,245 Z"
            fill={colors.mapVisited}
            stroke={colors.mapVisitedStroke}
            strokeWidth="1.8"
          />
          {/* Polonya & Orta Avrupa */}
          <Path
            d="M182,198 Q228,190 238,225 L220,252 Q185,248 182,198 Z"
            fill={colors.mapVisited}
            stroke={colors.mapVisitedStroke}
            strokeWidth="1.8"
          />
          {/* Türkiye & Ege/Akdeniz */}
          <Path
            d="M235,315 Q315,302 348,330 L336,366 Q252,372 235,315 Z"
            fill={colors.mapVisited}
            stroke={colors.mapVisitedStroke}
            strokeWidth="2"
          />

          {/* Kavisli Seyahat & Uçuş Rotaları */}
          <Path
            d="M98,342 Q125,275 162,265"
            fill="none"
            stroke={colors.azure}
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          <Path
            d="M162,265 Q185,232 208,222"
            fill="none"
            stroke={colors.violet}
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          <Path
            d="M208,222 Q265,255 298,332"
            fill="none"
            stroke={colors.coral}
            strokeWidth="2.8"
            strokeDasharray="6 6"
          />
          <Path
            d="M298,332 Q280,362 262,356"
            fill="none"
            stroke={colors.sage}
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
        </Svg>

        {/* Pin Katmanı */}
        {filteredStories.map(story => {
          const pinColor = getPinColor(story.category);
          return (
            <Pressable
              key={story.id}
              onPress={() => onSelectStory(story)}
              style={[
                styles.pinMarker,
                {
                  left: story.coordsPos?.x || 200,
                  top: story.coordsPos?.y || 300,
                },
              ]}
            >
              <View style={styles.pinWrapper}>
                <View
                  style={[
                    styles.pinIconBox,
                    {
                      backgroundColor: pinColor,
                    },
                  ]}
                >
                  <Text style={styles.pinEmoji}>{story.emoji}</Text>
                </View>
                <View
                  style={[
                    styles.pinLabel,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.borderInk,
                    },
                  ]}
                >
                  <Text
                    style={[styles.pinLabelText, { color: colors.textMain }]}
                    numberOfLines={1}
                  >
                    {story.title}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </Pressable>

      {/* Alt Mini Hızlı Kart (Detay çekmecesi kapalıyken) */}
      {!activeStory && (
        <View style={styles.bottomQuickCardContainer}>
          <Pressable onPress={() => onSelectStory(stories['kapadokya'] || Object.values(stories)[0])}>
            <TactileCard style={styles.bottomQuickCard}>
              <View style={styles.bottomCardInner}>
                <View
                  style={[
                    styles.bottomCardAvatar,
                    { backgroundColor: colors.bgSubtle },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>🎈</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.bottomCardSub, { color: colors.coral }]}>
                    SON DURAK • HİKAYEYİ AÇ
                  </Text>
                  <Text style={[styles.bottomCardTitle, { color: colors.textMain }]}>
                    Göreme & Kızılçukur Vadisi
                  </Text>
                  <Text style={[styles.bottomCardMeta, { color: colors.textSub }]}>
                    DJI Neo • 4K • 1.145m
                  </Text>
                </View>
                <View
                  style={[
                    styles.chevronBox,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.borderInk,
                    },
                  ]}
                >
                  <ChevronUp size={16} color={colors.textMain} />
                </View>
              </View>
            </TactileCard>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  zoomButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 12,
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
  mapSurface: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  pinMarker: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    zIndex: 10,
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pinIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  pinEmoji: {
    fontSize: 18,
  },
  pinLabel: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinLabelText: {
    fontSize: 9,
    fontWeight: '800',
    maxWidth: 90,
  },
  bottomQuickCardContainer: {
    position: 'absolute',
    bottom: 85,
    left: 14,
    right: 14,
    zIndex: 20,
  },
  bottomQuickCard: {
    padding: 12,
  },
  bottomCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCardSub: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bottomCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  bottomCardMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
