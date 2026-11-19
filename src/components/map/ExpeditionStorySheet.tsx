import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { Clapperboard, Sparkles, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { StoryDetail } from '../../services/localStore';
import { TactileButton } from '../ui/TactileButton';

interface ExpeditionStorySheetProps {
  story: StoryDetail | null;
  onClose: () => void;
  onAddToRoute: () => void;
  onGoToReels: () => void;
}

export const ExpeditionStorySheet: React.FC<ExpeditionStorySheetProps> = ({
  story,
  onClose,
  onAddToRoute,
  onGoToReels,
}) => {
  const { colors } = useTheme();

  if (!story) return null;

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.borderInk,
        },
      ]}
    >
      {/* Üst Tutma Çubuğu & Kapat Butonu */}
      <View style={styles.topBar}>
        <View style={[styles.dragHandle, { backgroundColor: colors.borderInk }]} />
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: colors.bgSubtle }]}
        >
          <X size={14} color={colors.textSub} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Başlık & EXIF Rozeti */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={[styles.exifBadge, { backgroundColor: colors.coral }]}>
                <Text style={styles.exifBadgeText}>{story.exif}</Text>
              </View>
              <Text style={[styles.dateText, { color: colors.textSub }]}>
                {story.date}
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.textMain }]}>
              {story.title}
            </Text>
            <Text style={[styles.coords, { color: colors.textSub }]}>
              {story.coords}
            </Text>
          </View>

          <TactileButton
            onPress={onGoToReels}
            variant="azure"
            size="sm"
            style={styles.reelsBtn}
          >
            <View style={styles.btnRow}>
              <Clapperboard size={14} color="#FFF" />
              <Text style={styles.btnRowText}>Reels</Text>
            </View>
          </TactileButton>
        </View>

        {/* Hava Durumu, Rakım ve Medya Sayısı (boş olanlar gizlenir) */}
        <View style={styles.pillRow}>
          {[story.weather, story.elev, story.count].filter(Boolean).map(label => (
            <View key={label} style={[styles.infoPill, { backgroundColor: colors.bgSubtle }]}>
              <Text style={[styles.pillText, { color: colors.textMain }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Fotoğraf Kolajı: gerçek fotoğraflar varsa onlar, yoksa demo kart */}
        {story.photoUris && story.photoUris.length > 0 ? (
          <View style={styles.collageGrid}>
            <Image source={{ uri: story.photoUris[0] }} style={styles.collageBig} resizeMode="cover" />
            {story.photoUris.length > 1 && (
              <View style={styles.collageSmall}>
                <Image
                  source={{ uri: story.photoUris[1] }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                {story.photoUris.length > 2 && (
                  <View style={styles.photoTag}>
                    <Text style={styles.photoTagText}>{`+${story.photoUris.length - 2} Foto`}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.collageGrid}>
            <View style={[styles.collageBig, { backgroundColor: '#F97316' }]}>
              <Text style={styles.photoEmoji}>{story.emoji}</Text>
            </View>
            <View style={[styles.collageSmall, { backgroundColor: '#0EA5E9' }]}>
              <Text style={styles.photoCountText}>{story.count}</Text>
            </View>
          </View>
        )}

        {/* El Yazısı Gezi Notu */}
        <View
          style={[
            styles.noteBox,
            {
              backgroundColor: colors.bgSubtle,
              borderLeftColor: colors.amber,
            },
          ]}
        >
          <Text style={[styles.noteText, { color: colors.textMain }]}>
            {story.note}
          </Text>
        </View>

        {/* Aksiyon Butonu */}
        <TactileButton
          onPress={onAddToRoute}
          variant="sage"
          size="lg"
          style={styles.actionBtn}
        >
          <View style={styles.btnRow}>
            <Sparkles size={16} color="#FFF" />
            <Text style={styles.actionBtnText}>Rotaya Ekle / Hikaye Oluştur</Text>
          </View>
        </TactileButton>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '74%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  exifBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  exifBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  coords: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  reelsBtn: {
    height: 38,
    paddingHorizontal: 12,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnRowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  infoPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  collageGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  collageBig: {
    overflow: 'hidden',
    flex: 2,
    height: 100,
    borderRadius: 18,
    padding: 10,
    justifyContent: 'space-between',
  },
  collageSmall: {
    overflow: 'hidden',
    flex: 1,
    height: 100,
    borderRadius: 18,
    padding: 10,
    justifyContent: 'space-between',
  },
  photoTag: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  photoTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  photoEmoji: {
    fontSize: 22,
    alignSelf: 'flex-end',
  },
  photoCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    alignSelf: 'flex-end',
  },
  noteBox: {
    padding: 14,
    borderRadius: 18,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionBtn: {
    width: '100%',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
