import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useAuth } from "../context/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { Platform } from "react-native";
import { downloadDatabase } from "../api/api"; // 👈 import from api.js

export default function HomeScreen() {
    const { auth, loading, error, login, logout } = useAuth();

    const handleDownload = async () => {
        try {
            const token = auth?.token;
            if (!token) {
                Toast.show({ type: "error", text1: "No auth token found. Please log in again." });
                return;
            }

            const result = await downloadDatabase(token);

            if (result.success) {
                Toast.show({ type: "success", text1: "Database downloaded successfully 🎉" });

                if (Platform.OS !== "web" && (await Sharing.isAvailableAsync())) {
                    await Sharing.shareAsync(result.fileUri);
                } else {
                    alert("File saved to: " + result.fileUri);
                }
            }
        } catch (error) {
            console.error("DB download failed:", error);
            Toast.show({ type: "error", text1: "Failed to download database" });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome {auth.user} 🎉</Text>
            <Button title="Logout" onPress={() => logout()} />
            <View style={{ marginTop: 20 }}>
                <Button title="Download DB" onPress={handleDownload} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 16, },
    title: { fontSize: 22, marginBottom: 50, marginTop: -80, textAlign: "center", fontWeight: "bold", },
});
