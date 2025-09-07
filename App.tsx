/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { AppUsage } from './src/native/AppUsage';
import type { DailyUsage, AppUsageItem } from './src/types/usage';

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function fetchUsageForDay(date: Date): Promise<DailyUsage> {
  if (Platform.OS === 'ios') {
    // iOS: App Store apps için mümkün değil. MDM backend’iniz varsa buradan fetch edin.
    return { date: date.toISOString().split('T')[0], apps: [] };
  }

  const start = startOfDay(date).getTime();
  const end = endOfDay(date).getTime();
  const rows = await AppUsage.getUsageStats(start, end);
  const apps: AppUsageItem[] = rows
    .filter(r => r.timeForeground > 0)
    .map(r => ({
      packageName: r.packageName,
      timeMinutes: Math.round(r.timeForeground / 1000 / 60),
    }))
    .sort((a, b) => b.timeMinutes - a.timeMinutes);

  return { date: startOfDay(date).toISOString().split('T')[0], apps };
}
export default function App() {
  const [days, setDays] = useState<DailyUsage[]>([]);

  const todayIso = useMemo(() => startOfDay().toISOString().split('T')[0], []);

  const refreshToday = async () => {
    if (Platform.OS === 'android') {
      try {
        const d = await fetchUsageForDay(new Date());
        setDays(prev => {
          const filtered = prev.filter(x => x.date !== d.date);
          return [d, ...filtered].sort((a, b) => (a.date > b.date ? -1 : 1));
        });
      } catch (e) {
        console.log('catch ', e);
        Alert.alert('Hata', String(e));
      }
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      refreshToday();
      const id = setInterval(refreshToday, 5 * 60 * 1000);
      return () => clearInterval(id);
    }
  }, []);

  const openUsageSettings = async () => {
    if (Platform.OS === 'android') {
      try {
        await AppUsage.openUsageAccessSettings();
      } catch {}
    } else {
      Alert.alert('Bilgi', 'iOS’ta diğer uygulamaları izlemek MDM gerektirir.');
    }
  };

  const renderDay = ({ item }: { item: DailyUsage }) => (
    <View style={styles.dayBlock}>
      <Text style={styles.date}>
        {item.date}
        {item.date === todayIso ? ' (Bugün)' : ''}
      </Text>
      <FlatList
        data={item.apps}
        keyExtractor={(x, i) => x.packageName + i}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.app}>{item.packageName}</Text>
            <Text style={styles.time}>{item.timeMinutes} dk</Text>
          </View>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Günlük Kullanımlar</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={refreshToday}>
          <Text style={styles.btnText}>Bugünü Yenile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnGhost]}
          onPress={openUsageSettings}
        >
          <Text style={styles.btnGhostText}>İzinleri Aç</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={days} keyExtractor={d => d.date} renderItem={renderDay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 44 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: { backgroundColor: '#e5e7eb' },
  btnGhostText: { color: '#111827', fontWeight: '700' },
  dayBlock: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  date: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d5db',
  },
  app: { fontSize: 15, fontWeight: '600' },
  time: { fontSize: 15, color: '#374151' },
});
