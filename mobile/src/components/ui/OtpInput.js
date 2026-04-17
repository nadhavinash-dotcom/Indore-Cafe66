import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function OtpInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  function handleChange(text, index) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (next.every((v) => v !== '')) {
      onComplete?.(next.join(''));
    }
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const next = [...values];
      next[index - 1] = '';
      setValues(next);
    }
  }

  return (
    <View style={styles.row}>
      {values.map((val, i) => (
        <TextInput
          key={i}
          ref={(r) => (inputs.current[i] = r)}
          style={[styles.cell, val ? styles.cellFilled : null]}
          value={val}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  cell: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.blackBorder,
    backgroundColor: COLORS.blackSoft,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
  },
  cellFilled: {
    borderColor: COLORS.gold,
  },
});
