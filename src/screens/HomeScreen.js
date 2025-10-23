import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen() {
    const { auth, loading, error, login, logout } = useAuth();
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome {auth.user} 🎉</Text>
            <Button title="Logout" onPress={() => logout()} />
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16, },
  title: { fontSize: 22, marginBottom: 50, marginTop: -80, textAlign: "center", fontWeight: "bold", },
});
