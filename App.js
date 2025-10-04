import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <LoginScreen />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});