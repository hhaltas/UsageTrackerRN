import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'AppUsage' doesn't seem to be linked. Make sure:\n` +
  (Platform.OS === 'ios'
    ? `- iOS'ta bu özellik MDM gerektirir ve doğrudan desteklenmez.\n`
    : `- Android'de gradle build sonrası yeniden çalıştırın.\n`);

// Basit TS sarmalayıcı
const Native = NativeModules.AppUsage;

export const AppUsage = {
  openUsageAccessSettings(): Promise<boolean> {
    console.log('openUsageAccessSettings called', Native);
    if (!Native) throw new Error(LINKING_ERROR);
    return Native.openUsageAccessSettings();
  },
  async getUsageStats(
    start: number,
    end: number,
  ): Promise<{ packageName: string; timeForeground: number }[]> {
    if (!Native) throw new Error(LINKING_ERROR);
    const raw = await Native.getUsageStats(start, end);
    // Native tarafı string döndürüyor
    const parsed = JSON.parse(raw) as {
      packageName: string;
      timeForeground: number;
    }[];
    return parsed;
  },
};
