import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, CheckCircle, Package, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import PartnerLayout from '../../components/layout/PartnerLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatISTDate } from '../../lib/timeUtils';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { partner, setPartner } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(partner?.isOnDuty || false);
  const [toggling, setToggling] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/partner/orders/today');
      setOrders(res.data.orders);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDuty() {
    setToggling(true);
    try {
      const res = await api.put('/partner/duty', { isOnDuty: !isOnDuty });
      setIsOnDuty(res.data.isOnDuty);
      setPartner({ ...partner, isOnDuty: res.data.isOnDuty }, localStorage.getItem('ci_partner_token'));
      toast.success(res.data.isOnDuty ? 'You are now on duty.' : 'You are now off duty.');
    } finally {
      setToggling(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const total = orders.length;
  const completed = orders.filter((order) => order.status === 'delivered').length;
  const pending = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length;

  return (
    <PartnerLayout>
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="font-playfair text-xl text-ci-white font-bold">Welcome, {partner?.name?.split(' ')[0]}!</h1>
            <p className="text-ci-white-muted text-xs mt-0.5">{formatISTDate(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }))}</p>
          </div>
          <button
            onClick={toggleDuty}
            disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors font-semibold text-sm ${isOnDuty ? 'bg-ci-gold border-ci-gold text-ci-black' : 'border-ci-black-border text-ci-white-muted'}`}
          >
            {isOnDuty ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {isOnDuty ? 'On Duty' : 'Off Duty'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[['Total', total, Package, 'text-ci-gold'], ['Done', completed, CheckCircle, 'text-ci-success'], ['Pending', pending, Clock, 'text-ci-warning']].map(([label, value, Icon, color]) => (
            <Card key={label} className="text-center">
              <Icon size={18} className={`${color} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-ci-white-muted text-xs">{label}</p>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-ci-white font-semibold mb-3">Today's Orders</h2>
          {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
            <>
              {orders.length === 0 && (
                <Card className="text-center py-8">
                  <p className="text-ci-white-muted">No orders assigned yet.</p>
                </Card>
              )}
              <div className="space-y-2">
                {orders.sort((a, b) => {
                  const orderStatus = ['Confirmed', 'Picked_up', 'In_transit', 'Pending', 'Delivered'];
                  return orderStatus.indexOf(a.status) - orderStatus.indexOf(b.status);
                }).map((order) => (
                  <Card
                    key={order.id}
                    onClick={() => navigate(`/partner/order/${order.id}`, { state: { order } })}
                    className="cursor-pointer hover:border-ci-gold active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-ci-gold font-semibold text-sm">{order.customer_name}</span>
                          <Badge status={order.meal_type === 'lunch' ? 'gold' : 'warning'} variant={order.meal_type === 'lunch' ? 'gold' : 'warning'}>
                            {order.meal_type}
                          </Badge>
                        </div>
                        <p className="text-ci-white-muted text-xs">{order.area} • {order.address_line1?.slice(0, 30)}</p>
                        <p className="text-ci-white-muted text-xs capitalize">{order.meal_preference}</p>
                      </div>
                      <Badge status={order.status}>{order.status}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}
