import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import OrderStatusBadge from '../../components/shared/OrderStatusBadge';
import StatusTimeline from '../../components/shared/StatusTimeline';
import api from '../../lib/api';
import { formatISTDate } from '../../lib/timeUtils';

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders() {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data.orders || []);
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

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        ListHeaderComponent={<Text style={styles.title}>Order History</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
        renderItem={({ item }) => (
          <Card style={styles.orderCard}>
            <TouchableOpacity onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderMeal}>
                    {item.meal_type === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}
                  </Text>
                  <Text style={styles.orderDate}>{formatISTDate(item.delivery_date)}</Text>
                </View>
                <View style={styles.orderRight}>
                  <OrderStatusBadge status={item.status} />
                  <Text style={styles.chevron}>{expanded === item.id ? '▲' : '▼'}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {expanded === item.id && (
              <View style={styles.timeline}>
                <StatusTimeline order={item} />
                {item.special_instructions ? (
                  <Text style={styles.notes}>📝 {item.special_instructions}</Text>
                ) : null}
              </View>
            )}
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
  empty: { color: COLORS.whiteMuted, textAlign: 'center', marginTop: 40, fontSize: 15 },
  orderCard: { marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMeal: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  orderDate: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  chevron: { color: COLORS.whiteMuted, fontSize: 12 },
  timeline: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.blackBorder },
  notes: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 8 },
});
