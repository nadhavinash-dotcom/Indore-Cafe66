import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useTimerStore from '../../store/timerStore';
import api from '../../lib/api';

const MEAL_TYPES = [
  { id: 'lunch', label: '☀️ Lunch', cutoff: '9:00 AM IST' },
  { id: 'dinner', label: '🌙 Dinner', cutoff: '4:00 PM IST' },
];

export default function BookMealScreen({ navigation }) {
  const lunchOpen = useTimerStore((s) => s.lunch.isOpen);
  const dinnerOpen = useTimerStore((s) => s.dinner.isOpen);
  const [selectedMeal, setSelectedMeal] = useState(lunchOpen ? 'lunch' : dinnerOpen ? 'dinner' : 'lunch');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isOpen = selectedMeal === 'lunch' ? lunchOpen : dinnerOpen;

  async function handleBook() {
    if (!isOpen) {
      Alert.alert('Booking Closed', `${selectedMeal === 'lunch' ? 'Lunch' : 'Dinner'} booking window has closed for today.`);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/orders/book', {
        mealType: selectedMeal,
        specialInstructions: notes,
      });
      Alert.alert('Booked!', 'Your meal has been confirmed 🎉', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Book a Meal</Text>
        <Text style={styles.subtitle}>Select your meal for today</Text>

        <View style={styles.mealRow}>
          {MEAL_TYPES.map((meal) => {
            const open = meal.id === 'lunch' ? lunchOpen : dinnerOpen;
            const selected = selectedMeal === meal.id;
            return (
              <TouchableOpacity
                key={meal.id}
                onPress={() => setSelectedMeal(meal.id)}
                style={[
                  styles.mealCard,
                  selected && styles.mealCardSelected,
                  !open && styles.mealCardClosed,
                ]}
              >
                <Text style={styles.mealEmoji}>{meal.id === 'lunch' ? '☀️' : '🌙'}</Text>
                <Text style={[styles.mealLabel, selected && styles.mealLabelSelected]}>
                  {meal.id === 'lunch' ? 'Lunch' : 'Dinner'}
                </Text>
                <Text style={styles.cutoffText}>Cutoff: {meal.cutoff}</Text>
                {!open && <Text style={styles.closedBadge}>Closed</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Special Instructions (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Less spicy, extra roti, etc."
          multiline
          numberOfLines={3}
        />

        {!isOpen && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠️ The booking window for {selectedMeal} is closed. Please try again tomorrow.
            </Text>
          </Card>
        )}

        <Button
          title={`Book ${selectedMeal === 'lunch' ? 'Lunch' : 'Dinner'}`}
          onPress={handleBook}
          loading={loading}
          disabled={!isOpen}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  subtitle: { color: COLORS.whiteMuted, fontSize: 14, marginBottom: 24 },
  mealRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  mealCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.blackBorder,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.blackSoft,
  },
  mealCardSelected: { borderColor: COLORS.gold },
  mealCardClosed: { opacity: 0.5 },
  mealEmoji: { fontSize: 28, marginBottom: 6 },
  mealLabel: { fontSize: 16, fontWeight: '700', color: COLORS.whiteMuted },
  mealLabelSelected: { color: COLORS.gold },
  cutoffText: { fontSize: 11, color: COLORS.whiteMuted, marginTop: 4 },
  closedBadge: { color: COLORS.error, fontSize: 11, fontWeight: '700', marginTop: 4 },
  warningCard: { marginBottom: 16, borderColor: COLORS.warning },
  warningText: { color: COLORS.warning, fontSize: 13 },
});
