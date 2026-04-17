import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const AREAS = [
  'Vijay Nagar', 'Scheme 54', 'AB Road', 'Palasia', 'Sapna Sangeeta',
  'Bhawarkua', 'Rajwada', 'Tilak Nagar', 'MR 10', 'Bicholi Mardana',
  'Rau', 'Nipania', 'Sudama Nagar', 'Lasudia', 'Banganga',
];

export default function AddressScreen({ navigation, route }) {
  const { plan, mealPref } = route.params;
  const [selectedArea, setSelectedArea] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!selectedArea) e.area = 'Please select your area';
    if (!addressLine.trim()) e.address = 'Enter your full address';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    navigation.navigate('Payment', {
      plan,
      mealPref,
      area: selectedArea,
      addressLine,
      landmark,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Address</Text>
        <Text style={styles.subtitle}>Where should we deliver your tiffin?</Text>

        <Text style={styles.label}>Select Area</Text>
        {errors.area ? <Text style={styles.error}>{errors.area}</Text> : null}
        <View style={styles.areaGrid}>
          {AREAS.map((area) => (
            <TouchableOpacity
              key={area}
              onPress={() => setSelectedArea(area)}
              style={[styles.areaChip, selectedArea === area && styles.areaChipSelected]}
            >
              <Text style={[styles.areaText, selectedArea === area && styles.areaTextSelected]}>
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Full Address"
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder="House/Flat No., Street, Colony"
          multiline
          numberOfLines={2}
          error={errors.address}
        />
        <Input
          label="Landmark (optional)"
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Near school, temple, etc."
        />

        <Button title="Proceed to Payment →" onPress={handleNext} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, paddingBottom: 40 },
  back: { marginBottom: 24 },
  backText: { color: COLORS.gold, fontSize: 15 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  subtitle: { color: COLORS.whiteMuted, fontSize: 14, marginBottom: 24 },
  label: { color: COLORS.whiteMuted, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  error: { color: COLORS.error, fontSize: 12, marginBottom: 8 },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  areaChip: {
    borderWidth: 1.5,
    borderColor: COLORS.blackBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.blackSoft,
  },
  areaChipSelected: { borderColor: COLORS.gold, backgroundColor: '#3D280022' },
  areaText: { color: COLORS.whiteMuted, fontSize: 13 },
  areaTextSelected: { color: COLORS.gold, fontWeight: '600' },
});
