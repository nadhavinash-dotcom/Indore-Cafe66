import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function Splash() {
  return (
    <div className="min-h-screen bg-ci-black geo-pattern flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-12 animate-fade-in">
        <div className="w-20 h-20 rounded-full border-2 border-ci-gold flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🍱</span>
        </div>
        <h1 className="font-playfair text-5xl text-ci-gold font-bold leading-tight">
          Cafe<br />Indoor
        </h1>
        <p className="text-ci-white-muted mt-4 text-base leading-relaxed">
          Homemade-style meals.<br />
          <span className="text-ci-white">Delivered to your doorstep.</span>
        </p>
      </div>

      <div className="mb-10 space-y-2 animate-fade-in">
        {[
          'Fresh, chef-curated meals every day',
          'On-time delivery across Indore',
          'Veg, Non-Veg, and Jain options',
        ].map((feature) => (
          <p key={feature} className="text-ci-white-muted text-sm">{feature}</p>
        ))}
      </div>

      <div className="w-full max-w-xs space-y-3 animate-slide-up">
        <Link to="/customer/plans">
          <Button size="lg" className="w-full">Choose Your Meal Plan</Button>
        </Link>
        <Link to="/customer/login" className="block text-center text-ci-gold text-sm hover:text-ci-gold-light transition-colors">
          Already subscribed? Log in
        </Link>
      </div>
    </div>
  );
}
