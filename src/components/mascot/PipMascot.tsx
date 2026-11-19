import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';

interface PipMascotProps {
  size?: number;
  animated?: boolean;
}

export const PipMascot: React.FC<PipMascotProps> = ({ size = 36, animated = true }) => {
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animated]);

  const translateY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3.5],
  });

  const rotate = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '3deg'],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Gövde */}
        <Circle cx="32" cy="36" r="18" fill="#38BDF8" />
        <Path d="M20 42C20 35 44 35 44 42C44 50 20 50 20 42Z" fill="#E0F2FE" />

        {/* Kanatlar */}
        <Path
          d="M12 34C9 38 12 45 17 44"
          stroke="#0284C7"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M52 34C55 38 52 45 47 44"
          stroke="#0284C7"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Havacı Gözlüğü */}
        <Rect
          x="17"
          y="21"
          width="13"
          height="10"
          rx="5"
          fill="#F59E0B"
          stroke="#1E242B"
          strokeWidth="2.5"
        />
        <Rect
          x="34"
          y="21"
          width="13"
          height="10"
          rx="5"
          fill="#F59E0B"
          stroke="#1E242B"
          strokeWidth="2.5"
        />
        <Line x1="30" y1="26" x2="34" y2="26" stroke="#1E242B" strokeWidth="2.5" />
        <Circle cx="23.5" cy="26" r="2.5" fill="#1E242B" />
        <Circle cx="40.5" cy="26" r="2.5" fill="#1E242B" />

        {/* Gaga */}
        <Path
          d="M29 33L35 33L32 38Z"
          fill="#F97316"
          stroke="#1E242B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Sırt Çantası Kayışı */}
        <Path
          d="M21 43L43 43"
          stroke="#EA580C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};
