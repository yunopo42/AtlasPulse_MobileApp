import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { AppHeader } from './components/layout/AppHeader';
import { BottomTabBar, TabId } from './components/layout/BottomTabBar';
import { CelebrationToast } from './components/ui/CelebrationToast';
import { AtlasScreen } from './screens/AtlasScreen';
import { ScannerScreen } from './screens/ScannerScreen';
import { ReelsScreen } from './screens/ReelsScreen';
import { PassportScreen } from './screens/PassportScreen';

const MainNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('atlas');

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgApp }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <CelebrationToast />

      {/* Atlas screen has its own integrated header with Durak action */}
      {activeTab !== 'atlas' && <AppHeader />}

      <View style={styles.tabContent}>
        {activeTab === 'atlas' && (
          <AtlasScreen onNavigateToReels={() => setActiveTab('reels')} />
        )}
        {activeTab === 'scanner' && (
          <ScannerScreen onImportComplete={() => setActiveTab('atlas')} />
        )}
        {activeTab === 'reels' && <ReelsScreen />}
        {activeTab === 'passport' && <PassportScreen />}
      </View>

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
};

export const AppRoot: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
});
