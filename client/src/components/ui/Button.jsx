export default function Button({ children, variant = 'primary', size = 'md', className = '', loading, ...props }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg w-full' };
  const variants = {
    primary: 'bg-ci-gold text-ci-black hover:bg-ci-gold-light',
    secondary: 'border border-ci-gold text-ci-gold bg-transparent hover:bg-ci-gold hover:text-ci-black',
    danger: 'bg-ci-error text-white hover:opacity-90',
    ghost: 'text-ci-gold hover:bg-ci-black-soft',
    success: 'bg-ci-success text-white hover:opacity-90',
    warning: 'bg-ci-warning text-ci-black hover:opacity-90',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : null}
      {children}
    </button>
  );
}
