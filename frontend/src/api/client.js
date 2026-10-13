import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A login lasts 12 hours. After that every request answers 401, but the site would still look
// "logged in" and show confusing errors. Clear the old session and send the visitor to the login
// page, then bring them back to the page they were on.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) {
        sessionStorage.setItem("returnTo", window.location.pathname);
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default client;
