import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

const VARIANT_COLORS = {
  success: { bg: '#1B4332', text: '#4CAF50' },
  warning: { bg: '#3D2B00', text: '#FF9800' },
  error: { bg: '#3B0E0A', text: '#E53935' },
  info: { bg: '#1A2744', text: '#64B5F6' },
  gold: { bg: '#3D2800', text: COLORS.gold },
  default: { bg: COLORS.blackBorder, text: COLORS.whiteMuted },
};

export default function Badge({ label, variant = 'default', style }) {
  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.default;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
