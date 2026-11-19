import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { TactileCard } from '../components/ui/TactileCard';

interface StampItem {
  id: string;
  country: string;
  code: string;
  coords: string;
  emoji: string;
  date: string;
  color: string;
  rotation: string;
}

const STAMPS: StampItem[] = [
  {
    id: 'tr',
    country: 'Türkiye',
    code: 'TR',
    coords: '38°N',
    emoji: '🇹🇷',
    date: '14.09.26',
    color: '#F97316',
    rotation: '-2deg',
  },
  {
    id: 'pl',
    country: 'Polonya',
    code: 'PL',
    coords: '50°N',
    emoji: '🇵🇱',
    date: '09.05.26',
    color: '#0EA5E9',
    rotation: '2deg',
  },
  {
    id: 'it',
    country: 'İtalya',
    code: 'IT',
    coords: '46°N',
    emoji: '🇮🇹',
    date: '22.08.26',
    color: '#22C55E',
    rotation: '-1deg',
  },
];

interface BadgeItem {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  isUnlocked: boolean;
  progressText?: string;
}

const BADGES: BadgeItem[] = [
  {
    id: 'b1',
    title: 'Gökyüzü Gözcüsü',
    desc: '5 farklı ülkede drone uçuşu kaydet',
    emoji: '🚁',
    isUnlocked: true,
  },
  {
    id: 'b2',
    title: 'Mavi Yolcu',
    desc: '5 kıyı & dalış noktasını tamamla',
    emoji: '🌊',
    isUnlocked: false,
    progressText: '4 / 5',
  },
  {
    id: 'b3',
    title: 'Kıtalararası',
    desc: 'En az 2 farklı kıtada rota oluştur',
    emoji: '🌍',
    isUnlocked: true,
  },
];

export const PassportScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgApp }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Açık Pasaport Kimlik Kartı */}
      <TactileCard style={styles.passportCard}>
        <View style={styles.passportRow}>
          {/* Dünya % Halka Göstergesi */}
          <View style={styles.circleProgressBox}>
            <Svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle
                cx={28}
                cy={28}
                r={23}
                fill="none"
                stroke={colors.bgSubtle}
                strokeWidth={5}
              />
              <Circle
                cx={28}
                cy={28}
                r={23}
                fill="none"
                stroke={colors.sage}
                strokeWidth={5}
                strokeDasharray="144"
                strokeDashoffset="118"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.circlePercentText, { color: colors.textMain }]}>
              %16
            </Text>
          </View>

          {/* Pasaport Bilgileri */}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.passportTitleRow}>
              <Text style={[styles.passportTitle, { color: colors.textMain }]}>
                Kaşif Pasaportu
              </Text>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: colors.bgSubtle },
                ]}
              >
                <Text style={[styles.levelBadgeText, { color: colors.amber }]}>
                  SEVİYE 12
                </Text>
              </View>
            </View>

            <Text style={[styles.passportStats, { color: colors.textSub }]}>
              32 ÜLKE • 4 KITA • 🔥 14 GÜN
            </Text>
          </View>
        </View>
      </TactileCard>

      {/* Tırtıklı Ülke Posta Pulları */}
      <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
        TOPLANAN ÜLKE PULLARI
      </Text>

      <View style={styles.stampsGrid}>
        {STAMPS.map(stamp => (
          <View
            key={stamp.id}
            style={[
              styles.stampItem,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.borderInk,
                transform: [{ rotate: stamp.rotation }],
              },
            ]}
          >
            <Text style={[styles.stampCoord, { color: stamp.color }]}>
              {stamp.code} • {stamp.coords}
            </Text>
            <Text style={styles.stampEmoji}>{stamp.emoji}</Text>
            <Text style={[styles.stampCountry, { color: colors.textMain }]}>
              {stamp.country}
            </Text>
            <View
              style={[
                styles.stampDateBadge,
                { backgroundColor: colors.bgSubtle },
              ]}
            >
              <Text style={[styles.stampDateText, { color: colors.textSub }]}>
                {stamp.date}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Keşif Rozetleri */}
      <Text style={[styles.sectionHeading, { color: colors.textMuted, marginTop: 14 }]}>
        KEŞİF ROZETLERİ
      </Text>

      <View style={styles.badgeList}>
        {BADGES.map(badge => (
          <TactileCard key={badge.id} style={styles.badgeCard}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badgeEmojiBox,
                  { backgroundColor: colors.bgSubtle },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{badge.emoji}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.badgeTitle, { color: colors.textMain }]}>
                  {badge.title}
                </Text>
                <Text style={[styles.badgeDesc, { color: colors.textSub }]}>
                  {badge.desc}
                </Text>
              </View>

              {badge.isUnlocked ? (
                <View style={[styles.unlockedPill, { backgroundColor: colors.sage }]}>
                  <Text style={styles.unlockedText}>AÇILDI</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.progressPill,
                    { backgroundColor: colors.bgSubtle },
                  ]}
                >
                  <Text style={[styles.progressText, { color: colors.azure }]}>
                    {badge.progressText}
                  </Text>
                </View>
              )}
            </View>
          </TactileCard>
        ))}
      </View>
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
  passportCard: {
    marginBottom: 16,
  },
  passportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleProgressBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePercentText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '900',
  },
  passportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passportTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  passportStats: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stampsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  stampItem: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  stampCoord: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stampEmoji: {
    fontSize: 24,
    marginVertical: 4,
  },
  stampCountry: {
    fontSize: 11,
    fontWeight: '900',
  },
  stampDateBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stampDateText: {
    fontSize: 8,
    fontWeight: '800',
  },
  badgeList: {
    gap: 10,
  },
  badgeCard: {
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeEmojiBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  badgeDesc: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  unlockedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  unlockedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  progressPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
