import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🍱</Text>
          <Text style={styles.brand}>Cafe Indoor</Text>
          <Text style={styles.tagline}>Premium Food Delivery · Indore</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('CustomerLogin')}
          >
            <Text style={styles.primaryBtnText}>Order as Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('PartnerLogin')}
          >
            <Text style={styles.secondaryBtnText}>Delivery Partner Login</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => navigation.navigate('AdminLogin')}
          >
            <Text style={styles.ghostBtnText}>Admin Portal</Text>
          </TouchableOpacity> */}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 72, marginBottom: 16 },
  brand: { fontSize: 36, fontWeight: '800', color: COLORS.gold, letterSpacing: 1 },
  tagline: { fontSize: 14, color: COLORS.whiteMuted, marginTop: 8, letterSpacing: 0.5 },
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: COLORS.black, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: { color: COLORS.gold, fontSize: 16, fontWeight: '600' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText: { color: COLORS.whiteMuted, fontSize: 14 },
});
