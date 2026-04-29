import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import CountdownTimer from '../../components/ui/CountdownTimer';
import OrderStatusBadge from '../../components/shared/OrderStatusBadge';
import useCutoffTimer from '../../hooks/useCutoffTimer';
import useAuthStore from '../../store/authStore';
import useTimerStore from '../../store/timerStore';
import api from '../../lib/api';
import { formatISTDate } from '../../lib/timeUtils';

export default function DashboardScreen({ navigation }) {
  useCutoffTimer();
  const customer = useAuthStore((s) => s.customer);
  const lunchTimer = useTimerStore((s) => s.lunch);
  const dinnerTimer = useTimerStore((s) => s.dinner);
  const [subscription, setSubscription] = useState(null);
  const [todayOrders, setTodayOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [subRes, ordersRes] = await Promise.all([
        api.get('/customer/subscription'),
        api.get('/orders/today'),
      ]);
      console.log(subRes.data.subscription)
      setSubscription(subRes.data.subscription);
      setTodayOrders(ordersRes.data.orders || []);
    } catch {}
  }

  useEffect(() => { loadData(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const activeMeal = lunchTimer.isOpen ? 'lunch' : dinnerTimer.isOpen ? 'dinner' : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste, {customer?.name || 'Friend'} 🙏</Text>
            <Text style={styles.date}>{formatISTDate(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Countdown Timer */}
        {activeMeal ? (
          <Card style={styles.timerCard} elevated>
            <CountdownTimer meal={activeMeal} />
          </Card>
        ) : (
          <Card style={styles.timerCard}>
            <Text style={styles.closedText}>No active booking window</Text>
            <Text style={styles.closedSub}>Next opens at 9:00 AM IST</Text>
          </Card>
        )}

        {/* Quick Book CTA */}
        {activeMeal && (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('BookMeal')}
          >
            <Text style={styles.bookBtnText}>🍱 Book {activeMeal === 'lunch' ? 'Lunch' : 'Dinner'} Now</Text>
          </TouchableOpacity>
        )}

        {/* Active Subscription */}
        {subscription ? (
          <Card style={styles.subCard}>
            <Text style={styles.sectionTitle}>Active Subscription</Text>
            <View style={styles.subRow}>
              <Text style={styles.subLabel}>Plan</Text>
              <Text style={styles.subValue}>{subscription.meal_type}</Text>
            </View>
            {/* <View style={styles.subRow}>
              <Text style={styles.subLabel}>Meals Left</Text>
              <Text style={[styles.subValue, { color: COLORS.gold }]}>{subscription.meals_remaining}</Text>
            </View> */}
            <View style={styles.subRow}>
              <Text style={styles.subLabel}>Valid Until</Text>
              <Text style={styles.subValue}>{formatISTDate(subscription.end_date)}</Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.subCard} onPress={() => navigation.navigate('Plans')}>
            <Text style={styles.sectionTitle}>No Active Subscription</Text>
            <Text style={styles.subCta}>Tap to explore plans →</Text>
          </Card>
        )}

        {/* Today's Orders */}
        {todayOrders.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Today's Orders</Text>
            {todayOrders.map((order) => (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderRow}>
                  <Text style={styles.orderMeal}>{order.meal_type === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</Text>
                  <OrderStatusBadge status={order.status} />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  date: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 2 },
  timerCard: { marginBottom: 16, alignItems: 'center', paddingVertical: 20 },
  closedText: { color: COLORS.whiteMuted, fontSize: 16, textAlign: 'center' },
  closedSub: { color: COLORS.blackBorder, fontSize: 12, textAlign: 'center', marginTop: 4 },
  bookBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookBtnText: { color: COLORS.black, fontSize: 16, fontWeight: '700' },
  subCard: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  subLabel: { color: COLORS.whiteMuted, fontSize: 14 },
  subValue: { color: COLORS.white, fontSize: 14, fontWeight: '500' },
  subCta: { color: COLORS.gold, fontSize: 14 },
  orderCard: { marginBottom: 10 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMeal: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});
