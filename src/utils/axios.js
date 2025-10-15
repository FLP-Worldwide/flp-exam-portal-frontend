// utils/axios.js
import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(async (config) => {
   
    const session = await getSession(); // ✅ get current NextAuth session
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    console.log('Request URL:',session);
    return config;
});

export default api;
