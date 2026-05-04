import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import CountdownTimer from '../../components/ui/CountdownTimer';
import OrderStatusBadge from '../../components/shared/OrderStatusBadge';
import useCutoffTimer from '../../hooks/useCutoffTimer';
import useAuthStore from '../../store/authStore';
import useTimerStore from '../../store/timerStore';
import api from '../../lib/api';
import { formatISTDate } from '../../lib/timeUtils';

export default function DashboardScreen({ navigation }) {
  useCutoffTimer();
  const customer = useAuthStore((s) => s.customer);
  const lunchTimer = useTimerStore((s) => s.lunch);
  const dinnerTimer = useTimerStore((s) => s.dinner);
  const [subscription, setSubscription] = useState(null);
  const [todayOrders, setTodayOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  // New States for Address Update
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [updating, setUpdating] = useState(false);

  async function loadData() {
    try {
      const [subRes, ordersRes] = await Promise.all([
        api.get('/customer/subscription'),
        api.get('/orders/today'),
      ]);
      setSubscription(subRes.data.subscription);
      setTodayOrders(ordersRes.data.orders || []);
    } catch (err) {
      console.error("Load Error", err);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Handle Address Update API Call
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const HandleSaveAddress = async () => {
    setSaving(true);
    try {
      // This matches your web logic: sending the editForm to /customer/profile
      await api.put('/customer/profile', editForm);

      Alert.alert("Success", "Profile updated successfully.");
      setShowAddressModal(false);

      // Refresh data to show the new address across the app
      loadData();
    } catch (error) {
      Alert.alert("Error", "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const activeMeal = lunchTimer.isOpen ? 'lunch' : dinnerTimer.isOpen ? 'dinner' : null;
const isMealBooked = todayOrders.some(order => order.meal_type === activeMeal);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {customer?.name || 'Friend'}</Text>
            <Text style={styles.date}>{formatISTDate(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Timer Card */}
        {activeMeal ? (
          <Card style={styles.timerCard} elevated>
            <CountdownTimer meal={activeMeal} />
          </Card>
        ) : (
          <Card style={styles.timerCard}>
            <Text style={styles.closedText}>No active booking window</Text>
            <Text style={styles.closedSub}>Next opens at 9:00 AM IST</Text>
          </Card>
        )}

        {/* Quick Book */}
        {activeMeal && !isMealBooked ? (
        <TouchableOpacity 
          style={styles.bookBtn} 
          onPress={() => navigation.navigate('BookMeal')}
        >
          <Text style={styles.bookBtnText}>
            🍱 Book {activeMeal === 'lunch' ? 'Lunch' : 'Dinner'} Now
          </Text>
        </TouchableOpacity>
      ) : activeMeal && isMealBooked ? (
        <View style={[styles.bookBtn, { backgroundColor: COLORS.blackLight, borderWidth: 1, borderColor: COLORS.blackBorder }]}>
          <Text style={[styles.bookBtnText, { color: COLORS.whiteMuted }]}>
            ✅ {activeMeal === 'lunch' ? 'Lunch' : 'Dinner'} Already Booked
          </Text>
        </View>
      ) : null}

        {/* Subscription Info */}
        <Card style={styles.subCard}>
          <Text style={styles.sectionTitle}>{subscription ? 'Active Subscription' : 'No Active Subscription'}</Text>
          {subscription ? (
            <>
              <View style={styles.subRow}><Text style={styles.subLabel}>Plan</Text><Text style={styles.subValue}>{subscription.meal_type}</Text></View>
              <View style={styles.subRow}><Text style={styles.subLabel}>Valid Until</Text><Text style={styles.subValue}>{formatISTDate(subscription.end_date)}</Text></View>
            </>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Plans')}>
              <Text style={styles.subCta}>Tap to explore plans →</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Today's Orders */}
        {todayOrders.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Today's Orders</Text>
            {todayOrders.map((order) => (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderRow}>
                  <Text style={styles.orderMeal}>{order.meal_type === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</Text>
                  <OrderStatusBadge status={order.status} />
                </View>

                {/* Update Address Button logic: Only if confirmed or picked_up (per your example logic) */}
                {(order.status === 'conformed' || order.status === 'picked_up') && (
                  <TouchableOpacity
                    style={styles.updateAddrBtn}
                    onPress={() => {
                      setSelectedOrder(order);
                      setNewAddress(order.delivery_address || '');
                      setShowAddressModal(true);
                    }}
                  >
                    <Text style={styles.updateAddrText}>Change Delivery Address</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Address Update Modal */}
      <Modal visible={showAddressModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Delivery Address</Text>
              {/* <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Text style={{ color: COLORS.whiteMuted, fontSize: 18 }}>✕</Text>
              </TouchableOpacity> */}
            </View>

            <Text style={styles.inputLabel}>Address Line 1</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={3}
              placeholder="Enter your house/flat no, building, street..."
              placeholderTextColor={COLORS.whiteMuted}
              // Updating the specific key in editForm
              value={editForm.address_line1 || ''}
              onChangeText={(text) => setEditForm({ ...editForm, address_line1: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={HandleSaveAddress}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  date: { color: COLORS.whiteMuted, fontSize: 13, marginTop: 2 },
  timerCard: { marginBottom: 16, alignItems: 'center', paddingVertical: 20 },
  closedText: { color: COLORS.whiteMuted, fontSize: 16, textAlign: 'center' },
  closedSub: { color: COLORS.blackBorder, fontSize: 12, textAlign: 'center', marginTop: 4 },
  bookBtn: { backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  bookBtnText: { color: COLORS.black, fontSize: 16, fontWeight: '700' },
  subCard: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  subLabel: { color: COLORS.whiteMuted, fontSize: 14 },
  subValue: { color: COLORS.white, fontSize: 14, fontWeight: '500' },
  subCta: { color: COLORS.gold, fontSize: 14 },
  orderCard: { marginBottom: 10, padding: 15 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMeal: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  updateAddrBtn: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.blackBorder },
  updateAddrText: { color: COLORS.gold, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.blackLight || '#1A1A1A', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: COLORS.gold },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  textInput: { backgroundColor: COLORS.black, color: COLORS.white, borderRadius: 10, padding: 12, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.blackBorder, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.blackBorder },
  saveBtn: { backgroundColor: COLORS.gold },
  cancelBtnText: { color: COLORS.white, fontWeight: '600' },
  saveBtnText: { color: COLORS.black, fontWeight: '700' },
});