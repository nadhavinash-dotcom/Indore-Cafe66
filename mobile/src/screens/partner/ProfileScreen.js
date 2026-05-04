import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

export default function PartnerProfileScreen() {
  const partner = useAuthStore((s) => s.partner);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [profile, setProfile] = useState(null);
  const [onDuty, setOnDuty] = useState(false);
  const [dutyLoading, setDutyLoading] = useState(false);

  useEffect(() => {
    api.get('/partner/profile').then(({ data }) => {
      setProfile(data.partner);
      setOnDuty(!!data.partner?.is_on_duty);
    }).catch(() => { });
  }, []);

  async function toggleDuty() {
    setDutyLoading(true);
    try {
      const { data } = await api.put('/partner/duty', { isOnDuty: !onDuty });
      setOnDuty(data.isOnDuty);
    } catch { } finally {
      setDutyLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => clearAuth('partner') },
    ]);
  }

  const data = profile || partner;
  const [delivered, setDelivered] = useState(0);

  async function loadOrders() {
    try {
      const res = await api.get('/partner/orders/today');

      const count = res?.data?.orders?.filter(
        (o) => o.status === 'delivered'
      ).length || 0;

      setDelivered(count);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{data?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.name}>{data?.name || 'Partner'}</Text>
          <Text style={styles.phone}>+91 {data?.phone}</Text>
        </View>

        <Card style={styles.dutyCard}>
          <View style={styles.dutyRow}>
            <Text style={styles.dutyLabel}>Duty Status</Text>
            <Button
              title={onDuty ? '🟢 On Duty' : '🔴 Off Duty'}
              onPress={toggleDuty}
              loading={dutyLoading}
              variant={onDuty ? 'primary' : 'secondary'}
              style={styles.dutyBtn}
            />
          </View>
        </Card>

        {profile && (
          <Card style={styles.infoCard}>
            <InfoRow label="Vehicle" value={profile.vehicle_type} />
            <InfoRow label="Total Deliveries" value={delivered} />
            <InfoRow label="Rating" value={profile.rating ? `${profile.rating}/5` : 'New'} />
            <InfoRow label="Areas" value={profile.area_coverage} />
          </Card>
        )}

        <Button title="Logout" variant="danger" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
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
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.black },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  phone: { color: COLORS.whiteMuted, fontSize: 14, marginTop: 4 },
  dutyCard: { marginBottom: 16 },
  dutyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dutyLabel: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  dutyBtn: { minWidth: 120 },
  infoCard: { marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { color: COLORS.whiteMuted, fontSize: 14 },
  infoValue: { color: COLORS.white, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
});
