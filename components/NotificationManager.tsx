import React, { useEffect } from 'react';
import { Medicine } from '../types';

const NotificationManager: React.FC = () => {
  useEffect(() => {
    // Request permission immediately when app loads
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];

      // Iterate through all local storage keys to find reminders
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('reminders_')) {
            const medicineName = key.replace('reminders_', '');
            try {
                const reminders: string[] = JSON.parse(localStorage.getItem(key) || '[]');
                
                reminders.forEach(time => {
                    if (time === currentTime) {
                        const lastNotifiedKey = `lastNotified_${medicineName}_${time}`;
                        const lastNotifiedDate = localStorage.getItem(lastNotifiedKey);

                        // Only notify if we haven't notified for this specific time slot today
                        if (lastNotifiedDate !== today) {
                            // Try Service Worker notification first (better for background/PWA)
                            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                                navigator.serviceWorker.ready.then(registration => {
                                    registration.showNotification('MediScan Reminder', {
                                        body: `Time to take your ${medicineName}!`,
                                        icon: '/vite.svg',
                                        vibrate: [200, 100, 200],
                                        tag: `${medicineName}-${time}` // prevent duplicate notifications
                                    } as any);
                                });
                            } else {
                                // Fallback to standard Notification API
                                new Notification('MediScan Reminder', {
                                    body: `Time to take your ${medicineName}!`,
                                    icon: '/vite.svg'
                                });
                            }
                            
                            localStorage.setItem(lastNotifiedKey, today);
                        }
                    }
                });
            } catch (e) {
                console.error("Error parsing reminders for", medicineName);
            }
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Also check immediately on mount
    checkReminders();

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything visible
};

export default NotificationManager;