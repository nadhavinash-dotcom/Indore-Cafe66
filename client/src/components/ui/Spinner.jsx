export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-3' };
  return (
    <div className={`${sizes[size]} border-ci-gold border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-ci-black">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-ci-white-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
