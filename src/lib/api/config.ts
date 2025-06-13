export const API_URL = import.meta.env.VITE_API_URL;

// Extend the Window interface to include VITE_API_URL
declare global {
  interface Window {
    VITE_API_URL: string;
  }
}

// Make API_URL available to the app context
if (typeof window !== 'undefined') {
  window.VITE_API_URL = API_URL;
}