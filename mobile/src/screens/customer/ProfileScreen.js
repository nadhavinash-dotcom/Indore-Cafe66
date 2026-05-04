import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { formatISTDate } from '../../lib/timeUtils';

export default function ProfileScreen({ navigation }) {
  const customer = useAuthStore((s) => s.customer);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const AREAS = [
    // Central / Popular
    'Banjara Hills', 'Jubilee Hills', 'Ameerpet', 'Begumpet', 'Punjagutta',
    'Somajiguda', 'Khairatabad', 'Lakdikapul',

    // IT Corridor
    'HITEC City', 'Madhapur', 'Gachibowli', 'Kondapur', 'Manikonda',
    'Nanakramguda', 'Financial District', 'Kokapet',

    // West Hyderabad
    'Kukatpally', 'KPHB', 'Moosapet', 'Miyapur', 'Bachupally', 'Nizampet',
    'Chanda Nagar', 'Lingampally', 'Beeramguda', 'Patancheru',

    // North
    'Secunderabad', 'Trimulgherry', 'Alwal', 'Kompally', 'Suchitra',
    'Bolarum', 'Medchal', 'Jeedimetla',

    // East
    'Uppal', 'Nagole', 'LB Nagar', 'Dilsukhnagar', 'Kothapet',
    'Vanastalipuram', 'Hayathnagar', 'Pocharam',

    // South
    'Mehdipatnam', 'Tolichowki', 'Attapur', 'Rajendranagar',
    'Shamshabad', 'Falaknuma', 'Chandrayangutta',

    // Old City
    'Charminar', 'Yakutpura', 'Dabirpura', 'Malakpet', 'Saidabad',

    // Other Important Areas
    'Hafeezpet', 'Serilingampally', 'Tellapur', 'Osman Nagar',
    'Appa Junction', 'Bandlaguda', 'Nagaram', 'ECIL', 'Kapra'
  ];
  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, sRes] = await Promise.all([
          api.get('/customer/profile'),
          api.get('/customer/subscription'),
        ]);
        setProfile(pRes.data.customer);
        setSub(sRes.data.subscription);
      } catch (err) {
        console.log('Load error:', err.message);
      }
    }
    loadData();
  }, []);

  function openEdit() {
    const data = profile || customer;
    setEditForm({
      name: data?.name || '',
      area: data?.area || '',
      address_line1: data?.address_line1 || '',
      landmark: data?.landmark || '',
      meal_preference: data?.meal_preference || '',
    });
    setSelectedArea(data?.area || ''); // ✅ sync here
    setEditVisible(true);
  }

  async function handleSave() {
    if (!editForm.name?.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/customer/profile', editForm);
      setProfile(res.data.customer);
      setEditVisible(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

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

  const remainingDays = (endDateStr) => {
    if (!endDateStr) return 0;
    const today = new Date();
    const endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) return 0;
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffMs = endDate - today;
    if (diffMs < 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
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
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Details</Text>
            <TouchableOpacity onPress={openEdit} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
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
            <InfoRow label="Meals Left" value={String(remainingDays(sub.end_date))} />
          </Card>
        ) : (
          <Button
            title="Subscribe / Upgrade"
            variant="secondary"
            onPress={() => navigation.navigate('Plans')}
            style={styles.upgradeBtn}
          />
        )}

        <Button title="Logout" variant="danger" onPress={handleLogout} />
      </ScrollView>

      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <Input
                label="Name"
                value={editForm.name}
                onChangeText={(v) => setEditaddress_line1Form((f) => ({ ...f, name: v }))}
                placeholder="Your name"
              />

              <Input
                label="Area"
                value={editForm.area}
                onChangeText={(v) => setEditForm((f) => ({ ...f, area: v }))}
                placeholder="Area"
              />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {AREAS.map((area) => (
                  <TouchableOpacity
                    key={area}
                    onPress={() => {
                      setSelectedArea(area);
                      setEditForm((f) => ({ ...f, area }));
                    }}
                    style={[
                      styles.areaChip,
                      selectedArea === area && styles.areaChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.areaText,
                        selectedArea === area && styles.areaTextSelected,
                      ]}
                    >
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label="Address"
                value={editForm.address_line1}
                onChangeText={(v) => setEditForm((f) => ({ ...f, address_line1: v }))}
                placeholder="Address"
              />
              <Input
                label="Landmark"
                value={editForm.landmark}
                onChangeText={(v) => setEditForm((f) => ({ ...f, landmark: v }))}
                placeholder="Landmark (optional)"
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setEditVisible(false)}
                  style={styles.modalBtn}
                />
                <Button
                  title={saving ? 'Saving…' : 'Save'}
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.modalBtn}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  editBtn: { paddingHorizontal: 14, paddingVertical: 5, backgroundColor: COLORS.gold, borderRadius: 8 },
  editBtnText: { color: COLORS.black, fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { color: COLORS.whiteMuted, fontSize: 14 },
  infoValue: { color: COLORS.white, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  upgradeBtn: { marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.blackSoft,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },

  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn: { flex: 1 },
  areaChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.whiteMuted,
    margin: 4,
  },

  areaChipSelected: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  areaText: {
    color: COLORS.whiteMuted,
    fontSize: 13,
  },

  areaTextSelected: {
    color: COLORS.black,
    fontWeight: '600',
  },
});
