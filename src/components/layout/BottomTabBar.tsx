import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Compass, ScanLine, Clapperboard, Stamp } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GlassBar } from '../ui/TactileCard';

export type TabId = 'atlas' | 'scanner' | 'reels' | 'passport';

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { colors } = useTheme();

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    {
      id: 'atlas',
      label: 'Atlas',
      icon: (
        <Compass
          size={20}
          color={activeTab === 'atlas' ? colors.azure : colors.textMuted}
        />
      ),
    },
    {
      id: 'scanner',
      label: 'Tarayıcı',
      icon: (
        <ScanLine
          size={20}
          color={activeTab === 'scanner' ? colors.azure : colors.textMuted}
        />
      ),
    },
    {
      id: 'reels',
      label: 'Reels',
      icon: (
        <Clapperboard
          size={20}
          color={activeTab === 'reels' ? colors.azure : colors.textMuted}
        />
      ),
    },
    {
      id: 'passport',
      label: 'Pasaport',
      icon: (
        <Stamp
          size={20}
          color={activeTab === 'passport' ? colors.azure : colors.textMuted}
        />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <GlassBar style={styles.glassBar}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isActive ? colors.bgSubtle : 'transparent',
                },
              ]}
            >
              {tab.icon}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.azure : colors.textMuted,
                    fontWeight: isActive ? '900' : '700',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </GlassBar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  glassBar: {
    borderRadius: 28,
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
