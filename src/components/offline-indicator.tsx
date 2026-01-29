'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set initial state
    if (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined') {
      setIsOnline(navigator.onLine);
    } else {
        // Assume online if API is not available
        setIsOnline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg text-sm font-semibold flex items-center justify-center gap-2"
        >
          <WifiOff className="h-5 w-5" />
          <span>No internet 😕 Please check connection</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
