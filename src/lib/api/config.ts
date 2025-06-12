const IS_PRODUCTION = import.meta.env.PROD;

// Update this URL with your actual Render deployment URL
export const API_URL = IS_PRODUCTION
  ? "https://team-calendar.onrender.com/api"
  : "http://localhost:3000/api";

// Make API_URL available to the app context
if (typeof window !== 'undefined') {
  window.VITE_API_URL = API_URL;
}