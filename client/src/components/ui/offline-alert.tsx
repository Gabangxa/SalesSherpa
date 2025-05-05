import React, { useState, useEffect } from 'react';
import { isOnline, addNetworkListeners } from '@/lib/serviceWorkerRegistration';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * OfflineAlert component
 * Displays an alert when the user is offline
 */
export function OfflineAlert() {
  const [isOffline, setIsOffline] = useState<boolean>(!isOnline());
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    // Handle online state
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      // Hide the reconnected message after 5 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
    };

    // Handle offline state
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    // Add event listeners
    const cleanup = addNetworkListeners(handleOnline, handleOffline);
    
    // Initial check
    setIsOffline(!isOnline());

    // Cleanup event listeners on unmount
    return cleanup;
  }, []);

  // Don't render anything if online and not showing reconnected message
  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      {isOffline ? (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-bottom-5">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            Some features may be unavailable until your connection is restored.
          </AlertDescription>
        </Alert>
      ) : showReconnected ? (
        <Alert variant="default" className="bg-green-50 border-green-200 animate-in fade-in slide-in-from-bottom-5">
          <Wifi className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">You're back online</AlertTitle>
          <AlertDescription className="text-green-600">
            Your connection has been restored.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

/**
 * OfflineBanner component
 * Displays a banner at the top of the page when offline
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(!isOnline());

  useEffect(() => {
    // Handle online state
    const handleOnline = () => setIsOffline(false);

    // Handle offline state
    const handleOffline = () => setIsOffline(true);

    // Add event listeners
    const cleanup = addNetworkListeners(handleOnline, handleOffline);
    
    // Initial check
    setIsOffline(!isOnline());

    // Cleanup event listeners on unmount
    return cleanup;
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>You are currently offline. Some features may be limited.</span>
      </div>
    </div>
  );
}

export default OfflineAlert;