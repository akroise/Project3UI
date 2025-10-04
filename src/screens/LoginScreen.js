import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
    const { auth, loading, error, login, logout } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text>Logging in...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!auth.isLoggedIn ? (
                <>
                    <Text style={styles.title}>Login</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <Button title="Login" onPress={() => login(username, password)} />

                    {error && <Text style={styles.error}>{error}</Text>}
                </>
            ) : (
                <>
                    <Text style={styles.title}>Welcome {auth.user} 🎉</Text>
                    <Button title="Logout" onPress={() => logout()} />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 20 },
    title: { fontSize: 22, marginBottom: 20, textAlign: "center" },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
    },
    error: { color: "red", marginTop: 10, textAlign: "center" },
});
