import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TactileButton } from '../ui/TactileButton';
import { TactileCard } from '../ui/TactileCard';

interface NewPinModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: {
    title: string;
    category: 'drone' | 'dive' | 'camp' | 'exif' | 'standard';
    emoji: string;
  }) => void;
}

const EMOJI_OPTIONS: Array<{
  emoji: string;
  category: 'drone' | 'dive' | 'camp' | 'exif';
}> = [
  { emoji: '🎈', category: 'drone' },
  { emoji: '🤿', category: 'dive' },
  { emoji: '⛺', category: 'camp' },
  { emoji: '📸', category: 'exif' },
];

export const NewPinModal: React.FC<NewPinModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎈');
  const [selectedCat, setSelectedCat] = useState<'drone' | 'dive' | 'camp' | 'exif'>('drone');

  const handleConfirm = () => {
    const finalTitle = title.trim() || 'Yeni Keşif Noktası';
    onConfirm({
      title: finalTitle,
      category: selectedCat,
      emoji: selectedEmoji,
    });
    setTitle('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TactileCard style={styles.card}>
          <View style={styles.header}>
            <Text style={[styles.heading, { color: colors.textMain }]}>
              Yeni Keşif Durağı
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle }]}
            >
              <X size={14} color={colors.textSub} />
            </Pressable>
          </View>

          <TextInput
            placeholder="Durak adı (örn: Olimpos Sahili)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            style={[
              styles.input,
              {
                backgroundColor: colors.bgSubtle,
                borderColor: colors.borderInk,
                color: colors.textMain,
              },
            ]}
          />

          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map(item => {
              const isSelected = selectedEmoji === item.emoji;
              return (
                <Pressable
                  key={item.category}
                  onPress={() => {
                    setSelectedEmoji(item.emoji);
                    setSelectedCat(item.category);
                  }}
                  style={[
                    styles.emojiBtn,
                    {
                      borderColor: isSelected ? colors.coral : colors.borderInk,
                      borderWidth: isSelected ? 2 : 1,
                      backgroundColor: isSelected ? colors.bgSubtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          <TactileButton
            onPress={handleConfirm}
            variant="sage"
            size="lg"
            style={styles.confirmBtn}
          >
            Haritaya Pinle (+50 XP)
          </TactileButton>
        </TactileCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heading: {
    fontSize: 16,
    fontWeight: '900',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
  },
  emojiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  emojiBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  confirmBtn: {
    width: '100%',
  },
});
