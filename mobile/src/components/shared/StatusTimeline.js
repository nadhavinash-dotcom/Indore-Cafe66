import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { formatISTTime } from '../../lib/timeUtils';

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', tsKey: 'status_confirmed_at' },
  { key: 'picked_up', label: 'Picked Up', tsKey: 'status_picked_up_at' },
  { key: 'in_transit', label: 'On the Way', tsKey: 'status_in_transit_at' },
  { key: 'delivered', label: 'Delivered', tsKey: 'status_delivered_at' },
];

const ORDER_INDEX = { confirmed: 0, picked_up: 1, in_transit: 2, delivered: 3, cancelled: -1 };

export default function StatusTimeline({ order }) {
  const currentIndex = ORDER_INDEX[order.status] ?? -1;

  return (
    <View style={styles.container}>
      {STEPS.map((step, i) => {
        const isDone = i <= currentIndex;
        const isActive = i === currentIndex;
        return (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.lineColumn}>
              <View style={[styles.dot, isDone ? styles.dotDone : styles.dotPending, isActive && styles.dotActive]} />
              {i < STEPS.length - 1 && (
                <View style={[styles.line, i < currentIndex ? styles.lineDone : styles.linePending]} />
              )}
            </View>
            <View style={styles.content}>
              <Text style={[styles.label, isDone ? styles.labelDone : styles.labelPending]}>
                {step.label}
              </Text>
              {order[step.tsKey] ? (
                <Text style={styles.time}>{formatISTTime(order[step.tsKey])}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  stepRow: { flexDirection: 'row', marginBottom: 0 },
  lineColumn: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  dotDone: { backgroundColor: COLORS.gold },
  dotPending: { backgroundColor: COLORS.blackBorder, borderWidth: 1.5, borderColor: COLORS.whiteMuted },
  dotActive: { backgroundColor: COLORS.goldLight, shadowColor: COLORS.gold, shadowRadius: 4, shadowOpacity: 0.8 },
  line: { width: 2, flex: 1, minHeight: 28 },
  lineDone: { backgroundColor: COLORS.gold },
  linePending: { backgroundColor: COLORS.blackBorder },
  content: { flex: 1, paddingLeft: 10, paddingBottom: 20 },
  label: { fontSize: 14, fontWeight: '600' },
  labelDone: { color: COLORS.white },
  labelPending: { color: COLORS.whiteMuted },
  time: { color: COLORS.whiteMuted, fontSize: 12, marginTop: 2 },
});
