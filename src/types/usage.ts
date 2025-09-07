export type AppUsageItem = {
  packageName: string; // Android: packageId, iOS(MDM): bundleId
  timeMinutes: number; // dakika
};

export type DailyUsage = {
  date: string; // YYYY-MM-DD (yerel)
  apps: AppUsageItem[];
};
