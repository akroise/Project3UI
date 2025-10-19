import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ToastAndroid } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { Button, TouchableRipple } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";



export default function LoginScreen() {
  const { auth, loading, error, login, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ username: "", password: "" });
  const { config } = useConfig();
  const loginConfig = config?.loginPage;

  const handleLogin = () => {
    let tempErrors = { username: "", password: "" };

    if (!username.trim()) tempErrors.username = loginConfig.input1.mandatoryError;
    if (!password.trim()) tempErrors.password = loginConfig.input2.mandatoryError;

    setErrors(tempErrors);

    // ✅ Only call login if both inputs are valid
    if (!tempErrors.username && !tempErrors.password) {
      login(username, password);
    }
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Logging in...</Text>
      </View>
    );
  }

  if (!loginConfig)
    return (
      <View style={styles.container}>
        <ActivityIndicator
          animating={true}
          size="large"
        />
      </View>
    );

  return (
    <View style={styles.container}>
      {!auth.isLoggedIn ? (
        <>
          <Text style={styles.title}>{loginConfig.header}</Text>
          <View>
            <Text style={styles.text}>{loginConfig.input1.text}</Text>
            <TextInput
              style={[styles.input, errors.username ? styles.inputError : null]}
              placeholder={loginConfig.input1.hint}
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={(text) => { setUsername(text); if (errors.username) setErrors({ ...errors, username: "" }); }}
            />
            {errors.username && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={18} color="red" />
                <Text style={styles.errorText}>{errors.username}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.text}>{loginConfig.input2.text}</Text>
            <TextInput
              style={[
                styles.input,
                errors.password || error ? styles.inputError : null
              ]}
              placeholder={loginConfig.input2.hint}
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {(!!error || !!errors.password) && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={18} color="red" />
                <Text style={styles.errorText}>{loginConfig.input2.mandatoryError}</Text>
              </View>
            )}

            {String(loginConfig?.forgetPassword?.visibility || '').toLowerCase() === 'true' && (
              <TouchableRipple onPress={() => console.log("Forgot Password pressed")} borderless>
                <Text style={styles.forgetPasswordText}>
                  {loginConfig.forgetPassword.text}
                </Text>
              </TouchableRipple>
            )}
          </View>
          <Button mode="contained" style={styles.baseButton}
            labelStyle={styles.label}
            contentStyle={styles.content} onPress={() => handleLogin()} >
            {loginConfig.submitCTAText}
          </Button>
          {loginConfig?.googleFlow?.visibility && (
            <View style={styles.googleFlow}>
              <Text style={styles.textSeparator}>{loginConfig.separatorText}</Text>
              <Button
                mode="outlined"
                icon={() => <FontAwesome5 name="google" size={18} color="black" />}
                style={styles.baseButtonGoogle}
                labelStyle={styles.text}
                contentStyle={styles.content} onPress={() => console.log("Google Pressed")} >
                {loginConfig.googleFlow.text}
              </Button>
            </View>
          )}
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
  container: { flex: 1, justifyContent: "center", padding: 16, },
  title: { fontSize: 22, marginBottom: 50, marginTop: -80, textAlign: "center", fontWeight: "bold", },
  text: { marginVertical: 5, fontWeight: "600", },
  textSeparator: {
    marginVertical: 5, 
    color: "#64748B", 
    fontWeight: "400",
    fontSize: 14,
    letterSpacing: 0.01,
  },
  input: {
    // --- Layout & Border (from your .Input CSS)
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 8,

    // --- Placeholder / Text Style
    // fontFamily: "Gabarito",      // load via expo-font if custom
    fontStyle: "normal",
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.01,
    color: "#000000",            // actual input text color
  },
  baseButton: {
    marginVertical: 40,
    borderRadius: 9999,         // pill shape
    backgroundColor: "#2B8761", // green background
    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)', // modern web shadow
  },
  forgetPasswordText: {
    alignSelf: "flex-end",  // aligns to the right edge
    color: "#007AFF",       // iOS blue link color
    textDecorationLine: "underline", // underline text
    fontWeight: "500",
    marginTop: 6,
  },
  inputError: {
    borderColor: "red", // 👈 highlight error
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4, // works in React Native 0.71+, else use marginRight
  },
  errorText: {
    color: "red",
    fontSize: 13,
  },
  googleFlow: {
    position:"absolute",
    alignItems:"center",
    bottom:40,
    right:16,
    left:16,
  },
  baseButtonGoogle: {
    marginVertical: 10,
    justifyContent:"center",
    alignItems:"center",
    alignSelf:"stretch",
    height:45,
    borderRadius: 9999,
    borderWidth: 2.5,
    borderColor: "#E2E8F0",
    backgroundColor: "white",
    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)', // modern web shadow
  },
});
