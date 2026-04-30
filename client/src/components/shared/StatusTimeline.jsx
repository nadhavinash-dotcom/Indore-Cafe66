import { formatISTTime } from '../../lib/timeUtils';
import { Check, Circle } from 'lucide-react';

const STEPS = [
  { key: 'created', label: 'Order Placed', timeKey: 'created_at' },
  { key: 'conformed', label: 'Confirmed', timeKey: 'status_confirmed_at' },
  { key: 'picked_up', label: 'Picked Up', timeKey: 'status_picked_up_at' },
  { key: 'in_transit', label: 'On the Way', timeKey: 'status_in_transit_at' },
  { key: 'delivered', label: 'Delivered', timeKey: 'status_delivered_at' },
];

const STATUS_INDEX = { pending: 0, conformed: 1, picked_up: 2, in_transit: 3, delivered: 4, cancelled: -1 };

export default function StatusTimeline({ order }) {
  const currentIdx = STATUS_INDEX[order.status] ?? 0;
  if (order.status === 'cancelled') {
    return <p className="text-ci-error text-sm">Order cancelled</p>;
  }
  return (
    <div className="mt-2">
      {STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const time = order[step.timeKey];
        return (
          <div key={step.key} className={`timeline-step ${done ? 'done' : ''}`}>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${done ? 'bg-ci-gold' : 'bg-ci-black-border'}`}>
              {done ? <Check size={11} className="text-ci-black" /> : <Circle size={11} className="text-ci-white-muted" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${done ? 'text-ci-white' : 'text-ci-white-muted'}`}>{step.label}</p>
              {time && <p className="text-xs text-ci-white-muted">{formatISTTime(time)}</p>}
              {!time && done && idx > 0 && <p className="text-xs text-ci-white-muted">—</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
