import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sun, Moon, MapPinPlus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { PipMascot } from '../mascot/PipMascot';
import { TactileButton } from '../ui/TactileButton';

interface AppHeaderProps {
  onAddPinPress?: () => void;
  isAddPinActive?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onAddPinPress,
  isAddPinActive = false,
}) => {
  const { colors, isDark, toggleTheme, isPro, togglePro, xp } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.bgApp }]}>
      {/* Sol: Pip Maskot & Seviye / XP Bilgisi */}
      <View style={styles.leftGroup}>
        <View
          style={[
            styles.mascotBox,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderInk,
            },
          ]}
        >
          <PipMascot size={32} animated={true} />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textMain }]}>AtlasPulse</Text>
            <Pressable onPress={togglePro}>
              <View
                style={[
                  styles.tierPill,
                  {
                    backgroundColor: isPro ? colors.amber : colors.bgSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tierText,
                    {
                      color: isPro ? '#1E242B' : colors.textSub,
                    },
                  ]}
                >
                  {isPro ? 'PRO ✨' : 'FREE'}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.streakText}>🔥 14 Gün</Text>
            <Text style={[styles.dot, { color: colors.textSub }]}>•</Text>
            <Text style={[styles.xpText, { color: colors.sage }]}>
              {xp.toLocaleString('tr-TR')} XP
            </Text>
          </View>
        </View>
      </View>

      {/* Sağ: Tema Değiştir & Durak Ekle */}
      <View style={styles.rightGroup}>
        <TactileButton
          onPress={toggleTheme}
          variant="surface"
          size="sm"
          style={styles.iconBtn}
        >
          {isDark ? (
            <Sun size={17} color={colors.amber} />
          ) : (
            <Moon size={17} color={colors.amber} />
          )}
        </TactileButton>

        {onAddPinPress && (
          <TactileButton
            onPress={onAddPinPress}
            variant={isAddPinActive ? 'amber' : 'coral'}
            size="sm"
            style={styles.addPinBtn}
          >
            <View style={styles.btnInner}>
              <MapPinPlus size={14} color={isAddPinActive ? '#1E242B' : '#FFFFFF'} />
              <Text
                style={[
                  styles.addPinText,
                  { color: isAddPinActive ? '#1E242B' : '#FFFFFF' },
                ]}
              >
                {isAddPinActive ? 'İptal' : 'Durak'}
              </Text>
            </View>
          </TactileButton>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mascotBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  tierPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F97316',
  },
  dot: {
    fontSize: 10,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 14,
  },
  addPinBtn: {
    height: 38,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 14,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPinText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
