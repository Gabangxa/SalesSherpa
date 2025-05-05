import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useQuery } from '@tanstack/react-query';
import { CheckInAlert } from '@shared/schema';
import { 
  isTimeWithinMargin, 
  getBrowserTimezone, 
  getCurrentTimeInTimezone, 
  convertTimeZone, 
  formatTimeString,
  parseTimeString
} from '@/lib/luxonTimezoneUtils';

// Day of week mapping
const dayMapping: { [key: number]: string } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

type AlertCheckerContextType = {
  triggerAlert: (alertId: number) => void;
};

const AlertCheckerContext = createContext<AlertCheckerContextType | null>(null);

export const AlertCheckerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showNotification } = useNotifications();
  const [triggeredAlerts, setTriggeredAlerts] = useState<number[]>([]);
  const [checkInProgress, setCheckInProgress] = useState(false);
  
  // Get all alerts
  const { data: alerts = [] } = useQuery<CheckInAlert[]>({
    queryKey: ['/api/check-in-alerts'],
    refetchInterval: 60000, // Refetch every minute
    staleTime: 55000,
  });

  // Check alerts and show notifications if needed
  const checkAlerts = useCallback(() => {
    if (checkInProgress || !alerts || alerts.length === 0) return;

    setCheckInProgress(true);
    
    try {
      // Get current time and day using Luxon
      const now = new Date();
      const currentDay = dayMapping[now.getDay()];
      const userTimezone = getBrowserTimezone();
      
      // Get the current time in the user's timezone in HH:MM format using Luxon
      const currentDateTime = getCurrentTimeInTimezone(userTimezone);
      const currentTime = formatTimeString(currentDateTime);
      
      console.log(`Current check time: ${currentTime}, Day: ${currentDay}, User timezone: ${userTimezone}`);
      console.log(`Current alerts to check: ${alerts.length}`);
      console.log(`Already triggered alerts: ${triggeredAlerts.join(', ') || 'none'}`);
      console.log('---------------------');
      
      alerts.forEach(alert => {
        console.log(`Checking alert: ${alert.id} - ${alert.title}`);
        console.log(`  Status: ${alert.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`  Time: ${alert.time} (Timezone: ${alert.timezone || 'not set'})`);
        console.log(`  Days: ${alert.days.join(', ')}`);
        
        // Skip if not enabled or already triggered
        if (!alert.enabled) {
          console.log('  Skipping: Alert not enabled');
          return;
        }
        
        if (triggeredAlerts.includes(alert.id)) {
          console.log('  Skipping: Alert already triggered recently');
          return;
        }
        
        // Skip if the current day is not in the alert's days
        if (!alert.days.includes(currentDay)) {
          console.log(`  Skipping: Current day (${currentDay}) not in alert days`);
          return;
        }
        
        // Convert alert time to user's timezone if needed using Luxon
        const alertTimeInUserTimezone = alert.timezone !== userTimezone 
          ? convertTimeZone(alert.time, alert.timezone, userTimezone)
          : alert.time;
        
        console.log(`  Alert time in user timezone: ${alertTimeInUserTimezone}`);
        
        // Check if it's time to trigger the alert using Luxon
        if (isTimeWithinMargin(alertTimeInUserTimezone, userTimezone, 2)) {
          console.log('  ✓ TIME MATCH FOUND - TRIGGERING ALERT');
          
          // Show notification
          showNotification({
            title: alert.title,
            description: alert.message,
            variant: 'alert',
            duration: 15000, // Show for 15 seconds
            position: 'topLeft', // Ensure it always appears on the left
          });
          
          // Mark as triggered to avoid repeated notifications
          setTriggeredAlerts(prev => [...prev, alert.id]);
          console.log(`  Alert ${alert.id} marked as triggered`);
          
          // After 3 minutes, allow this alert to trigger again
          const resetTimeMs = 3 * 60 * 1000; // 3 minutes
          console.log(`  Will reset triggered status in ${resetTimeMs/1000} seconds`);
          
          setTimeout(() => {
            setTriggeredAlerts(prev => {
              console.log(`Removing alert ${alert.id} from triggered list`);
              return prev.filter(id => id !== alert.id);
            });
          }, resetTimeMs);
        } else {
          console.log('  ✗ Time does not match current time');
        }
      });
    } finally {
      setCheckInProgress(false);
    }
  }, [alerts, checkInProgress, showNotification, triggeredAlerts]);

  // Allow manually triggering a specific alert (for testing)
  const triggerAlert = useCallback((alertId: number) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      console.log(`Manually triggering alert: ${alert.id} - ${alert.title}`);
      showNotification({
        title: alert.title,
        description: alert.message,
        variant: 'alert',
        duration: 15000, // Show for 15 seconds - longer for test alerts
        position: 'topLeft', // Ensure it always appears on the left
      });
    }
  }, [alerts, showNotification]);

  // Check alerts every minute
  useEffect(() => {
    // Check immediately on mount
    checkAlerts();
    
    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkAlerts();
    }, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [checkAlerts]);

  // Reset triggered alerts on day change
  useEffect(() => {
    const resetTriggeredAlerts = () => {
      const now = new Date();
      // Reset at midnight
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setTriggeredAlerts([]);
      }
    };
    
    const intervalId = setInterval(resetTriggeredAlerts, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <AlertCheckerContext.Provider value={{ triggerAlert }}>
      {children}
    </AlertCheckerContext.Provider>
  );
};

export const useAlertChecker = () => {
  const context = useContext(AlertCheckerContext);
  
  if (!context) {
    throw new Error('useAlertChecker must be used within a AlertCheckerProvider');
  }
  
  return context;
};