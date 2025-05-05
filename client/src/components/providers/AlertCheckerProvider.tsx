import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useQuery } from '@tanstack/react-query';
import { CheckInAlert } from '@shared/schema';
import { formatTimeWithTimezone, getUserTimezone, convertTimeToTimezone } from '@/lib/timezoneUtils';

// Function to check if time is within a window (current time +/- margin in minutes)
const isTimeInWindow = (targetTime: string, currentTime: string, marginMinutes = 1): boolean => {
  const [targetHour, targetMinute] = targetTime.split(':').map(Number);
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  
  // Convert both times to minutes since midnight
  const targetMinutes = targetHour * 60 + targetMinute;
  const currentMinutes = currentHour * 60 + currentMinute;
  
  // Check if the current time is within the margin of the target time
  return Math.abs(targetMinutes - currentMinutes) <= marginMinutes;
};

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
      // Get current time and day
      const now = new Date();
      const currentDay = dayMapping[now.getDay()];
      const userTimezone = getUserTimezone();
      
      // Format current time as HH:MM
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
      
      alerts.forEach(alert => {
        // Skip if not enabled or already triggered
        if (!alert.enabled || triggeredAlerts.includes(alert.id)) return;
        
        // Skip if the current day is not in the alert's days
        if (!alert.days.includes(currentDay)) return;
        
        // Convert alert time to user's timezone if needed
        const alertTimeInUserTimezone = alert.timezone !== userTimezone 
          ? convertTimeToTimezone(alert.time, alert.timezone, userTimezone)
          : alert.time;
        
        // Check if it's time to trigger the alert
        if (isTimeInWindow(alertTimeInUserTimezone, currentTime)) {
          // Show notification
          showNotification({
            title: alert.title,
            description: alert.message,
            variant: 'alert',
            duration: 10000, // Show for 10 seconds
          });
          
          // Mark as triggered to avoid repeated notifications
          setTriggeredAlerts(prev => [...prev, alert.id]);
          
          // After 2 minutes, allow this alert to trigger again (to handle system sleep/hibernate)
          setTimeout(() => {
            setTriggeredAlerts(prev => prev.filter(id => id !== alert.id));
          }, 120000);
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
      showNotification({
        title: alert.title,
        description: alert.message,
        variant: 'alert',
        duration: 10000,
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