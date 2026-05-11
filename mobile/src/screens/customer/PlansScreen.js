import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';

const PLANS = [
  { id: 'trial', name: 'Trial Pack', days: 7, meals: 'Flexible meals', description: 'Try and explore our meals' },
  { id: 'monthly', name: 'Monthly', days: 30, meals: 'Flexible meals', description: 'Our most popular plan', popular: true },
];

const MEAL_CHOICES = [
  { id: 'lunch', label: 'Lunch Only' },
  { id: 'dinner', label: 'Dinner Only' },
  { id: 'both', label: 'Both (Lunch & Dinner)' },
];

export default function PlansScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [mealChoice, setMealChoice] = useState('both');

  const [prices, setPrices] = useState({
    trial: { lunch: 0, dinner: 0, both: 0 },
    monthly: { lunch: 0, dinner: 0, both: 0 },
  });
  // ✅ Fetch pricing from backend


  const loadPrices = async () => {
    try {
      const res = await api.get('/admin/settings');
      const s = res.data.settings;
      // console.log(res)
      setPrices({
        monthly: {
          lunch: Number(s.monthly_single_price),
          dinner: Number(s.monthly_single_price),
          both: Number(s.monthly_both_price),
        },
        trial: {
          lunch: Number(s.trial_single_price),
          dinner: Number(s.trial_single_price),
          both: Number(s.trial_both_price),
        },
      });
    } catch (err) {
      console.log('Price load error:', err.message);
    }
  }
  useEffect(() => {
    loadPrices();
  }, []);

  // ✅ Get dynamic price
  function getPrice(planId, mealChoice) {
    return prices?.[planId]?.[mealChoice] ?? 0;
  }

  // ✅ Navigate to checkout
  function handleNext() {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    const finalPrice = getPrice(selectedPlan, mealChoice);
    console.log('price:',finalPrice,plan,mealChoice)
    navigation.navigate('Payment', {
      plan,
      mealChoice,
      price: finalPrice,
    });
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Fresh homestyle meals delivered daily</Text>

        {/* Plans */}
        {PLANS.map((plan) => (
          <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)}>
            <Card style={[styles.planCard, selectedPlan === plan.id && styles.planSelected]}>

              {plan.popular && <Text style={styles.popularBadge}>Most Popular</Text>}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>
                  ₹{getPrice(plan.id, mealChoice)}
                </Text>
              </View>

              <Text style={styles.planDays}>
                {plan.days} days · {plan.meals}
              </Text>

              <Text style={styles.planDesc}>{plan.description}</Text>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Meal Choice */}
        <Text style={styles.sectionTitle}>Meal Choice</Text>

        <View style={styles.prefRow}>
          {MEAL_CHOICES.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setMealChoice(item.id)}
              style={[
                styles.prefBtn,
                mealChoice === item.id && styles.prefSelected
              ]}
            >
              <Text
                style={[
                  styles.prefLabel,
                  mealChoice === item.id && styles.prefLabelSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue */}
        <Button title="Continue →" onPress={handleNext} />

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

  popularBadge: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  planPrice: { fontSize: 22, fontWeight: '800', color: COLORS.gold },

  planDays: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 4 },
  planDesc: { color: COLORS.whiteMuted, fontSize: 12, marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 24,
    marginBottom: 12,
  },

  prefRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',   // ✅ allow next line
    justifyContent: 'space-between',
    marginBottom: 32,
  },

  prefBtn: {
    width: '48%',   // ✅ 2 items per row (with spacing)
    borderWidth: 1.5,
    borderColor: COLORS.blackBorder,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10, // ✅ space between rows
  },

  prefSelected: {
    borderColor: COLORS.gold,
    backgroundColor: '#FFD70022',
  },

  prefLabel: {
    color: COLORS.whiteMuted,
    fontSize: 14,
    fontWeight: '600',
  },

  prefLabelSelected: {
    color: COLORS.gold,
  },
});