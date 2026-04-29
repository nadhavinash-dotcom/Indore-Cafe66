import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function loadOrders() {
    try {
      const { data } = await api.get(`/orders/history?page=${page}&limit=20`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [page]);

  async function onRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  // ✅ GROUP BY WEEK
  const grouped = orders.reduce((acc, order) => {
    const date = new Date(order.delivery_date + 'T00:00:00');
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());

    const key = weekStart.toISOString().split('T')[0];

    if (!acc[key]) acc[key] = [];
    acc[key].push(order);

    return acc;
  }, {});

  // ✅ FLATTEN FOR FLATLIST
  const listData = Object.entries(grouped).flatMap(([week, orders]) => [
    { type: 'header', week },
    ...orders.map(o => ({ ...o, type: 'item' })),
  ]);

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `header-${item.week}` : String(item.id)
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
          />
        }
        ListHeaderComponent={
          <Text style={styles.title}>Order History</Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No orders yet</Text>
        }

        renderItem={({ item }) => {
          // ✅ WEEK HEADER
          if (item.type === 'header') {
            return (
              <Text style={styles.weekHeader}>
                Week of {formatISTDate(item.week)}
              </Text>
            );
          }

          // ✅ ORDER CARD
          return (
            <Card style={styles.orderCard}>
              <TouchableOpacity
                onPress={() =>
                  setExpanded(expanded === item.id ? null : item.id)
                }
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderMeal}>
                      {item.meal_type === 'lunch'
                        ? '☀️ Lunch'
                        : '🌙 Dinner'}
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatISTDate(item.delivery_date)}
                    </Text>

                    {/* ✅ Partner */}
                    {item.partner_name && (
                      <Text style={styles.partner}>
                        {item.partner_name}
                      </Text>
                    )}
                  </View>

                  <View style={styles.orderRight}>
                    <OrderStatusBadge status={item.status} />
                    <Text style={styles.chevron}>
                      {expanded === item.id ? '▲' : '▼'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* ✅ EXPANDED SECTION */}
              {expanded === item.id && (
                <View style={styles.timeline}>
                  <StatusTimeline order={item} />

                  {item.special_instructions ? (
                    <Text style={styles.notes}>
                      📝 {item.special_instructions}
                    </Text>
                  ) : null}

                  {/* ✅ REVIEW BUTTON */}
                  {item.status === 'delivered' && (
                    <TouchableOpacity style={styles.reviewBtn}>
                      <Text style={styles.reviewText}>Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card>
          );
        }}

        // ✅ PAGINATION
        ListFooterComponent={
          total > 20 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() =>
                  setPage(p => Math.max(1, p - 1))
                }
                disabled={page === 1}
              >
                <Text style={styles.pageBtn}>← Prev</Text>
              </TouchableOpacity>

              <Text style={styles.pageText}>{page}</Text>

              <TouchableOpacity
                onPress={() => setPage(p => p + 1)}
                disabled={orders.length < 20}
              >
                <Text style={styles.pageBtn}>Next →</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },

  list: { padding: 20, paddingBottom: 40 },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 20,
  },

  weekHeader: {
    color: COLORS.whiteMuted,
    fontSize: 12,
    marginBottom: 8,
    marginTop: 10,
    textTransform: 'uppercase',
  },

  empty: {
    color: COLORS.whiteMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },

  orderCard: { marginBottom: 12 },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderMeal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  orderDate: {
    color: COLORS.whiteMuted,
    fontSize: 13,
    marginTop: 2,
  },

  partner: {
    color: COLORS.whiteMuted,
    fontSize: 12,
    marginTop: 2,
  },

  orderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },

  chevron: {
    color: COLORS.whiteMuted,
    fontSize: 12,
  },

  timeline: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.blackBorder,
  },

  notes: {
    color: COLORS.whiteMuted,
    fontSize: 13,
    marginTop: 8,
  },

  reviewBtn: {
    marginTop: 12,
    backgroundColor: COLORS.gold,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  reviewText: {
    color: '#000',
    fontWeight: '600',
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    alignItems: 'center',
  },

  pageBtn: {
    color: COLORS.gold,
    fontSize: 14,
  },

  pageText: {
    color: COLORS.whiteMuted,
  },
});