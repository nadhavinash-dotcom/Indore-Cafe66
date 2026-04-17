import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Button from '../../components/ui/Button';

export default function PaymentSuccessScreen({ navigation, route }) {
  const { subscription } = route.params || {};
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.icon}>✅</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Subscription Active!</Text>
          <Text style={styles.subtitle}>Your tiffin journey begins tomorrow morning</Text>

          {subscription && (
            <View style={styles.details}>
              <Text style={styles.detailItem}>📅 {subscription.startDate} → {subscription.endDate}</Text>
              <Text style={styles.detailItem}>🍱 {subscription.mealsRemaining} meals remaining</Text>
            </View>
          )}
        </Animated.View>

        <Button
          title="Go to Dashboard"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CustomerApp' }] })}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconContainer: { marginBottom: 24 },
  icon: { fontSize: 72 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { color: COLORS.whiteMuted, fontSize: 15, textAlign: 'center', marginBottom: 32 },
  details: { gap: 10, marginBottom: 40 },
  detailItem: { color: COLORS.white, fontSize: 15, textAlign: 'center' },
  btn: { width: '100%' },
});
