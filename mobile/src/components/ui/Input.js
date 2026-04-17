import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function Input({ label, error, style, inputStyle, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor={COLORS.whiteMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    color: COLORS.whiteMuted,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.blackSoft,
    borderWidth: 1.5,
    borderColor: COLORS.blackBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: COLORS.white,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: COLORS.gold,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
