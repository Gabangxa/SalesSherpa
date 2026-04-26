import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";

// Register service worker in all environments — required for web push subscriptions
registerServiceWorker()
  .then((registration) => {
    if (registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    }
  })
  .catch((error) => {
    console.error('Service Worker registration failed:', error);
  });

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);
