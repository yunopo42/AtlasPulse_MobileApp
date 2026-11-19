import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppHeader } from '../components/layout/AppHeader';
import { WorldGlobeMap } from '../components/map/WorldGlobeMap';
import { ExpeditionStorySheet } from '../components/map/ExpeditionStorySheet';
import { NewPinModal } from '../components/map/NewPinModal';
import { localStore, StoryDetail } from '../services/localStore';
import { supabaseService, PinType } from '../services/supabase';
import { formatCoords } from '../services/geo';

interface AtlasScreenProps {
  onNavigateToReels?: () => void;
}

export const AtlasScreen: React.FC<AtlasScreenProps> = ({ onNavigateToReels }) => {
  const { colors, addXp } = useTheme();
  const [stories, setStories] = useState<Record<string, StoryDetail>>({});
  const [activeStory, setActiveStory] = useState<StoryDetail | null>(null);
  const [isAddPinMode, setIsAddPinMode] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number }>({
    lat: 38.6431,
    lng: 34.8289,
  });

  useEffect(() => {
    (async () => {
      const data = await localStore.getStories();
      setStories(data);
    })();
  }, []);

  const handleToggleAddPin = () => {
    setIsAddPinMode(prev => {
      const next = !prev;
      if (next) setActiveStory(null);
      return next;
    });
  };

  const handleMapClickForPin = (coords: { lat: number; lng: number }) => {
    setPendingCoords(coords);
    setIsModalVisible(true);
  };

  const handleConfirmNewPin = async (data: {
    title: string;
    category: 'drone' | 'dive' | 'camp' | 'exif' | 'standard';
    emoji: string;
  }) => {
    const id = 'custom_' + Date.now();
    const lat = pendingCoords.lat;
    const lng = pendingCoords.lng;

    const newStory: StoryDetail = {
      id,
      exif: 'Manuel Pin • GPS',
      date: 'Bugün',
      title: data.title,
      coords: formatCoords(lat, lng),
      weather: '',
      elev: '',
      count: '📍 Manuel Durak',
      note: `"${data.title} noktası haritaya yeni keşif durağı olarak işaretlendi!"`,
      category: data.category,
      emoji: data.emoji,
      lat,
      lng,
    };

    // 1. Sıfır gecikmeli yerel depolama
    await localStore.saveStory(newStory);
    setStories(prev => ({ ...prev, [id]: newStory }));
    setIsModalVisible(false);
    setIsAddPinMode(false);
    setActiveStory(newStory);
    addXp(50, `"${data.title}" Haritaya Eklendi!`);

    // 2. Arka planda PostGIS Supabase senkronizasyonu
    supabaseService.saveWaypoint({
      title: data.title,
      note: newStory.note,
      latitude: lat,
      longitude: lng,
      pin_type: (data.category as PinType) || 'standard',
      elevation_m: 420,

    }).catch(err => {
      console.warn('[Sync] Arka plan Supabase yazma:', err);
    });
  };

  const handleAddToRoute = () => {
    if (activeStory) {
      addXp(40, `"${activeStory.title}" Aktif Rotaya Eklendi!`);
      setActiveStory(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <AppHeader
        onAddPinPress={handleToggleAddPin}
        isAddPinActive={isAddPinMode}
      />

      <WorldGlobeMap
        stories={stories}
        onSelectStory={setActiveStory}
        isAddPinMode={isAddPinMode}
        onMapClickForPin={handleMapClickForPin}
        onCancelAddPin={() => setIsAddPinMode(false)}
        activeStory={activeStory}
      />

      {activeStory && (
        <ExpeditionStorySheet
          story={activeStory}
          onClose={() => setActiveStory(null)}
          onAddToRoute={handleAddToRoute}
          onGoToReels={() => {
            setActiveStory(null);
            if (onNavigateToReels) onNavigateToReels();
          }}
        />
      )}

      <NewPinModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onConfirm={handleConfirmNewPin}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
