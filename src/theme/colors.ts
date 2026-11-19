export interface ThemeColors {
  isDark: boolean;
  bgStudio: string;
  bgApp: string;
  bgCard: string;
  bgSubtle: string;
  bgGlass: string;
  borderInk: string;
  textMain: string;
  textSub: string;
  textMuted: string;

  // Tactile 3D Palette
  sage: string;
  sageLip: string;
  azure: string;
  azureLip: string;
  coral: string;
  coralLip: string;
  amber: string;
  amberLip: string;
  violet: string;
  violetLip: string;

  // Cartography
  mapSea: string;
  mapLand: string;
  mapLandStroke: string;
  mapVisited: string;
  mapVisitedStroke: string;
  mapGraticule: string;
  phoneFrame: string;
  shadowSoft: string;
}

export const lightTheme: ThemeColors = {
  isDark: false,
  bgStudio: '#EFECE6',
  bgApp: '#FAF8F5',
  bgCard: '#FFFFFF',
  bgSubtle: '#F3EFEA',
  bgGlass: 'rgba(255, 255, 255, 0.88)',
  borderInk: '#E5E0D8',
  textMain: '#1E242B',
  textSub: '#5B6470',
  textMuted: '#8E97A4',

  sage: '#22C55E',
  sageLip: '#16A34A',
  azure: '#0EA5E9',
  azureLip: '#0284C7',
  coral: '#F97316',
  coralLip: '#EA580C',
  amber: '#F59E0B',
  amberLip: '#D97706',
  violet: '#8B5CF6',
  violetLip: '#7C3AED',

  mapSea: '#EAF4FA',
  mapLand: '#FDFBF7',
  mapLandStroke: '#D8D1C5',
  mapVisited: '#DCFCE7',
  mapVisitedStroke: '#22C55E',
  mapGraticule: 'rgba(14, 165, 233, 0.14)',
  phoneFrame: '#22262E',
  shadowSoft: 'rgba(30, 36, 43, 0.08)',
};

export const darkTheme: ThemeColors = {
  isDark: true,
  bgStudio: '#0B0E14',
  bgApp: '#131722',
  bgCard: '#1C2232',
  bgSubtle: '#242C40',
  bgGlass: 'rgba(28, 34, 50, 0.88)',
  borderInk: '#2B344A',
  textMain: '#F4F6FA',
  textSub: '#A2AEC2',
  textMuted: '#69758C',

  sage: '#34D399',
  sageLip: '#059669',
  azure: '#38BDF8',
  azureLip: '#0284C7',
  coral: '#FB923C',
  coralLip: '#EA580C',
  amber: '#FBBF24',
  amberLip: '#D97706',
  violet: '#A78BFA',
  violetLip: '#7C3AED',

  mapSea: '#0F1726',
  mapLand: '#1A2336',
  mapLandStroke: '#2D3954',
  mapVisited: 'rgba(52, 211, 153, 0.18)',
  mapVisitedStroke: '#34D399',
  mapGraticule: 'rgba(56, 189, 248, 0.10)',
  phoneFrame: '#090C12',
  shadowSoft: 'rgba(0, 0, 0, 0.45)',
};
