const IS_PRODUCTION = import.meta.env.PROD;

export const API_URL = IS_PRODUCTION
  ? "https://team-calendar.onrender.com/api"
  : "http://localhost:3000/api";

// export const API_URL = "https://team-calendar.onrender.com/api";
