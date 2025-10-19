import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/api";

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/content?access=testCXE");
        if (res.data?.status === "success") {
          setConfig(res.data.data);
        } else {
          setError("Invalid config format");
        }
      } catch (err) {
        setError("Failed to fetch config");
        console.log("Config Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig(); // ✅ runs on startup / refresh
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
