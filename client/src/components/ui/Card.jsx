export default function Card({ children, className = '', goldBorder = false, goldLeft = false, onClick }) {
  return (
    <div
      className={`bg-ci-black-soft border rounded-card p-4 ${goldBorder ? 'border-ci-gold' : 'border-ci-black-border'} ${goldLeft ? 'border-l-4 border-l-ci-gold' : ''} ${onClick ? 'cursor-pointer hover:border-ci-gold transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
