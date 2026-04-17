import React from 'react';
import Badge from '../ui/Badge';

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'info',
  picked_up: 'gold',
  in_transit: 'gold',
  delivered: 'success',
  cancelled: 'error',
};

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderStatusBadge({ status, style }) {
  return (
    <Badge
      label={STATUS_LABEL[status] || status}
      variant={STATUS_VARIANT[status] || 'default'}
      style={style}
    />
  );
}
