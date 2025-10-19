import React from "react";
import { StyleSheet } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { ConfigProvider, useConfig } from "./src/context/ConfigContext";
import LoginScreen from "./src/screens/LoginScreen";

function AppContent() {
  const { config, loading, error } = useConfig();

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Logging in...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Text>404 Page Not Found</Text>
      </View>
    );
  }

  // ✅ Once config is fetched, render UI
  return <LoginScreen />;

}

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <LoginScreen />
      </ConfigProvider>
    </AuthProvider>
  );
}

// const styles = StyleSheet.create({
//   container: { flex: 1 },
// });