import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";

// Register service worker for offline support
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker()
    .then((registration) => {
      if (registration) {
        console.log('Service Worker registered successfully with scope:', registration.scope);
      }
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
} else {
  console.log('Service Worker not registered in development mode');
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);
