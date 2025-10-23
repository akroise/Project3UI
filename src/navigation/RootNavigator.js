import React from "react";
import { useAuth } from "../context/AuthContext";
import { ConfigProvider, useConfig } from "../context/ConfigContext";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "./AuthStack";
import AppTabs from "./AppTabs";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ToastAndroid } from "react-native";
import { Platform } from "react-native";


const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const { auth, loading: authLoading } = useAuth();
    const { config, loading: configLoading, error } = useConfig();

    if (authLoading || configLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text>Error loading configuration: {error}</Text>
            </View>
        );
    }


    return (
        <NavigationContainer
            linking={Platform.OS === "web" ? { enabled: false } : undefined}
            fallback={<Text>Loading...</Text>}>
            {auth?.isLoggedIn ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 16, },
});