import AsyncStorage from '@react-native-async-storage/async-storage';

const WAYPOINTS_KEY = '@atlaspulse_local_waypoints';
const TRIPS_KEY = '@atlaspulse_local_trips';

export interface StoryDetail {
  id: string;
  exif: string;
  date: string;
  title: string;
  coords: string;
  weather: string;
  elev: string;
  count: string;
  note: string;
  category: 'drone' | 'dive' | 'camp' | 'exif' | 'standard';
  emoji: string;
  lat: number;
  lng: number;
  coordsPos?: { x: number; y: number };
  /** Galeriden aktarılan duraklar için gerçek veriler */
  tripId?: string;
  startTime?: number;
  photoUris?: string[];
  countryCode?: string;
}

export const INITIAL_STORIES: Record<string, StoryDetail> = {
  kapadokya: {
    id: 'kapadokya',
    exif: 'DJI Neo • 4K • 120m',
    date: '14 Eyl 2026',
    title: 'Göreme & Kızılçukur Vadisi',
    coords: '38.6431° N, 34.8289° E • Türkiye',
    weather: '☀️ 17°C Açık',
    elev: '⛰️ 1.145m',
    count: '🖼️ 24 Kare',
    note: '"Sabah gün doğumunda balonlar yükselirken vadi tamamen altın rengine büründü. Rüzgar sıfırdı, harika bir uçuş oldu!"',
    category: 'drone',
    emoji: '🎈',
    lat: 38.6431,
    lng: 34.8289,
    coordsPos: { x: 298, y: 332 },
  },
  kas: {
    id: 'kas',
    exif: 'Action Cam • 27mm • 4K',
    date: '19 Eyl 2026',
    title: 'Kekova Batık Şehir & Kaş',
    coords: '36.1836° N, 29.8831° E • Türkiye',
    weather: '🌊 27°C Güneşli',
    elev: '🤿 0m Kıyı',
    count: '🖼️ 38 Kare',
    note: '"Turkuaz koyda serbest dalış sonrası kano ile batık kalıntıların üzerinden geçtik. Su görüş mesafesi inanılmazdı."',
    category: 'dive',
    emoji: '🤿',
    lat: 36.1836,
    lng: 29.8831,
    coordsPos: { x: 256, y: 358 },
  },
  dolomites: {
    id: 'dolomites',
    exif: 'Sony A7C • 24mm f/1.8',
    date: '22 Ağu 2026',
    title: 'Seceda Sırtı, Dolomitler',
    coords: '46.6003° N, 11.7242° E • İtalya',
    weather: '⛅ 11°C Serin',
    elev: '⛰️ 2.519m',
    count: '🖼️ 41 Kare',
    note: '"Sarp zirvelerin hemen altında bulut denizinin üzerinde kamp kurduk. Gece Samanyolu çıplak gözle netti."',
    category: 'camp',
    emoji: '⛺',
    lat: 46.6003,
    lng: 11.7242,
    coordsPos: { x: 162, y: 265 },
  },
  krakow: {
    id: 'krakow',
    exif: 'iPhone 16 Pro • RAW',
    date: '09 May 2026',
    title: 'Kraków Eski Şehir & Wawel',
    coords: '50.0647° N, 19.9450° E • Polonya',
    weather: '🌤️ 15°C Bahar',
    elev: '🏛️ 219m',
    count: '🖼️ 64 Kare',
    note: '"Rynek Meydanı sabah kahvesi ve Vistül nehri kıyısında gün batımı yürüyüşü ile harika bir Orta Avrupa durağı."',
    category: 'exif',
    emoji: '📸',
    lat: 50.0647,
    lng: 19.945,
    coordsPos: { x: 208, y: 222 },
  },
  lisbon: {
    id: 'lisbon',
    exif: 'Fujifilm X100VI • 35mm',
    date: '18 Nis 2026',
    title: 'Alfama & Miradouro Terası',
    coords: '38.7117° N, 9.1301° W • Portekiz',
    weather: '🌬️ 21°C Rüzgarlı',
    elev: '🚋 78m',
    count: '🖼️ 19 Kare',
    note: '"Sarı tramvayların geçtiği dar sokaklarda kaybolup Atlantik gün batımını terastan izledik."',
    category: 'exif',
    emoji: '🚋',
    lat: 38.7117,
    lng: -9.1301,
    coordsPos: { x: 98, y: 342 },
  },
};

export const localStore = {
  async getStories(): Promise<Record<string, StoryDetail>> {
    try {
      const data = await AsyncStorage.getItem(WAYPOINTS_KEY);
      if (data) {
        return { ...INITIAL_STORIES, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Error reading local stories', e);
    }
    return INITIAL_STORIES;
  },

  async saveStory(story: StoryDetail): Promise<void> {
    try {
      const current = await this.getStories();
      current[story.id] = story;
      await AsyncStorage.setItem(WAYPOINTS_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Error saving local story', e);
    }
  },

  /** Birden çok kaydı tek yazımla kaydeder (aynı ID'li kayıtlar güncellenir). */
  async saveStories(stories: StoryDetail[]): Promise<void> {
    try {
      const current = await this.getStories();
      for (const story of stories) current[story.id] = story;
      await AsyncStorage.setItem(WAYPOINTS_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Error saving local stories', e);
    }
  },

  async clearCustomStories(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WAYPOINTS_KEY);
    } catch (e) {
      console.warn('Error clearing local stories', e);
    }
  },
};
