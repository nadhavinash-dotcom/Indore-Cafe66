import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { formatISTDate } from '../../lib/timeUtils';

export default function ProfileScreen({ navigation }) {
  const customer = useAuthStore((s) => s.customer);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sub, setSub] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, sRes] = await Promise.all([
          api.get('/customer/profile'),
          api.get('/customer/subscription'),
        ]);

        setProfile(pRes.data.customer);
        setSub(sRes.data.subscription);
        setEditForm(pRes.data.customer);
      } catch (err) {
        console.log('Load error:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuth('customer');
        },
      },
    ]);
  }

  const data = profile || customer;

 const Remainingdays = (endDateStr) => {
  if (!endDateStr) return 0;

  const today = new Date();
  const endDate = new Date(endDateStr);

  // ❗ check invalid date
  if (isNaN(endDate.getTime())) {
    console.log('Invalid endDate:', endDateStr);
    return 0;
  }

  // normalize both dates
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const diffMs = endDate - today;

  if (diffMs < 0) return 0;

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return days;
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{data?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.name}>{data?.name || 'Customer'}</Text>
          <Text style={styles.phone}>+91 {data?.phone}</Text>
        </View>

        <Card style={styles.infoCard}>
          <InfoRow label="Area" value={data?.area} />
          <InfoRow label="Address" value={data?.address_line1} />
          {data?.landmark ? <InfoRow label="Landmark" value={data.landmark} /> : null}
          <InfoRow label="Meal Preference" value={data?.meal_preference} />
        </Card>

        {sub ? (
          <Card style={styles.subCard}>
            <Text style={styles.cardTitle}>Active Subscription</Text>
            <InfoRow label="Plan" value={sub.status} />
            <InfoRow label="Expires" value={formatISTDate(sub.end_date)} />
            <InfoRow label="Meals Left" value={String(Remainingdays(sub.end_date))} />
          </Card>
        ) :
          <Button
            title="Subscribe / Upgrade"
            variant="secondary"
            onPress={() => navigation.navigate('Plans')}
            style={styles.upgradeBtn}
          />}


        <Button
          title="Logout"
          variant="danger"
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.black },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  phone: { color: COLORS.whiteMuted, fontSize: 14, marginTop: 4 },
  infoCard: { marginBottom: 16 },
  subCard: { marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { color: COLORS.whiteMuted, fontSize: 14 },
  infoValue: { color: COLORS.white, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  upgradeBtn: { marginBottom: 12 },
});
