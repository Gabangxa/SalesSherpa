import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useQuery } from '@tanstack/react-query';
import { CheckInAlert } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { webSocketService, WebSocketMessageType } from '@/lib/websocketService';

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
  const { user } = useAuth();
  const [triggeredAlerts, setTriggeredAlerts] = useState<number[]>([]);
  const [checkInProgress, setCheckInProgress] = useState(false);
  
  // Get all alerts - only when user is authenticated (no more polling, just initial fetch)
  const { data: alerts = [] } = useQuery<CheckInAlert[]>({
    queryKey: ['/api/check-in-alerts'],
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 300000, // 5 minutes - since we get real-time updates via WebSocket
  });

  // Handle WebSocket alert messages from server
  const handleWebSocketAlert = useCallback((payload: any) => {
    if (payload.type !== 'check_in_alert') return;
    
    const alertId = payload.alertId;
    
    // Check if alert was already triggered recently
    if (triggeredAlerts.includes(alertId)) {
      console.log(`Alert ${alertId} already triggered recently, skipping`);
      return;
    }
    
    console.log(`Received WebSocket alert notification: ${payload.title}`);
    
    // Show notification
    showNotification({
      title: payload.title,
      description: payload.message,
      variant: 'alert',
      duration: 15000, // Show for 15 seconds
      position: 'topLeft',
    });
    
    // Mark as triggered to avoid repeated notifications
    setTriggeredAlerts(prev => [...prev, alertId]);
    
    // After 3 minutes, allow this alert to trigger again
    setTimeout(() => {
      setTriggeredAlerts(prev => {
        console.log(`Removing alert ${alertId} from triggered list`);
        return prev.filter(id => id !== alertId);
      });
    }, 3 * 60 * 1000); // 3 minutes
  }, [showNotification, triggeredAlerts]);

  // Allow manually triggering a specific alert (for testing)
  const triggerAlert = useCallback((alertId: number) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      // Get user timezone for displaying in the notification
      const userTimezone = getBrowserTimezone();
      const formattedTime = getCurrentTimeInTimezone(userTimezone).toFormat('HH:mm');
      
      console.log(`Manually triggering alert: ${alert.id} - ${alert.title} at ${formattedTime}`);
      
      showNotification({
        title: alert.title,
        description: `${alert.message} (Manual trigger at ${formattedTime})`,
        variant: 'alert',
        duration: 15000, // Show for 15 seconds - longer for test alerts
        position: 'topLeft', // Ensure it always appears on the left
      });
    }
  }, [alerts, showNotification]);

  // Listen for WebSocket alert messages - only when user is authenticated
  useEffect(() => {
    if (!user) return;
    
    // Connect to WebSocket service if not already connected
    if (webSocketService.getStatus() === 'CLOSED') {
      webSocketService.connect();
    }
    
    // Subscribe to ALERT type messages
    const unsubscribe = webSocketService.on(WebSocketMessageType.ALERT, (payload) => {
      handleWebSocketAlert(payload);
    });
    
    console.log('AlertCheckerProvider: Subscribed to WebSocket alerts');
    
    return () => {
      unsubscribe();
      console.log('AlertCheckerProvider: Unsubscribed from WebSocket alerts');
    };
  }, [handleWebSocketAlert, user]);

  // Reset triggered alerts on day change
  useEffect(() => {
    const resetTriggeredAlerts = () => {
      const now = new Date();
      
      // Reset at midnight (within 1 minute window)
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log('Midnight detected, resetting all triggered alerts');
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