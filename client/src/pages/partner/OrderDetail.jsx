import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Phone, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PartnerLayout from '../../components/layout/PartnerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StatusTimeline from '../../components/shared/StatusTimeline';

const STATUS_TRANSITIONS = {
  confirmed: { nextStatus: 'picked_up', buttonLabel: 'Tiffin Utha Liya 📦', buttonVariant: 'primary', subtitle: 'Cafe Indoori se tiffin collect karne ke baad press karo' },
  picked_up: { nextStatus: 'in_transit', buttonLabel: 'Delivery Shuru 🛵', buttonVariant: 'warning', subtitle: 'Customer ki taraf nikalne ke baad press karo' },
  in_transit: { nextStatus: 'delivered', buttonLabel: 'Deliver Ho Gaya ✅', buttonVariant: 'success', subtitle: 'Customer ko tiffin dene ke baad press karo' },
};

const CONFIRM_MESSAGES = {
  picked_up: (name) => `Kya aapne Cafe Indoori se ${name} ka tiffin le liya hai?`,
  in_transit: () => 'Kya aap customer ki taraf nikal rahe hain?',
  delivered: (name) => `Kya aapne ${name} ko tiffin deliver kar diya?`,
};

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(state?.order);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const transition = order ? STATUS_TRANSITIONS[order.status] : null;
  const mapsUrl = order ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([order.address_line1, order.area, 'Indore'].filter(Boolean).join(', '))}` : '#';

  async function handleStatusUpdate() {
    if (!transition) return;
    setUpdating(true);
    try {
      await api.put(`/partner/orders/${order.id}/status`, { status: transition.nextStatus });
      setOrder(prev => ({ ...prev, status: transition.nextStatus }));
      toast.success(`${transition.nextStatus === 'picked_up' ? 'Tiffin pick up ho gaya!' : transition.nextStatus === 'in_transit' ? 'Delivery shuru!' : 'Deliver ho gaya! 🎉'}`);
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update fail');
    } finally {
      setUpdating(false);
    }
  }

  if (!order) return <PartnerLayout><p className="p-4 text-ci-white-muted">Order nahi mila</p></PartnerLayout>;

  return (
    <PartnerLayout>
      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate(-1)} className="text-ci-white-muted hover:text-ci-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-playfair text-xl text-ci-white font-bold flex-1">Order #{order.id}</h1>
          <Badge status={order.status}>{order.status}</Badge>
        </div>

        {/* Customer Info */}
        <Card goldLeft>
          <h3 className="text-ci-gold font-semibold mb-3">{order.customer_name}</h3>
          <div className="flex items-start gap-2 mb-2">
            <MapPin size={15} className="text-ci-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-ci-white text-sm">{order.address_line1}</p>
              {order.address_line2 && <p className="text-ci-white-muted text-xs">{order.address_line2}</p>}
              {order.landmark && <p className="text-ci-white-muted text-xs">Near: {order.landmark}</p>}
              <p className="text-ci-white-muted text-xs">{order.area}, Indore {order.pincode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-ci-gold" />
            <a href={`tel:+91${order.phone}`} className="text-ci-gold text-sm">{order.phone}</a>
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-ci-gold text-sm hover:text-ci-gold-light">
            <MapPin size={14} /> Google Maps pe dekho
          </a>
        </Card>

        {/* Meal Info */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ci-white font-medium capitalize">{order.meal_type} — {order.meal_preference}</p>
              <p className="text-ci-white-muted text-xs mt-0.5">{order.meal_type === 'lunch' ? '12 PM – 2 PM' : '7 PM – 9 PM'}</p>
            </div>
            <span className={`text-2xl ${order.meal_preference === 'veg' ? '🌿' : order.meal_preference === 'jain' ? '🌾' : '🍗'}`} />
          </div>
          {(order.special_instructions || order.special_note) && (
            <div className="mt-3 bg-ci-warning/10 border border-ci-warning/20 rounded-xl p-3">
              <p className="text-ci-warning text-xs font-medium">Special Note:</p>
              <p className="text-ci-white text-sm mt-0.5">{order.special_instructions || order.special_note}</p>
            </div>
          )}
        </Card>

        {/* Status Timeline */}
        <Card>
          <h3 className="text-ci-white font-semibold mb-3">Status</h3>
          <StatusTimeline order={order} />
        </Card>

        {/* Action Button */}
        {transition ? (
          <div>
            <p className="text-ci-white-muted text-xs text-center mb-3">{transition.subtitle}</p>
            <Button
              size="lg"
              variant={transition.buttonVariant}
              onClick={() => setShowConfirm(true)}
            >
              {transition.buttonLabel}
            </Button>
          </div>
        ) : order.status === 'delivered' ? (
          <Card className="text-center py-4">
            <p className="text-ci-success font-semibold text-lg">Delivered ✅</p>
          </Card>
        ) : null}
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Karo">
        <div className="space-y-4">
          <p className="text-ci-white text-sm">
            {CONFIRM_MESSAGES[transition?.nextStatus]?.(order.customer_name)}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button className="flex-1" loading={updating} onClick={handleStatusUpdate}>Haan, Confirm!</Button>
          </div>
        </div>
      </Modal>
    </PartnerLayout>
  );
}
