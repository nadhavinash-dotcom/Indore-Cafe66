import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';

export default function AdminPartnersScreen() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadPartners() {
    try {
      const { data } = await api.get('/admin/partners');
      setPartners(data.partners || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPartners(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadPartners();
    setRefreshing(false);
  }

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={partners}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        ListHeaderComponent={<Text style={styles.title}>Delivery Partners</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No partners found</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone} · {item.vehicle_type}</Text>
                <Text style={styles.stats}>
                  Today: {item.today_delivered}/{item.today_total} delivered
                </Text>
              </View>
              <View style={styles.right}>
                <Badge label={item.status || 'active'} variant={item.status === 'active' ? 'success' : 'error'} />
                {item.is_on_duty ? (
                  <Text style={styles.onDuty}>🟢 On Duty</Text>
                ) : (
                  <Text style={styles.offDuty}>🔴 Off Duty</Text>
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  list: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 20 },
  empty: { color: COLORS.whiteMuted, textAlign: 'center', marginTop: 40 },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  phone: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  stats: { color: COLORS.gold, fontSize: 12, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 6 },
  onDuty: { color: COLORS.success, fontSize: 12 },
  offDuty: { color: COLORS.error, fontSize: 12 },
});
