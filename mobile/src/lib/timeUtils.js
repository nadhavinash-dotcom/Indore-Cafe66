const IST_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatIST(isoString) {
  if (!isoString) return '';
  try {
    return IST_FORMATTER.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatISTDate(isoString) {
  if (!isoString) return '';
  try {
    return DATE_FORMATTER.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatISTTime(isoString) {
  if (!isoString) return '';
  try {
    return TIME_FORMATTER.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatCountdown(seconds) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return isoString;
  }
}
