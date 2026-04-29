export const COLORS = {
  black: '#0D0D0D',
  blackSoft: '#1A1A1A',
  blackBorder: '#2A2A2A',
  gold: '#C9922A',
  goldLight: '#E8B86D',
  goldMuted: '#7A5520',
  white: '#F5F0E8',
  whiteMuted: '#A89880',
  success: '#4CAF50',
  error: '#E53935',
  warning: '#FF9800',
  blue: '#2196F3',
};

export const FONTS = {
  heading: 'serif',  // system serif — Playfair Display requires expo-font loading
  body: 'System',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  borderRadius: 12,
  cardRadius: 12,
};

export const STATUS_COLORS = {
  pending: COLORS.whiteMuted,
  conformed: COLORS.gold,
  picked_up: COLORS.warning,
  in_transit: COLORS.blue,
  delivered: COLORS.success,
  cancelled: COLORS.error,
  active: COLORS.success,
  paused: COLORS.warning,
  expired: COLORS.whiteMuted,
  open: COLORS.warning,
  in_progress: COLORS.blue,
  resolved: COLORS.success,
};

export const MEAL_PREF_COLORS = {
  veg: COLORS.success,
  nonveg: COLORS.error,
  jain: COLORS.gold,
  special: COLORS.warning,
};
