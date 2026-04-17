import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';

const SUB_VARIANT = { active: 'success', trial: 'info', paused: 'warning', expired: 'error', none: 'default' };

export default function AdminCustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  async function loadCustomers() {
    try {
      const { data } = await api.get('/admin/customers');
      setCustomers(data.customers || []);
      setFiltered(data.customers || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(customers); return; }
    const q = search.toLowerCase();
    setFiltered(customers.filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)));
  }, [search, customers]);

  async function onRefresh() {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Customers ({customers.length})</Text>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or phone..."
              placeholderTextColor={COLORS.whiteMuted}
            />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No customers found</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone} · {item.area}</Text>
                <Text style={styles.pref}>{item.meal_preference}</Text>
              </View>
              <Badge
                label={item.subscription_status || 'none'}
                variant={SUB_VARIANT[item.subscription_status] || 'default'}
              />
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
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 12 },
  search: {
    backgroundColor: COLORS.blackSoft, borderWidth: 1, borderColor: COLORS.blackBorder,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    color: COLORS.white, fontSize: 14, marginBottom: 16,
  },
  empty: { color: COLORS.whiteMuted, textAlign: 'center', marginTop: 40 },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  phone: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 2 },
  pref: { color: COLORS.gold, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
});
