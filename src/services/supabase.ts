import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { env } from '../config/env';

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project')
);

// Yapılandırma yoksa createClient boş URL ile hata fırlatmasın diye yer tutucu kullanılır;
// tüm servis çağrıları isSupabaseConfigured ile korunur.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Veri Modelleri
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_pro: boolean;
  public_profile: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  cover_image_url?: string;
  visibility: 'private' | 'friends' | 'public';
  total_distance_km: number;
  created_at?: string;
}

export type PinType = 'standard' | 'drone' | 'diving' | 'camping' | 'landmark' | 'exif';

export interface Waypoint {
  id: string;
  trip_id?: string;
  user_id?: string;
  title: string;
  note?: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  city_name?: string;
  pin_type: PinType;
  visited_at: string;
  order_index: number;
  elevation_m?: number;
  weather_desc?: string;
  media_count?: number;
}

export interface VisitedRegion {
  id: string;
  user_id: string;
  country_code: string;
  region_code?: string;
  status: 'visited' | 'lived' | 'wishlist';
  first_visited_year?: number;
}

// Senkronizasyon ve Veri Servisi
export const supabaseService = {
  async fetchTrips(): Promise<Trip[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[Supabase] fetchTrips error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('[Supabase] fetchTrips exception:', e);
      return [];
    }
  },

  async createTrip(trip: Partial<Trip>): Promise<Trip | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert([trip])
        .select()
        .single();
      if (error) {
        console.warn('[Supabase] createTrip error:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[Supabase] createTrip exception:', e);
      return null;
    }
  },

  async saveWaypoint(wp: {
    title: string;
    note?: string;
    latitude: number;
    longitude: number;
    pin_type: PinType;
    trip_id?: string;
    elevation_m?: number;
    weather_desc?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      // PostGIS Point format: POINT(lng lat)
      const locationPoint = `POINT(${wp.longitude} ${wp.latitude})`;
      const { error } = await supabase.from('waypoints').insert([
        {
          title: wp.title,
          note: wp.note,
          location: locationPoint,
          pin_type: wp.pin_type,
          trip_id: wp.trip_id,
          elevation_m: wp.elevation_m,
          weather_desc: wp.weather_desc,
          visited_at: new Date().toISOString(),
          order_index: 0,
        },
      ]);
      if (error) {
        console.warn('[Supabase] saveWaypoint error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] saveWaypoint exception:', e);
      return false;
    }
  },

  async fetchVisitedRegions(): Promise<VisitedRegion[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('user_visited_regions')
        .select('*');
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },
};
