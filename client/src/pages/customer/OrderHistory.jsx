import { useState, useEffect } from 'react';
import api from '../../lib/api';
import CustomerLayout from '../../components/layout/CustomerLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import StatusTimeline from '../../components/shared/StatusTimeline';
import { formatISTDate } from '../../lib/timeUtils';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/orders/history?page=${page}&limit=20`);
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  // Group orders by week
  const grouped = orders.reduce((acc, order) => {
    const date = new Date(order.delivery_date + 'T00:00:00');
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  return (
    <CustomerLayout>
      <div className="p-4 max-w-md mx-auto">
        <h1 className="font-playfair text-2xl text-ci-white font-bold pt-4 mb-6">Order History</h1>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <>
            {Object.entries(grouped).map(([weekStart, weekOrders]) => (
              <div key={weekStart} className="mb-6">
                <h3 className="text-ci-white-muted text-xs font-medium uppercase mb-2 tracking-wide">
                  Week of {formatISTDate(weekStart)}
                </h3>
                <div className="space-y-2">
                  {weekOrders.map(order => (
                    <Card key={order.id} onClick={() => setSelected(order)} className="flex items-center justify-between gap-3 cursor-pointer hover:border-ci-gold">
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{order.meal_type === 'lunch' ? '☀️' : '🌙'}</span>
                          <span className="text-ci-white font-medium capitalize">{order.meal_type}</span>
                          <Badge status={order.status}>{order.status}</Badge>
                        </div>
                        <p className="text-ci-white-muted text-xs mt-0.5">{formatISTDate(order.delivery_date)}</p>
                      </div>
                      {order.partner_name && <p className="text-ci-white-muted text-xs">{order.partner_name}</p>}
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-20">
                <p className="text-ci-white-muted">Koi orders nahi hain abhi.</p>
              </div>
            )}

            {total > 20 && (
              <div className="flex gap-2 justify-center mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-ci-gold text-sm disabled:opacity-30">← Prev</button>
                <span className="text-ci-white-muted text-sm">{page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}
                  className="text-ci-gold text-sm disabled:opacity-30">Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Order #${selected?.id}`}>
        {selected && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-ci-white-muted">Meal</span>
              <span className="text-ci-white capitalize">{selected.meal_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ci-white-muted">Date</span>
              <span className="text-ci-white">{formatISTDate(selected.delivery_date)}</span>
            </div>
            {selected.partner_name && (
              <div className="flex justify-between text-sm">
                <span className="text-ci-white-muted">Partner</span>
                <span className="text-ci-white">{selected.partner_name}</span>
              </div>
            )}
            <StatusTimeline order={selected} />
          </div>
        )}
      </Modal>
    </CustomerLayout>
  );
}
