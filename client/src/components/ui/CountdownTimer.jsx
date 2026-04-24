import { formatSecondsToHMS, getTimerColor } from '../../lib/timeUtils';

function DigitBox({ value, label, color }) {
  return (
    <div className="digit-box" style={{ borderColor: color }}>
      <span className="digit" style={{ color }}>{value}</span>
      <span className="label">{label}</span>
    </div>
  );
}

export default function CountdownTimer({ secondsRemaining, pulse = false }) {
  const color = getTimerColor(secondsRemaining);
  const hms = formatSecondsToHMS(secondsRemaining);
  const [h, m, s] = hms.split(':');

  return (
    <div className={`flex items-center gap-1.5 ${pulse ? 'animate-pulse' : ''}`}>
      <DigitBox value={h} label="hour" color={color} />
      <span className="text-2xl font-bold" style={{ color }}>:</span>
      <DigitBox value={m} label="Minute" color={color} />
      <span className="text-2xl font-bold" style={{ color }}>:</span>
      <DigitBox value={s} label="Seconds" color={color} />
    </div>
  );
}
