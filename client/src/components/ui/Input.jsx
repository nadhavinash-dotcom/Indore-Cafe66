export default function Input({ label, error, prefix, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-ci-gold text-sm font-medium mb-1.5">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ci-white-muted text-sm">{prefix}</span>
        )}
        <input
          className={`w-full bg-ci-black border ${error ? 'border-ci-error' : 'border-ci-black-border'} text-ci-white placeholder-ci-white-muted px-4 py-3 rounded-xl focus:border-ci-gold transition-colors ${prefix ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-ci-error text-xs">{error}</p>}
    </div>
  );
}
