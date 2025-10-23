import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Menu, Button } from "react-native-paper";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { saveExpense } from "../api/expenseApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";


export default function AddExpenseScreen() {
    // --- State variables
    const [date] = useState(new Date().toLocaleDateString()); // auto-filled date
    const [menuVisible, setMenuVisible] = useState(false);
    const [expenseType, setExpenseType] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const { auth, loading, error, login, logout } = useAuth();
    const { config } = useConfig();
    const addExpenseConfig = config?.addExpensePage;

    // --- Clear fields
    const handleCancel = () => {
        setExpenseType("");
        setDescription("");
        setAmount("");
        Toast.show({
            type: "info",
            text1: "Fields cleared 🧹",
            visibilityTime: 1500,
        });
    };

    // --- Save data to backend
    const handleSave = async () => {
        if (!expenseType || !amount) {
            Toast.show({
                type: "error",
                text1: "Missing details",
                text2: "Please fill in all required fields",
            });
            return;
        }

        if (amount <= 0) {
            Toast.show({
                type: "error",
                text1: "Amount error",
                text2: "Amount cannot be 0 or less",
            });
            return;
        }

        // ✅ Get real-time timestamp (ISO format)
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, -1); // remove trailing 'Z' (which marks UTC)

        const expenseData = {
            DateTime: localDateTime,
            expenseType,
            description,
            amount: parseFloat(amount),
        };

        console.log(JSON.stringify(expenseData));

        try {
            const response = await saveExpense(expenseData);
            console.log(response)

            if (response.success) {
                Toast.show({
                    type: "success",
                    text1: "Expense saved successfully 🎉",
                });
                // handleCancel(); // clear fields
                setExpenseType("");
                setDescription("");
                setAmount("");
            } else {
                Toast.show({
                    type: "error",
                    text1: response?.error?.details || "Something went wrong",
                    text2: response?.data?.message || "Please try again later",
                });
            }
        } catch (error) {
            console.error("Error:", error);
            Toast.show({
                type: "error",
                text1: "Network error",
                text2: "Could not connect to backend",
            });
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

    if (!addExpenseConfig)
        return (
            <View style={styles.container}>
                <ActivityIndicator
                    animating={true}
                    size="large"
                />
            </View>
        );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.heading}>{addExpenseConfig.title}</Text>

                {/* Date (non-editable) */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{addExpenseConfig.input1.text}</Text>
                    <TextInput style={styles.input} value={date} editable={false} />
                </View>

                {/* Expense Type (Dropdown) */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{addExpenseConfig.input2.text}</Text>
                    
                        <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisible(false)}
                            anchorPosition="bottom" // 👈 fixes invisible menu
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setMenuVisible(true)}
                                    icon={() => (
                                        <MaterialCommunityIcons
                                            name="chevron-down"
                                            size={20}
                                            color="#111827"
                                        />
                                    )}
                                    textColor="#111827"
                                    style={styles.dropdownButton}
                                    contentStyle={{ justifyContent: "space-between" }}
                                >
                                    {expenseType || addExpenseConfig?.input2?.hint || "Select Expense Type"}
                                </Button>
                            }
                        >
                            {addExpenseConfig?.input2?.List?.map((item) => (
                                <Menu.Item
                                    key={item}
                                    onPress={() => {
                                        setExpenseType(item);
                                        // setMenuVisible(false);
                                        setTimeout(() => setMenuVisible(false), 150); // prevent stuck menu on slow devices
                                    }}
                                    title={item}
                                />
                            ))}
                        </Menu>
                    
                </View>


                {/* Description */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{addExpenseConfig.input3.text}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={addExpenseConfig.input3.hint}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Amount */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{addExpenseConfig.input4.text}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={addExpenseConfig.input4.hint}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelText}>{addExpenseConfig.buttons.cta1}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveText}>{addExpenseConfig.buttons.cta2}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 16,
    },
    scroll: {
        paddingBottom: 100,
    },
    heading: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#2B8761",
        marginVertical: 24,
        textAlign: "center",
    },
    fieldContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        color: "#374151",
        marginBottom: 6,
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        color: "#111827",
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        marginBottom: 50,
        backgroundColor: "#fff",
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#E5E7EB",
        borderRadius: 30,
        paddingVertical: 12,
        marginRight: 10,
        alignItems: "center",
    },
    saveButton: {
        flex: 1,
        backgroundColor: "#2B8761",
        borderRadius: 30,
        paddingVertical: 12,
        marginLeft: 10,
        alignItems: "center",
    },
    cancelText: {
        color: "#374151",
        fontSize: 16,
        fontWeight: "600",
    },
    saveText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    dropdownButton: {
        borderColor: "#E5E7EB",
        borderWidth: 1.5,
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
    },

});
