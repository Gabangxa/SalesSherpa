import { Workbox, messageSW } from 'workbox-window';

/**
 * Service Worker utilities for offline support
 */

// Check if service workers are supported
const isServiceWorkerSupported = 'serviceWorker' in navigator;

// Keep track of the active service worker
let swRegistration: ServiceWorkerRegistration | null = null;
let workbox: Workbox | null = null;

/**
 * Register the service worker
 * 
 * @returns Promise resolving to the ServiceWorkerRegistration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported) {
    console.warn('Service workers are not supported by this browser');
    return null;
  }

  try {
    // Create Workbox instance
    workbox = new Workbox('/serviceWorker.js');
    
    // Handle waiting service worker (update available)
    workbox.addEventListener('waiting', (event) => {
      const { sw, wasWaitingBeforeRegister } = event;
      
      if (wasWaitingBeforeRegister) {
        // There's an update ready and waiting
        notifyUpdateAvailable();
      }
    });
    
    // Register the service worker
    swRegistration = await workbox.register();
    console.log('Service Worker registered successfully', swRegistration);
    
    return swRegistration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Check if the application is online
 * 
 * @returns True if the application is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Update the service worker
 * 
 * @returns Promise resolving when the update is complete
 */
export async function updateServiceWorker(): Promise<void> {
  if (!swRegistration) {
    console.warn('No service worker registration available');
    return;
  }
  
  try {
    await swRegistration.update();
    console.log('Service Worker update check complete');
  } catch (error) {
    console.error('Service Worker update failed:', error);
  }
}

/**
 * Notify the user about an available update
 */
function notifyUpdateAvailable(): void {
  // You can implement this with your UI library
  console.log('Service Worker update available');
  
  // Create an event for the application to handle
  window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
}

/**
 * Apply the waiting service worker update
 */
export function applyUpdate(): void {
  if (!workbox) {
    console.warn('No Workbox instance available');
    return;
  }
  
  workbox.addEventListener('controlling', () => {
    // The service worker is now controlling
    window.location.reload();
  });
  
  // Send message to service worker to skip waiting
  if (workbox.messageSkipWaiting) {
    workbox.messageSkipWaiting();
  }
}

/**
 * Send a message to the active service worker
 * 
 * @param message Message to send
 * @returns Promise that resolves with the response
 */
export async function sendMessageToSW(message: any): Promise<any> {
  if (!swRegistration || !swRegistration.active) {
    console.warn('No active service worker available');
    return null;
  }
  
  try {
    return await messageSW(swRegistration.active, message);
  } catch (error) {
    console.error('Failed to send message to Service Worker:', error);
    return null;
  }
}

/**
 * Add event listeners for online/offline events
 * 
 * @param onOnline Callback for online event
 * @param onOffline Callback for offline event
 */
export function addNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Check if the app was installed as a PWA
 * 
 * @returns True if the app is in standalone or fullscreen mode
 */
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.matchMedia('(display-mode: fullscreen)').matches || 
         (window.navigator as any).standalone === true;
}

export default {
  registerServiceWorker,
  isOnline,
  updateServiceWorker,
  applyUpdate,
  sendMessageToSW,
  addNetworkListeners,
  isInstalledPWA,
  isSupported: isServiceWorkerSupported
};