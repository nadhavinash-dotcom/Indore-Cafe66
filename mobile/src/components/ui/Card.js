import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function Card({ children, onPress, style, elevated = false }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, elevated && styles.elevated, style]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.blackSoft,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    borderRadius: 16,
    padding: 16,
  },
  elevated: {
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
});
