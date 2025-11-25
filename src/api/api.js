import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import * as Sharing from "expo-sharing";

// src/config/api.js
const LOCAL_API = "http://127.0.0.1:8000";
const PROD_API = "https://project3be.onrender.com";

export const BASE_URL =
  process.env.EXPO_PUBLIC_ENV === "production" ? PROD_API : LOCAL_API;

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


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Session expired. Logging out...");
      // You can clear AsyncStorage or redirect to login here
    }
    return Promise.reject(error);
  }
);

// ✅ Download DB function
// export const downloadDatabase = async (token) => {
//   try {
//     const url = `${BASE_URL}/download-db`;

//     // ✅ Handle Web platform separately
//     if (Platform.OS === "web") {
//       const response = await axios.get(url, {
//         headers: { Authorization: `Bearer ${token}` },
//         responseType: "blob",
//       });

//       // Create a download link
//       const blobUrl = window.URL.createObjectURL(response.data);
//       const link = document.createElement("a");
//       link.href = blobUrl;
//       link.download = "expense_tracker.db";
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       return { success: true, fileUri: blobUrl };
//     }

//     // ✅ For Android/iOS (Expo Go)
//     const fileUri = FileSystem.documentDirectory + "expense_tracker.db";
//     const result = await FileSystem.downloadAsync(url, fileUri, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     // Optional sharing
//     if (await Sharing.isAvailableAsync()) {
//       await Sharing.shareAsync(result.uri);
//     }

//     return { success: true, fileUri: result.uri };
//   } catch (error) {
//     console.error("❌ Download DB error:", error);
//     throw error;
//   }
// };

// ✅ Download DB function (with datetime filename)
export const downloadDatabase = async (token) => {
  try {
    const url = `${BASE_URL}/download-db`;

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[:]/g, "-")
      .replace(/\..+/, ""); // remove milliseconds
    const fileName = `expense_tracker_${timestamp}.db`;

    // -------------------------------------------------
    // 🌐 WEB DOWNLOAD
    // -------------------------------------------------
    if (Platform.OS === "web") {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName; // ⬅️ timestamped name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, fileUri: blobUrl };
    }

    // -------------------------------------------------
    // 📱 ANDROID / iOS (Expo Go)
    // -------------------------------------------------
    const fileUri = FileSystem.documentDirectory + fileName;

    const result = await FileSystem.downloadAsync(url, fileUri, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Share if available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri);
    }

    return { success: true, fileUri: result.uri };
  } catch (error) {
    console.error("❌ Download DB error:", error);
    throw error;
  }
};

