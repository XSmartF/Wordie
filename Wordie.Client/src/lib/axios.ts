import axios from "axios";

const resolveBaseUrl = () => {
  const fallback = "http://localhost:5000/api";
  const configured = import.meta.env.VITE_API_URL ?? fallback;

  if (typeof window === "undefined") {
    return configured;
  }

  try {
    const url = new URL(configured, window.location.origin);
    const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
    const shouldUpgradeToHttps = url.protocol === "http:" && !isLocalHost;

    if (shouldUpgradeToHttps) {
      url.protocol = "https:";
      return url.toString();
    }

    return url.toString();
  } catch {
    return configured;
  }
};

export const axiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: false,
});
