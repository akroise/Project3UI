import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://192.168.10.220:8000"; // change this once, works everywhere

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

// ✅ Optional: Interceptor for auth tokens
api.interceptors.request.use(
  async (config) => {
    // If you store token in AsyncStorage later, attach it here
    const token = await AsyncStorage.getItem("session_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);