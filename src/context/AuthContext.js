import React, { createContext, useState, useContext, useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ isLoggedIn: false, user: null, token: null });
    const [loading, setLoading] = useState(true); // true at startup
    const [error, setError] = useState(null);

    // ✅ Restore session on app startup
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const token = await AsyncStorage.getItem("session_token");
                if (token) {
                    // Optional: Call BE to validate session
                    const res = await api.post("/validate-session", {}, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    console.log("validate-session log: ",res)

                    if (res.data.status === "success") {
                        setAuth({
                            isLoggedIn: true,
                            user: res.data.user,
                            token: token,
                            user_id: res.data.user_id
                        });
                    } else {
                        await AsyncStorage.removeItem("session_token");
                        setAuth({ isLoggedIn: false, user: null, token: null, user_id: null });
                    }
                } else {
                    setAuth({ isLoggedIn: false, user: null, token: null, user_id: null });
                }
            } catch (err) {
                await AsyncStorage.removeItem("session_token");
                setAuth({ isLoggedIn: false, user: null, token: null, user_id: null });
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post(
                "/login",
                { username, password }, // ✅ JSON body
                { headers: { "Content-Type": "application/json" } } // ✅ enforce header
            );

            console.log("Login res: ",res)

            if (res.data.status === "success" && res.status === 200) {
                const sessionToken = res.data.session_token;
                setAuth({
                    isLoggedIn: true,
                    user: res.data.user || username,
                    token: sessionToken || "dummy-token",
                    user_id: res.data.user_id
                });
                // Persist in AsyncStorage
                await AsyncStorage.setItem("session_token", sessionToken);

                // Alert.alert("Login Successful");
            }
            else {
                setError("Invalid credentials");
                // Alert.alert("Login Failed", res.data.message || "Invalid credentials");
            }

        } catch (err) {
            setError("Login failed - " + err.response?.data?.message);
            // Alert.alert("Login Failed", err.response?.data?.message || "Try again");
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            const token = await AsyncStorage.getItem("session_token");
            if (token) {
                await api.post(
                    "/logout",
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
        } catch (err) {
            console.log("Logout error:", err.message);
        } finally {
            await AsyncStorage.removeItem("session_token");
            setAuth({ isLoggedIn: false, user: null, token: null });
        }
    };

    return (
        <AuthContext.Provider value={{ auth, loading, error, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);