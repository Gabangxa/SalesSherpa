import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '@/components/ui/notification';
import { v4 as uuidv4 } from 'uuid';

type NotificationType = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'alert' | 'destructive';
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
  duration?: number;
};

type NotificationContextType = {
  notifications: NotificationType[];
  showNotification: (notification: Omit<NotificationType, 'id'>) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const showNotification = useCallback((notification: Omit<NotificationType, 'id'>) => {
    const id = uuidv4();
    setNotifications((prev) => [...prev, { ...notification, id }]);
    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        hideNotification,
        clearAllNotifications,
      }}
    >
      {children}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          title={notification.title}
          description={notification.description}
          variant={notification.variant}
          position={notification.position}
          duration={notification.duration}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};