import React, { useRef } from 'react';
import {
  Text,
  Animated,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export type TactileVariant = 'sage' | 'azure' | 'coral' | 'amber' | 'surface';

interface TactileButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: TactileVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  onPress,
  variant = 'surface',
  style,
  textStyle,
  size = 'md',
  disabled = false,
}) => {
  const { colors } = useTheme();
  const animatedPress = useRef(new Animated.Value(0)).current;

  const getVariantStyles = () => {
    switch (variant) {
      case 'sage':
        return {
          bg: colors.sage,
          lip: colors.sageLip,
          textColor: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'azure':
        return {
          bg: colors.azure,
          lip: colors.azureLip,
          textColor: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'coral':
        return {
          bg: colors.coral,
          lip: colors.coralLip,
          textColor: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'amber':
        return {
          bg: colors.amber,
          lip: colors.amberLip,
          textColor: '#1E242B',
          borderColor: 'transparent',
        };
      case 'surface':
      default:
        return {
          bg: colors.bgCard,
          lip: colors.borderInk,
          textColor: colors.textMain,
          borderColor: colors.borderInk,
        };
    }
  };

  const v = getVariantStyles();

  const handlePressIn = () => {
    Animated.spring(animatedPress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore on unsupported devices
    }
  };

  const handlePressOut = () => {
    Animated.spring(animatedPress, {
      toValue: 0,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const translateY = animatedPress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: 12, paddingVertical: 6, minHeight: 34, borderRadius: 14 };
      case 'lg':
        return { paddingHorizontal: 20, paddingVertical: 14, minHeight: 52, borderRadius: 22 };
      case 'md':
      default:
        return { paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, borderRadius: 18 };
    }
  };

  const p = getPadding();

  const isPrimitive = (val: any) => typeof val === 'string' || typeof val === 'number';

  const isOnlyPrimitives = (nodes: React.ReactNode): boolean => {
    if (isPrimitive(nodes)) return true;
    if (Array.isArray(nodes)) {
      return nodes.every(child => isPrimitive(child) || child == null);
    }
    return false;
  };

  const renderContent = () => {
    if (isOnlyPrimitives(children)) {
      return (
        <Text
          style={[
            styles.text,
            {
              color: v.textColor,
              fontSize: size === 'sm' ? 12 : size === 'lg' ? 15 : 13,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      );
    }

    return React.Children.map(children, (child, idx) => {
      if (isPrimitive(child)) {
        return (
          <Text
            key={idx}
            style={[
              styles.text,
              {
                color: v.textColor,
                fontSize: size === 'sm' ? 12 : size === 'lg' ? 15 : 13,
              },
              textStyle,
            ]}
          >
            {child}
          </Text>
        );
      }
      return child;
    });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[{ opacity: disabled ? 0.6 : 1 }, style]}
    >
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: v.bg,
            borderBottomColor: v.lip,
            borderBottomWidth: 3.5,
            borderColor: v.borderColor,
            borderWidth: variant === 'surface' ? 1.5 : 0,
            transform: [{ translateY }],
            ...p,
          },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
