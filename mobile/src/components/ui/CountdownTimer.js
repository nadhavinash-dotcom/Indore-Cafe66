import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import useTimerStore from '../../store/timerStore';
import { COLORS } from '../../constants/theme';

function DigitBox({ value, color }) {
  return (
    <View style={[styles.digitBox, { borderColor: color }]}>
      <Text style={[styles.digit, { color }]}>{String(value).padStart(2, '0')}</Text>
    </View>
  );
}

export default function CountdownTimer({ meal }) {
  const { secondsRemaining, isOpen } = useTimerStore((s) => s[meal]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const h = Math.floor(secondsRemaining / 3600);
  const m = Math.floor((secondsRemaining % 3600) / 60);
  const s = secondsRemaining % 60;

  let color = COLORS.gold;
  if (secondsRemaining < 3600) color = COLORS.error;
  else if (secondsRemaining < 7200) color = COLORS.warning;

  useEffect(() => {
    if (secondsRemaining < 3600 && isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [secondsRemaining < 3600, isOpen]);

  if (!isOpen) {
    return (
      <View style={styles.closedContainer}>
        <Text style={styles.closedText}>Booking Closed</Text>
        <Text style={styles.closedSub}>Opens tomorrow morning</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: secondsRemaining < 3600 ? pulseAnim : 1 }]}>
      <Text style={[styles.label, { color: COLORS.whiteMuted }]}>
        {meal === 'lunch' ? 'Lunch' : 'Dinner'} booking closes in
      </Text>
      <View style={styles.timerRow}>
        <DigitBox value={h} color={color} />
        <Text style={[styles.colon, { color }]}>:</Text>
        <DigitBox value={m} color={color} />
        <Text style={[styles.colon, { color }]}>:</Text>
        <DigitBox value={s} color={color} />
      </View>
      <View style={styles.labelsRow}>
        {['HRS', 'MIN', 'SEC'].map((l) => (
          <Text key={l} style={styles.unitLabel}>{l}</Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 13, marginBottom: 10, letterSpacing: 0.5 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  digitBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blackSoft,
  },
  digit: { fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
  colon: { fontSize: 26, fontWeight: '700', marginHorizontal: 2 },
  labelsRow: { flexDirection: 'row', marginTop: 6, gap: 0 },
  unitLabel: { color: COLORS.whiteMuted, fontSize: 11, width: 64, textAlign: 'center' },
  closedContainer: { alignItems: 'center', paddingVertical: 16 },
  closedText: { color: COLORS.error, fontSize: 18, fontWeight: '700' },
  closedSub: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 4 },
});
