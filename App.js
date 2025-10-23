import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { ConfigProvider } from "./src/context/ConfigContext";
import Toast, { BaseToast } from "react-native-toast-message";
import { Provider as PaperProvider, MD3LightTheme, Portal } from "react-native-paper";

// ✅ Custom theme (matches your green app color)
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2B8761",
    secondary: "#F9FAFB",
  },
};

// ✅ Toast style config (same as before)
const toastConfig = {
  custom_green: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#2B8761",
        backgroundColor: "#e6f5ee",
        borderRadius: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "600",
        color: "#2B8761",
      }}
      text2Style={{
        fontSize: 13,
        color: "#4A4A4A",
      }}
    />
  ),
};

export default function App() {
  return (
    // ✅ React Native Paper Provider (required for Menu, Dialog, etc.)
    <PaperProvider theme={theme}>
      <Portal.Host>
        <AuthProvider>
          <ConfigProvider>
            <RootNavigator />
            {/* Toast stays at the end */}
            <Toast config={toastConfig} position="bottom" />
          </ConfigProvider>
        </AuthProvider>
      </Portal.Host>
    </PaperProvider>
  );
}
