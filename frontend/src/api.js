// Central API base URL config.
// In development (local), VITE_API_URL is empty so relative paths work via Vite proxy.
// In production (Vercel), VITE_API_URL is set to the Render backend URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;
