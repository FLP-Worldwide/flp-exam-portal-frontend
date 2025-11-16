
import * as dotenv from 'dotenv';
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("Request URL:", config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
