import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

export default function SettingsScreen() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lunchCutoff, setLunchCutoff] = useState('9');
  const [dinnerCutoff, setDinnerCutoff] = useState('16');

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      setSettings(data.settings || {});
      setLunchCutoff(String(data.settings?.lunch_cutoff_hour ?? 9));
      setDinnerCutoff(String(data.settings?.dinner_cutoff_hour ?? 16));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function saveCutoffs() {
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        lunch_cutoff_hour: parseInt(lunchCutoff),
        dinner_cutoff_hour: parseInt(dinnerCutoff),
      });
      Alert.alert('Saved', 'Cutoff times updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Logout from admin portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => clearAuth('admin') },
    ]);
  }

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Settings</Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Order Cutoff Times</Text>
          <Input
            label="Lunch Cutoff Hour (0–23 IST)"
            value={lunchCutoff}
            onChangeText={setLunchCutoff}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Input
            label="Dinner Cutoff Hour (0–23 IST)"
            value={dinnerCutoff}
            onChangeText={setDinnerCutoff}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Button title="Save Cutoff Times" onPress={saveCutoffs} loading={saving} />
        </Card>

        {settings.coupons && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Active Coupons</Text>
            {Object.entries(JSON.parse(settings.coupons || '{}')).map(([code, discount]) => (
              <View key={code} style={styles.couponRow}>
                <Text style={styles.couponCode}>{code}</Text>
                <Text style={styles.couponDiscount}>{discount}</Text>
              </View>
            ))}
          </Card>
        )}

        <Button title="Logout Admin" variant="danger" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 24 },
  card: { marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 16 },
  couponRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  couponCode: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  couponDiscount: { color: COLORS.white, fontSize: 14 },
});
