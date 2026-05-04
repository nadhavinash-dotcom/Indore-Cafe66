import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import OrderStatusBadge from '../../components/shared/OrderStatusBadge';
import api from '../../lib/api';

export default function PartnerDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState('');

  async function loadOrders() {
    try {
      const res = await api.get('/partner/orders/today');
      setOrders(res.data?.orders ?? []);
      setDate(res.data?.date ?? '');
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const pending = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Today's Deliveries</Text>
            <Text style={styles.date}>{date}</Text>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: COLORS.success }]}>
                <Text style={[styles.statNumber, { color: COLORS.success }]}>{delivered}</Text>
                <Text style={styles.statLabel}>Delivered</Text>
              </View>
              <View style={[styles.statCard, { borderColor: COLORS.warning }]}>
                <Text style={[styles.statNumber, { color: COLORS.warning }]}>{pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={[styles.statCard, { borderColor: COLORS.gold }]}>
                <Text style={[styles.statNumber, { color: COLORS.gold }]}>{orders.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No orders assigned for today</Text>}
        renderItem={({ item }) => (
          <Card
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.customerName}>{item.customer_name}</Text>
                <Text style={styles.area}>{item.area}</Text>
                <Text style={styles.address} numberOfLines={1}>{item.address_line1}</Text>
              </View>
              <View style={styles.orderMeta}>
                <OrderStatusBadge status={item.status} />
                <Text style={styles.mealType}>{item.meal_type === 'lunch' ? '☀️' : '🌙'}</Text>
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
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  date: { color: COLORS.whiteMuted, fontSize: 13, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: COLORS.blackSoft,
  },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.whiteMuted, fontSize: 12, marginTop: 2 },
  empty: { color: COLORS.whiteMuted, textAlign: 'center', marginTop: 40, fontSize: 15 },
  orderCard: { marginBottom: 10 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderInfo: { flex: 1, marginRight: 12 },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  area: { color: COLORS.gold, fontSize: 13, marginTop: 2 },
  address: { color: COLORS.whiteMuted, fontSize: 12, marginTop: 2 },
  orderMeta: { alignItems: 'flex-end', gap: 6 },
  mealType: { fontSize: 18 },
});
