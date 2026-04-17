import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function Splash() {
  return (
    <div className="min-h-screen bg-ci-black geo-pattern flex flex-col items-center justify-center p-6 text-center">
      {/* Logo */}
      <div className="mb-12 animate-fade-in">
        <div className="w-20 h-20 rounded-full border-2 border-ci-gold flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🍱</span>
        </div>
        <h1 className="font-playfair text-5xl text-ci-gold font-bold leading-tight">
          Cafe<br />Indoori
        </h1>
        <p className="text-ci-white-muted mt-4 text-base leading-relaxed">
          Ghar jaisa khana.<br />
          <span className="text-ci-white">Aapke darwaze tak.</span>
        </p>
      </div>

      {/* Feature highlights */}
      <div className="mb-10 space-y-2 animate-fade-in">
        {[
          '🌿 Fresh, chef-curated tiffins daily',
          '⏱️ On-time delivery in Indore',
          '🥗 Veg, Non-Veg & Jain options',
        ].map((f) => (
          <p key={f} className="text-ci-white-muted text-sm">{f}</p>
        ))}
      </div>

      {/* CTAs */}
      <div className="w-full max-w-xs space-y-3 animate-slide-up">
        <Link to="/customer/plans">
          <Button size="lg" className="w-full">Apna meal plan chuniye</Button>
        </Link>
        <Link to="/customer/login" className="block text-center text-ci-gold text-sm hover:text-ci-gold-light transition-colors">
          Already subscribed? Login karein
        </Link>
      </div>
    </div>
  );
}
