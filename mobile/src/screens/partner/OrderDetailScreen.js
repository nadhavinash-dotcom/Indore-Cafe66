import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import OrderStatusBadge from '../../components/shared/OrderStatusBadge';
import StatusTimeline from '../../components/shared/StatusTimeline';
import api from '../../lib/api';

const TRANSITIONS = {
  confirmed: { next: 'picked_up', label: '📦 Mark Picked Up' },
  picked_up: { next: 'in_transit', label: '🚴 Mark In Transit' },
  in_transit: { next: 'delivered', label: '✅ Mark Delivered' },
};

export default function OrderDetailScreen({ navigation, route }) {
  const [order, setOrder] = useState(route.params.order);
  const [loading, setLoading] = useState(false);

  const transition = TRANSITIONS[order.status];

  async function handleStatusUpdate() {
    if (!transition) return;
    Alert.alert(
      'Update Status',
      `Change order to "${transition.next.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await api.put(`/partner/orders/${order.id}/status`, { status: transition.next });
              setOrder((o) => ({ ...o, status: transition.next }));
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Update failed');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Order #{order.id}</Text>
          <OrderStatusBadge status={order.status} />
        </View>

        <Card style={styles.customerCard}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Row label="Name" value={order.customer_name} />
          <Row label="Phone" value={order.phone} />
          <Row label="Area" value={order.area} />
          <Row label="Address" value={[order.address_line1, order.address_line2].filter(Boolean).join(', ')} />
          {order.landmark ? <Row label="Landmark" value={order.landmark} /> : null}
          <Row label="Meal Pref" value={order.meal_preference} />
          {order.special_instructions ? <Row label="Notes" value={order.special_instructions} /> : null}
        </Card>

        <Card style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Delivery Status</Text>
          <StatusTimeline order={order} />
        </Card>

        {transition && (
          <Button
            title={transition.label}
            onPress={handleStatusUpdate}
            loading={loading}
            style={styles.actionBtn}
          />
        )}

        {order.status === 'delivered' && (
          <Card style={styles.successCard}>
            <Text style={styles.successText}>✅ Delivery Complete!</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.gold, fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  customerCard: { marginBottom: 16 },
  timelineCard: { marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.whiteMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: COLORS.whiteMuted, fontSize: 14 },
  rowValue: { color: COLORS.white, fontSize: 14, fontWeight: '500', maxWidth: '55%', textAlign: 'right', textTransform: 'capitalize' },
  actionBtn: {},
  successCard: { marginTop: 12, alignItems: 'center' },
  successText: { color: COLORS.success, fontSize: 16, fontWeight: '700' },
});
