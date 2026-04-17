import Badge from '../ui/Badge';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderStatusBadge({ status }) {
  return <Badge status={status}>{STATUS_LABELS[status] || status}</Badge>;
}
