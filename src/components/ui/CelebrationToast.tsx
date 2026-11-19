import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const CelebrationToast: React.FC = () => {
  const { colors, toastMessage } = useTheme();

  if (!toastMessage) return null;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.toast,
          {
            backgroundColor: colors.sage,
            borderBottomColor: colors.sageLip,
          },
        ]}
      >
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.text}>{toastMessage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  emoji: {
    fontSize: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
