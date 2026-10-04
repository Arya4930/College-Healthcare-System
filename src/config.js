export const APIBASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV
  ? "http://localhost:4000"
  : "https://college-healthcare-system.onrender.com");
