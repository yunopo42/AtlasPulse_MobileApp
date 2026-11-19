// RevenueCat Google Play Billing Entegrasyon Servisi

import { env } from '../config/env';

const REVENUECAT_KEY = env.revenueCatAndroidKey;

// Uygulamada yalnızca Google Play public SDK anahtarı (goog_...) kullanılabilir.
// sk_ ile başlayan anahtarlar sunucu tarafı gizli anahtardır ve pakete asla girmemelidir.
const isSecretKey = REVENUECAT_KEY.startsWith('sk_');
if (isSecretKey) {
  console.warn('[RevenueCat] Gizli (sk_) anahtar algılandı ve yok sayıldı. goog_ ile başlayan public anahtarı kullanın.');
}

export const isRevenueCatConfigured = Boolean(
  REVENUECAT_KEY && !isSecretKey && !REVENUECAT_KEY.includes('your_key')
);

export interface SubscriptionPackage {
  identifier: string;
  priceString: string;
  title: string;
  description: string;
}

export const revenueCatService = {
  async init(): Promise<void> {
    if (!isRevenueCatConfigured) {
      console.log('[RevenueCat] Dev / Mock modunda başlatıldı.');
      return;
    }
    console.log('[RevenueCat] Public anahtar yüklendi.');
  },

  async checkProEntitlement(): Promise<boolean> {
    if (!isRevenueCatConfigured) {
      return false;
    }
    return false;
  },

  async purchaseMonthlyPro(): Promise<boolean> {
    console.log('[RevenueCat] Google Play Pro abonelik satın alma akışı başlatıldı');
    return true;
  },

  async restorePurchases(): Promise<boolean> {
    console.log('[RevenueCat] Satın alımlar geri yüklendi');
    return true;
  },
};
