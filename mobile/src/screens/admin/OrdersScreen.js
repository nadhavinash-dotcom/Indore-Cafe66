import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import OrderStatusBadge from '../../components/shared/OrderStatusBadge';
import api from '../../lib/api';
import { formatISTDate } from '../../lib/timeUtils';

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  async function loadOrders() {
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
      setFiltered(data.orders || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(orders);
    } else {
      const q = search.toLowerCase();
      setFiltered(orders.filter(
        (o) => o.customer_name?.toLowerCase().includes(q) || o.area?.toLowerCase().includes(q)
      ));
    }
  }, [search, orders]);

  async function onRefresh() {
    setRefreshing(true);
    await loadOrders();
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
            <Text style={styles.title}>Orders</Text>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by customer or area..."
              placeholderTextColor={COLORS.whiteMuted}
            />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No orders found</Text>}
        renderItem={({ item }) => (
          <Card style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.customerName}>{item.customer_name}</Text>
                <Text style={styles.area}>{item.area} · {item.meal_type === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</Text>
                <Text style={styles.date}>{formatISTDate(item.delivery_date)}</Text>
              </View>
              <OrderStatusBadge status={item.status} />
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
    backgroundColor: COLORS.blackSoft,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 16,
  },
  empty: { color: COLORS.whiteMuted, textAlign: 'center', marginTop: 40 },
  orderCard: { marginBottom: 10 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  area: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 2 },
  date: { color: COLORS.whiteMuted, fontSize: 12, marginTop: 2 },
});
