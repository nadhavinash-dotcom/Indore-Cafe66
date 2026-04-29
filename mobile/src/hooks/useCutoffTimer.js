import { useEffect, useRef } from 'react';
import api from '../lib/api';
import useTimerStore from '../store/timerStore';

export default function useCutoffTimer() {
  const setMealTimer = useTimerStore((s) => s.setMealTimer);
  const tick = useTimerStore((s) => s.tick);

  const tickIntervals = useRef({});
  const syncInterval = useRef(null);

  async function sync() {
    try {
      const { data } = await api.get('/booking/availability');

      const next = data.nextCutoff;

      if (!next) return;

      const meal = next.meal; // "lunch" or "dinner"

      // ✅ set only active meal timer
      setMealTimer(meal, {
        secondsRemaining: next.secondsRemaining ?? 0,
        isOpen: next.isOpen ?? false,
        nextOpenAt: null,
      });

      // ❗ clear existing intervals
      Object.values(tickIntervals.current).forEach(clearInterval);

      tickIntervals.current = {};

      // ✅ start ticking only active meal
      if (next.isOpen && next.secondsRemaining > 0) {
        tickIntervals.current[meal] = setInterval(() => {
          tick(meal);
        }, 1000);
      }
    } catch (err) {
      console.log('[useCutoffTimer] sync error:', err.message);
    }
  }

  useEffect(() => {
    sync();

    // resync every 60s
    syncInterval.current = setInterval(sync, 60000);

    return () => {
      clearInterval(syncInterval.current);
      Object.values(tickIntervals.current).forEach(clearInterval);
    };
  }, []);
}

//change this and give import { useEffect, useRef } from 'react';
// import api from '../lib/api';
// import useTimerStore from '../store/timerStore';

// export default function useCutoffTimer() {
//   const setMealTimer = useTimerStore((s) => s.setMealTimer);
//   const tick = useTimerStore((s) => s.tick);
//   const tickIntervals = useRef({});
//   const syncInterval = useRef(null);

//   async function sync() {
//     try {
//       const { data } = await api.get('/booking/availability');
//       const { lunch, dinner } = data;

//       ['lunch', 'dinner'].forEach((meal) => {
//         const info = meal === 'lunch' ? lunch : dinner;
//         if (!info) return;
//         setMealTimer(meal, {
//           secondsRemaining: info.secondsRemaining ?? 0,
//           isOpen: info.isOpen ?? false,
//           nextOpenAt: info.nextOpenAt ?? null,
//         });

//         if (tickIntervals.current[meal]) {
//           clearInterval(tickIntervals.current[meal]);
//         }
//         if (info.isOpen && info.secondsRemaining > 0) {
//           tickIntervals.current[meal] = setInterval(() => {
//             tick(meal);
//           }, 1000);
//         }
//       });
//     } catch (err) {
//       console.log('[useCutoffTimer] sync error:', err.message);
//     }
//   }

//   useEffect(() => {
//     sync();
//     syncInterval.current = setInterval(sync, 60000);

//     return () => {
//       clearInterval(syncInterval.current);
//       Object.values(tickIntervals.current).forEach(clearInterval);
//     };
//   }, []);
// }
