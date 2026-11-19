import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Download, Crown, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { TactileButton } from '../components/ui/TactileButton';
import { TactileCard } from '../components/ui/TactileCard';

type ReelsCanvasTheme = 'pastel' | 'hybrid' | 'radar';

export const ReelsScreen: React.FC = () => {
  const { colors, isPro, togglePro, addXp } = useTheme();
  const [reelsTheme, setReelsTheme] = useState<ReelsCanvasTheme>('pastel');
  const [isFastSpeed, setIsFastSpeed] = useState<boolean>(false);
  const [showProUpsell, setShowProUpsell] = useState<boolean>(false);

  // Ses dalgası animasyonları
  const barAnim1 = useRef(new Animated.Value(6)).current;
  const barAnim2 = useRef(new Animated.Value(12)).current;
  const barAnim3 = useRef(new Animated.Value(18)).current;
  const barAnim4 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, maxH: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxH,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 5,
            duration,
            useNativeDriver: false,
          }),
        ])
      );
    };

    const anim1 = createLoop(barAnim1, 18, 700);
    const anim2 = createLoop(barAnim2, 16, 500);
    const anim3 = createLoop(barAnim3, 20, 800);
    const anim4 = createLoop(barAnim4, 14, 600);

    anim1.start();
    anim2.start();
    anim3.start();
    anim4.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      anim4.stop();
    };
  }, []);

  const getCanvasBg = () => {
    switch (reelsTheme) {
      case 'pastel':
        return '#EAF4FA';
      case 'hybrid':
        return '#D1FAE5';
      case 'radar':
        return '#0F1726';
    }
  };

  const handleExport = () => {
    if (!isPro) {
      setShowProUpsell(true);
    } else {
      addXp(80, '4K Filigransız MP4 Galeriye Kaydedildi!');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgApp }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Başlık & Free vs Pro Anahtarı */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textMain }]}>
            Reels Stüdyo
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>
            9:16 Dikey Seyahat Animasyonu
          </Text>
        </View>

        <TactileButton
          onPress={togglePro}
          variant={isPro ? 'amber' : 'surface'}
          size="sm"
          style={styles.proToggleBtn}
        >
          <Crown size={13} color={isPro ? '#1E242B' : colors.amber} />
          <Text
            style={[
              styles.proToggleText,
              { color: isPro ? '#1E242B' : colors.textMain },
            ]}
          >
            {isPro ? 'PRO • 4K Filigransız' : 'Free • Filigranlı'}
          </Text>
        </TactileButton>
      </View>

      {/* 9:16 Canlı Video Önizleme Çerçevesi */}
      <View
        style={[
          styles.reelsCanvas,
          {
            backgroundColor: getCanvasBg(),
            borderColor: colors.borderInk,
          },
        ]}
      >
        {/* Arka Plan Rota Çizgisi SVG */}
        <Svg
          viewBox="0 0 300 365"
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
        >
          <Path
            d="M50,295 C95,235 165,205 245,88"
            fill="none"
            stroke="#F97316"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={isFastSpeed ? '6 6' : '10 8'}
          />
          <Circle cx="50" cy="295" r="7" fill="#0EA5E9" stroke="#fff" strokeWidth="2" />
          <Circle cx="152" cy="208" r="7" fill="#22C55E" stroke="#fff" strokeWidth="2" />
          <Circle cx="245" cy="88" r="9" fill="#F97316" stroke="#fff" strokeWidth="2.5" />
        </Svg>

        {/* Üst Canlı Telemetri HUD */}
        <View style={styles.canvasHeader}>
          <View style={styles.telemetryHUD}>
            <Text style={styles.hudLabel}>CANLI TELEMETRİ</Text>
            <Text style={styles.hudValue}>1.240 KM • 3 ÜLKE</Text>
          </View>

          <Pressable
            onPress={() => setIsFastSpeed(prev => !prev)}
            style={styles.speedPill}
          >
            <Text style={styles.speedPillText}>
              {isFastSpeed ? '2x Hız ⚡' : '1x Hız'}
            </Text>
          </Pressable>
        </View>

        {/* Ortada Yüzen Polaroid Fotoğraf Kartı */}
        <View style={styles.polaroidCard}>
          <View style={styles.polaroidPhoto}>
            <View style={styles.polaroidTag}>
              <Text style={styles.polaroidTagText}>📍 Kapadokya</Text>
            </View>
            <Text style={{ fontSize: 24 }}>🎈</Text>
          </View>
          <View style={styles.polaroidFooter}>
            <Text style={styles.polaroidCaption}>Altın Saat Uçuşu</Text>
            <Text style={styles.polaroidResBadge}>4K</Text>
          </View>
        </View>

        {/* Alt Müzik Waveform & Filigran */}
        <View style={styles.canvasFooter}>
          <View style={styles.audioWaveformBox}>
            <View style={styles.waveformBars}>
              <Animated.View style={[styles.waveBar, { height: barAnim1 }]} />
              <Animated.View style={[styles.waveBar, { height: barAnim2 }]} />
              <Animated.View style={[styles.waveBar, { height: barAnim3 }]} />
              <Animated.View style={[styles.waveBar, { height: barAnim4 }]} />
            </View>
            <Text style={styles.audioTitle}>Horizon Breeze</Text>
          </View>

          {/* Filigran (Pro'da gizlenir) */}
          {!isPro && (
            <View style={styles.watermarkBox}>
              <Text style={styles.watermarkText}>AtlasPulse</Text>
            </View>
          )}
        </View>
      </View>

      {/* Harita Teması Seçici */}
      <View style={styles.themeRow}>
        <TactileButton
          onPress={() => setReelsTheme('pastel')}
          variant={reelsTheme === 'pastel' ? 'azure' : 'surface'}
          size="sm"
          style={styles.themeBtn}
        >
          🗺️ Pastel Atlas
        </TactileButton>

        <TactileButton
          onPress={() => setReelsTheme('hybrid')}
          variant={reelsTheme === 'hybrid' ? 'azure' : 'surface'}
          size="sm"
          style={styles.themeBtn}
        >
          🛰️ Uydu Hibrit
        </TactileButton>

        <TactileButton
          onPress={() => setReelsTheme('radar')}
          variant={reelsTheme === 'radar' ? 'azure' : 'surface'}
          size="sm"
          style={styles.themeBtn}
        >
          🌌 Gece Radarı
        </TactileButton>
      </View>

      {/* Dışa Aktar Butonu */}
      <TactileButton
        onPress={handleExport}
        variant="coral"
        size="lg"
        style={styles.exportBtn}
      >
        <View style={styles.exportBtnInner}>
          <Download size={16} color="#FFF" />
          <Text style={styles.exportBtnText}>
            {isPro ? '4K Filigransız MP4 İndir' : 'MP4 Hikaye Dışa Aktar'}
          </Text>
        </View>
      </TactileButton>

      {/* Pro Yükseltme Çekmecesi */}
      {showProUpsell && (
        <TactileCard style={styles.upsellCard}>
          <View style={styles.upsellHeader}>
            <View style={styles.upsellBadge}>
              <Text style={styles.upsellBadgeText}>ATLASPULSE PRO</Text>
            </View>
            <Pressable
              onPress={() => setShowProUpsell(false)}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle }]}
            >
              <X size={14} color={colors.textSub} />
            </Pressable>
          </View>

          <Text style={[styles.upsellTitle, { color: colors.textMain }]}>
            Filigransız 4K Reels & Sınırsız EXIF
          </Text>
          <Text style={[styles.upsellSub, { color: colors.textSub }]}>
            Tüm seyahat videolarını 4K 60FPS filigransız dışa aktar, sınırsız geçmiş
            fotoğraf tara ve özel rozetleri aç.
          </Text>

          <TactileButton
            onPress={() => {
              setShowProUpsell(false);
              if (!isPro) togglePro();
            }}
            variant="amber"
            size="lg"
            style={styles.upsellActionBtn}
          >
            7 Gün Ücretsiz Dene (₺89,99/ay)
          </TactileButton>
        </TactileCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  proToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  proToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reelsCanvas: {
    width: '100%',
    height: 360,
    borderRadius: 28,
    borderWidth: 2,
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  telemetryHUD: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hudLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  hudValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  speedPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  speedPillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  polaroidCard: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 18,
    width: 175,
    alignSelf: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  polaroidPhoto: {
    height: 95,
    borderRadius: 12,
    backgroundColor: '#F97316',
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  polaroidTag: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  polaroidTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  polaroidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  polaroidCaption: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  polaroidResBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F97316',
  },
  canvasFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  audioWaveformBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
  },
  audioTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
  },
  watermarkBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  watermarkText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeBtn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  exportBtn: {
    width: '100%',
    marginTop: 12,
  },
  exportBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  upsellCard: {
    marginTop: 16,
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  upsellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upsellBadge: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  upsellBadgeText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '900',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  upsellSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 16,
  },
  upsellActionBtn: {
    width: '100%',
    marginTop: 12,
  },
});
