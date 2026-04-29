const variants = {
  default: 'bg-ci-black-border text-ci-white-muted',
  gold: 'bg-ci-gold text-ci-black',
  success: 'bg-ci-success/20 text-ci-success border border-ci-success/30',
  error: 'bg-ci-error/20 text-ci-error border border-ci-error/30',
  warning: 'bg-ci-warning/20 text-ci-warning border border-ci-warning/30',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

const statusVariants = {
  pending: 'default',
  conformed: 'gold',
  picked_up: 'warning',
  in_transit: 'blue',
  delivered: 'success',
  cancelled: 'error',
  active: 'success',
  paused: 'warning',
  expired: 'default',
  open: 'warning',
  in_progress: 'blue',
  resolved: 'success',
  closed: 'default',
};

export default function Badge({ children, variant, status, className = '' }) {
  const v = variant || (status ? statusVariants[status] : 'default') || 'default';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[v]} ${className}`}>
      {children}
    </span>
  );
}
