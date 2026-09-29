// Backend base URL. Production builds talk to the live server; `npm run dev` sets
// VITE_API_URL to "" (see .env.development) so requests go through the Vite proxy.
export const API_URL = import.meta.env.VITE_API_URL ?? "https://interviewos.online";
