import { useEffect, useRef } from 'react';
import api from '../lib/api';
import useTimerStore from '../store/timerStore';

export default function useCutoffTimer() {
  const { setTimerData, decrementTimer } = useTimerStore();
  const tickRef = useRef(null);
  const syncRef = useRef(null);

  async function syncFromServer() {
    try {
      const res = await api.get('/booking/availability');
      setTimerData(res.data);
    } catch (e) {
      // fail silently — local countdown continues
    }
  }

  function startTick() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      decrementTimer();
    }, 1000);
  }

  useEffect(() => {
    syncFromServer().then(startTick);

    // Re-sync every 60 seconds to correct drift
    syncRef.current = setInterval(() => {
      syncFromServer().then(startTick);
    }, 60 * 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, []);

  return useTimerStore();
}
