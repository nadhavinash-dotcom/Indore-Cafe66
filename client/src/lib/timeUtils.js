export function formatSecondsToHMS(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export function getTimerColor(secondsRemaining) {
  if (secondsRemaining > 2 * 3600) return '#C9922A'; // gold
  if (secondsRemaining > 3600) return '#FF9800';     // amber
  return '#E53935';                                  // red
}

export function formatISTDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatISTTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
}

export function formatISTDateTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function todayIST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
}

export function tomorrowIST() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

export function daysLeft(endDate) {
  if (!endDate) return 0;

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // ✅ force end of day

  const now = new Date();

  const diff = end - now;

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getISTParts(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

export function toISTDateInput(date) {
  const { year, month, day } = getISTParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDaysToISTDate(dateStr, days) {
  // 1. Guard clause: Ensure inputs exist and are valid types
  if (!dateStr || typeof dateStr !== 'string') {
    console.warn("Invalid dateStr passed to addDaysToISTDate:", dateStr);
    return ""; // Or handle the fallback appropriately for your app
  }

  // 2. Ensure days is a valid number (default to 0 if undefined/null)
  const daysToAdd = Number(days) || 0;

  // 3. Extract just the date part in case a full timestamp was passed
  const cleanDateStr = dateStr.split('T')[0]; 

  const [year, month, day] = cleanDateStr.split('-').map(Number);

  // 4. Final safety check before creating the date
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.warn("Could not parse date parts from:", dateStr);
    return ""; 
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  
  return utcDate.toISOString().slice(0, 10);
}
export function getPlanTypeLabel(planType) {
  return planType === 'monthly' ? '30 Days' : '7 Days';
}

export function getMealTypeLabel(mealType) {
  if (mealType === 'both') return 'Lunch + Dinner';
  if (mealType === 'lunch') return 'Lunch Only';
  return 'Dinner Only';
}

export async function getServerTime() {
  try {
    const response = await fetch('/api', { method: 'HEAD', cache: 'no-store' });
    const serverDate = response.headers.get('date');
    if (serverDate) return new Date(serverDate);
  } catch {
    // Fall back to client time when the server date header is unavailable.
  }
  return new Date();
}

export function getSubscriptionTiming(mealType, now = new Date()) {
  const currentDate = toISTDateInput(now);
  const nextDate = addDaysToISTDate(currentDate, 1);
  const { hour, minute } = getISTParts(now);
  const totalMinutes = hour * 60 + minute;

  let cutoffWindow = 'before-lunch-cutoff';
  let message = 'Both lunch and dinner can start today.';
  let firstServiceDate = currentDate;
  let mealStartDates = {
    lunch: mealType === 'dinner' ? null : currentDate,
    dinner: mealType === 'lunch' ? null : currentDate,
  };

  if (totalMinutes >= 16 * 60) {
    cutoffWindow = 'after-dinner-cutoff';
    message = 'All meal slots for today are closed. Your subscription will start tomorrow.';
    firstServiceDate = nextDate;
    mealStartDates = {
      lunch: mealType === 'dinner' ? null : nextDate,
      dinner: mealType === 'lunch' ? null : nextDate,
    };
  } else if (totalMinutes >= 10 * 60) {
    cutoffWindow = 'between-cutoffs';
    if (mealType === 'lunch') {
      message = 'The lunch cutoff has passed, so lunch will start tomorrow.';
      firstServiceDate = nextDate;
      mealStartDates = { lunch: nextDate, dinner: null };
    } else if (mealType === 'dinner') {
      message = 'The dinner slot is still open, so dinner can start today.';
      mealStartDates = { lunch: null, dinner: currentDate };
    } else {
      message = 'Dinner can start today, but lunch will start tomorrow.';
      mealStartDates = { lunch: nextDate, dinner: currentDate };
    }
  }

  return {
    currentDate,
    firstServiceDate,
    minSelectableDate: firstServiceDate,
    cutoffWindow,
    mealStartDates,
    message,
    hasSplitStart: mealType === 'both' && mealStartDates.lunch !== mealStartDates.dinner,
  };
}
