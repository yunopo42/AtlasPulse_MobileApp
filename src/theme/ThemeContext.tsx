import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, lightTheme, darkTheme } from './colors';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  isPro: boolean;
  togglePro: () => void;
  xp: number;
  addXp: (amount: number, message?: string) => void;
  toastMessage: string | null;
  clearToast: () => void;
}

const THEME_KEY = '@atlaspulse_theme';
const PRO_KEY = '@atlaspulse_pro';
const XP_KEY = '@atlaspulse_xp';

const ThemeContext = createContext<ThemeContextType>({
  colors: darkTheme,
  isDark: true,
  toggleTheme: () => {},
  isPro: false,
  togglePro: () => {},
  xp: 2450,
  addXp: () => {},
  toastMessage: null,
  clearToast: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false); // Varsayılan olarak Sunlit Atlas (Açık mod)
  const [isPro, setIsPro] = useState<boolean>(false);
  const [xp, setXp] = useState<number>(2450);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load persisted preferences
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
        const savedPro = await AsyncStorage.getItem(PRO_KEY);
        if (savedPro !== null) {
          setIsPro(savedPro === 'true');
        }
        const savedXp = await AsyncStorage.getItem(XP_KEY);
        if (savedXp !== null) {
          setXp(parseInt(savedXp, 10));
        }
      } catch (e) {
        console.warn('Error reading stored settings', e);
      }
    })();
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const togglePro = () => {
    setIsPro(prev => {
      const next = !prev;
      AsyncStorage.setItem(PRO_KEY, next ? 'true' : 'false');
      triggerToast(next ? 'AtlasPulse PRO Aktif Edildi! ✨' : 'Free Plana Geçildi');
      return next;
    });
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const addXp = (amount: number, message?: string) => {
    setXp(prev => {
      const next = prev + amount;
      AsyncStorage.setItem(XP_KEY, next.toString());
      if (message) {
        triggerToast(`${message} (+${amount} XP)`);
      }
      return next;
    });
  };

  const clearToast = () => setToastMessage(null);

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        toggleTheme,
        isPro,
        togglePro,
        xp,
        addXp,
        toastMessage,
        clearToast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
