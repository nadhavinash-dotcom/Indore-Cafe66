import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function Spinner({ size = 'large', fullscreen = false, style }) {
  if (fullscreen) {
    return (
      <View style={styles.fullscreen}>
        <ActivityIndicator size={size} color={COLORS.gold} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={COLORS.gold} style={style} />;
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
