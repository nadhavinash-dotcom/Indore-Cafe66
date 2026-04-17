import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const PLANS = [
  { id: 'trial', name: 'Trial Pack', price: 99, days: 7, meals: 'Lunch only', description: '7 days to fall in love' },
  { id: 'monthly', name: 'Monthly', price: 1999, days: 30, meals: 'Lunch + Dinner', description: 'Our most popular plan', popular: true },
  { id: 'premium', name: 'Premium', price: 2999, days: 30, meals: 'Lunch + Dinner + Snacks', description: 'Full Indoori experience' },
];

const PREFS = [
  { id: 'veg', label: '🥦 Veg', color: '#4CAF50' },
  { id: 'nonveg', label: '🍗 Non-Veg', color: '#E53935' },
  { id: 'jain', label: '🌿 Jain', color: '#FF9800' },
];

export default function PlansScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [mealPref, setMealPref] = useState('veg');

  function handleNext() {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    navigation.navigate('Address', { plan, mealPref });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Fresh homestyle meals delivered daily</Text>

        {PLANS.map((plan) => (
          <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)}>
            <Card style={[styles.planCard, selectedPlan === plan.id && styles.planSelected]}>
              {plan.popular && <Text style={styles.popularBadge}>Most Popular</Text>}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>₹{plan.price}</Text>
              </View>
              <Text style={styles.planDays}>{plan.days} days · {plan.meals}</Text>
              <Text style={styles.planDesc}>{plan.description}</Text>
            </Card>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Meal Preference</Text>
        <View style={styles.prefRow}>
          {PREFS.map((pref) => (
            <TouchableOpacity
              key={pref.id}
              onPress={() => setMealPref(pref.id)}
              style={[styles.prefBtn, mealPref === pref.id && { borderColor: pref.color, backgroundColor: `${pref.color}22` }]}
            >
              <Text style={[styles.prefLabel, mealPref === pref.id && { color: pref.color }]}>{pref.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Continue →" onPress={handleNext} style={styles.continueBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  subtitle: { color: COLORS.whiteMuted, fontSize: 14, marginBottom: 24 },
  planCard: { marginBottom: 12 },
  planSelected: { borderColor: COLORS.gold, borderWidth: 2 },
  popularBadge: { color: COLORS.gold, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  planPrice: { fontSize: 22, fontWeight: '800', color: COLORS.gold },
  planDays: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 4 },
  planDesc: { color: COLORS.whiteMuted, fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginTop: 24, marginBottom: 12 },
  prefRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  prefBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.blackBorder,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  prefLabel: { color: COLORS.whiteMuted, fontSize: 14, fontWeight: '600' },
  continueBtn: {},
});
