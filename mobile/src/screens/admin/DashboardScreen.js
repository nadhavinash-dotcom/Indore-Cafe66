import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';
import { formatISTDate } from '../../lib/timeUtils';

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  if (loading) return <Spinner fullscreen />;

  const today = stats?.today || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.date}>{formatISTDate(new Date().toISOString())}</Text>

        <View style={styles.statsGrid}>
          <StatCard label="Today's Orders" value={today.orders ?? 0} color={COLORS.gold} />
          <StatCard label="Delivered" value={today.delivered ?? 0} color={COLORS.success} />
          <StatCard label="Active Subs" value={stats?.activeSubscriptions ?? 0} color={COLORS.goldLight} />
          <StatCard label="Today Revenue" value={`₹${(today.revenue ?? 0).toLocaleString()}`} color={COLORS.warning} />
        </View>

        <View style={styles.quickLinks}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.linkGrid}>
            {[
              { label: '🍱 Kitchen', screen: 'Kitchen' },
              { label: '📋 Orders', screen: 'Orders' },
              { label: '👥 Customers', screen: 'Customers' },
              { label: '🚴 Partners', screen: 'Partners' },
              { label: '🎫 Support', screen: 'Support' },
              { label: '⚙️ Settings', screen: 'Settings' },
            ].map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={styles.linkCard}
                onPress={() => navigation.navigate(item.screen)}
              >
                <Text style={styles.linkLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  date: { color: COLORS.whiteMuted, fontSize: 13, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '47%', alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: COLORS.whiteMuted, fontSize: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
  quickLinks: {},
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  linkCard: {
    width: '30%',
    backgroundColor: COLORS.blackSoft,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  linkLabel: { color: COLORS.white, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
