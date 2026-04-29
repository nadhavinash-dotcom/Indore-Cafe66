import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UtensilsCrossed } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import useOrderStore from '../../store/orderStore';
import useCutoffTimer from '../../hooks/useCutoffTimer';
import CustomerLayout from '../../components/layout/CustomerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import CountdownTimer from '../../components/ui/CountdownTimer';
import StatusTimeline from '../../components/shared/StatusTimeline';
import Spinner from '../../components/ui/Spinner';
import { daysLeft } from '../../lib/timeUtils';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const { todayOrders, subscription, setTodayOrders, setSubscription } = useOrderStore();
  const timer = useCutoffTimer();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/customer/profile');
        setProfile(response.data.customer);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setCurrentLocation({
          latitude,
          longitude,
        });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                Accept: 'application/json',
                'Accept-Language': 'en',
              },
            }
          );
          const data = await response.json();
          const address = data.address || {};
          const locationLabel = [
            address.suburb,
            address.neighbourhood,
            address.city || address.town || address.village,
            address.state,
          ].filter(Boolean)[0] || data.display_name || 'Current location';
          setCurrentLocationName(locationLabel);
        } catch (error) {
          console.error('Error resolving current location name:', error);
          setCurrentLocationName('Current location');
        }
      },
      (error) => {
        console.error('Error fetching current location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  async function loadData() {
    try {
      const [ordersRes, subRes] = await Promise.all([
        api.get('/orders/today'),
        api.get('/customer/subscription'),
      ]);
      setTodayOrders(ordersRes.data.orders);
      console.log(ordersRes.data.orders)
      setSubscription(subRes.data.subscription);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const HandleSaveAddress = async () => {
    try {
      await api.put('/customer/profile', editForm);
      toast.success('Profile updated successfully.');
      setEditing(false);
      load();
    } catch {
      toast.error('Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }


  const lunchOrder = todayOrders.find((order) => order.meal_type === 'lunch');
  const dinnerOrder = todayOrders.find((order) => order.meal_type === 'dinner');

  const timerLabel = timer.meal === 'lunch'
    ? 'Lunch ordering closes in:'
    : timer.meal === 'dinner'
      ? 'Dinner ordering closes in:'
      : null;

  const subDaysLeft = subscription ? daysLeft(subscription.end_date) : 0;

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="font-playfair text-2xl text-ci-white font-bold">Welcome, {customer?.name?.split(' ')[0]}!</h1>
            {subscription && (
              <div className="inline-flex items-center gap-1.5 mt-1.5 bg-ci-gold/15 border border-ci-gold/30 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ci-success" />
                <span className="text-ci-gold text-xs font-medium">Active • {subDaysLeft} days left</span>
              </div>
            )}
            {currentLocation && (
              <p className="text-ci-white-muted text-xs mt-2">
                Current location: {currentLocationName || `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`}
              </p>
            )}
          </div>
          <button className="text-ci-white-muted hover:text-ci-white"><Bell size={22} /></button>
        </div>

        <Card goldBorder className="border-t-4 border-t-ci-gold">
          {timer.isOpen ? (
            <>
              <p className="text-ci-white-muted text-sm mb-2">{timerLabel}</p>
              <div className="flex justify-center">
                <CountdownTimer secondsRemaining={timer.secondsRemaining} pulse={timer.secondsRemaining < 3600} />
              </div>
              {timer.bothOpen && (
                <p className="text-ci-white-muted text-xs text-center mt-2">Dinner can still be booked for today.</p>
              )}
              {!timer.bothOpen && timer.meal === 'dinner' && (
                <p className="text-ci-white-muted text-xs text-center mt-2">Lunch can only be booked for tomorrow.</p>
              )}
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-ci-white font-semibold mb-1">Today's orders are closed</p>
              <p className="text-ci-white-muted text-sm">Booking for tomorrow's meals will open at midnight.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/customer/book')}>
                Book for Tomorrow
              </Button>
            </div>
          )}
        </Card>

        {!subscription && (
          <Card goldBorder>
            <p className="text-ci-white font-semibold mb-1">No active subscription</p>
            <p className="text-ci-white-muted text-sm mb-3">Choose a plan and get fresh daily meals.</p>
            <Button size="sm" onClick={() => navigate('/customer/plans')}>Choose a Plan</Button>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ci-white font-semibold flex items-center gap-2">
              <UtensilsCrossed size={16} className="text-ci-gold" /> Today's Meals
            </h2>
            <p className="text-ci-white-muted text-xs">{new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['lunch', '☀️', '12 PM - 2 PM', lunchOrder, timer.lunchLocked],
              ['dinner', '🌙', '7 PM - 9 PM', dinnerOrder, timer.dinnerLocked],
            ].map(([meal, icon, window, order, locked]) => (
              <div
                key={meal}
                className={`bg-ci-black-soft border rounded-card p-3 ${order ? 'border-ci-gold/50' : locked ? 'border-ci-black-border opacity-70 watermark-closed' : 'border-ci-black-border'}`}
              >
                <div className="text-center mb-2">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-ci-white font-semibold capitalize text-sm mt-1">{meal}</p>
                  <p className="text-ci-white-muted text-xs">{window}</p>
                </div>
                {order ? (
                  <>
                    <div className="flex justify-center mb-2">
                      <Badge status={order.status}>{order.status}</Badge>
                    </div>
                    <StatusTimeline order={order} />
                    {order.status === "confirmed" || order.status === "picked_up" ? <Button
                      size="sm"
                      className="w-full text-xs py-2 mt-2"
                      onClick={() => {
                        setSelectedMeal(meal);
                        setShowAddressModal(true);
                      }}
                    >
                      Update Address
                    </Button> : ""}

                  </>
                ) : locked ? (
                  <p className="text-ci-error text-xs text-center">Booking closed</p>
                ) : (
                  <Button size="sm" className="w-full text-xs py-2 mt-1" onClick={() => navigate('/customer/book', { state: { meal } })}>
                    Book Now
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {subscription && timer.isOpen && (
          <Card className="bg-ci-gold/10 border-ci-gold/30 text-center">
            <p className="text-ci-white text-sm font-medium mb-2">
              {timer.meal === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'} booking is open - reserve now.
            </p>
            <Button size="sm" onClick={() => navigate('/customer/book', { state: { meal: timer.meal, profile, currentLocation } })}>
              Book Now
            </Button>
          </Card>
        )}
      </div>
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">

          {/* Modal Card */}
          <div className="w-full sm:w-96 bg-ci-black-soft border border-ci-black-border rounded-t-2xl sm:rounded-2xl p-4 animate-slideUp">

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-ci-white font-semibold text-sm">
                Update Address ({selectedMeal})
              </h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-ci-white-muted hover:text-ci-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Input */}
            <textarea
              rows={3}
              placeholder="Enter new delivery address..."
              value={editForm.address_line1 || ''} onChange={e => setEditForm({ ...editForm, address_line1: e.target.value })}
              className="w-full bg-ci-black border border-ci-black-border rounded-lg p-2 text-sm text-ci-white placeholder:text-ci-white-muted focus:outline-none focus:border-ci-gold"
            />

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-1/2"
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                className="w-1/2"
                onClick={() => {
                  HandleSaveAddress()
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
