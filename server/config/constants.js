const CUTOFF_HOURS = {
  lunch: { hour: 9, minute: 0 },
  dinner: { hour: 16, minute: 0 },
};

const PLAN_PRICES = {
  monthly_both: 480000,   // ₹4800 in paise
  monthly_single: 288000, // ₹2880 in paise (60%)
  trial_both: 140000,     // ₹1400 in paise
  trial_single: 84000,    // ₹840 in paise (60%)
};

const PLAN_DURATIONS = {
  monthly: 30,
  trial: 7,
};

const DELIVERY_AREAS = [
  "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", 
  "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", 
  "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", 
  "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", 
  "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", 
  "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", 
  "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", 
  "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
];

const MEAL_PREFERENCES = ['veg','jain', 'special'];

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Picked_up', 'In_transit', 'Delivered', 'Cancelled'];

const COUPONS = {
  INDOORI10: { type: 'percent', value: 10, description: '10% off' },
  TRIAL50: { type: 'flat', value: 5000, description: '₹50 off' }, // paise
};

const DELIVERY_WINDOWS = {
  lunch: '12 PM – 2 PM',
  dinner: '7 PM – 9 PM',
};

module.exports = {
  CUTOFF_HOURS,
  PLAN_PRICES,
  PLAN_DURATIONS,
  DELIVERY_AREAS,
  MEAL_PREFERENCES,
  ORDER_STATUSES,
  COUPONS,
  DELIVERY_WINDOWS,
};
