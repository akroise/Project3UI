import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { Text, useTheme, Card } from "react-native-paper";
import { getMonthlySummary } from "../api"; // Existing BE call
import Toast from "react-native-toast-message";

const screenWidth = Dimensions.get("window").width - 32;

export default function MonthlySummaryGraph({ monthSummary = {}, activeMonth, onMonthSelect }) {
    const theme = useTheme();
    const currentMonthIndex = new Date().getMonth(); // 0 = Jan
    const [monthlyData, setMonthlyData] = useState([]);
    const [animatedHeights, setAnimatedHeights] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(currentMonthIndex);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState("₹");

    // ✅ Step 4 — Safe fallback to BE if no prop data
    useEffect(() => {
        const fetchFallback = async () => {
            if (!monthSummary || Object.keys(monthSummary).length === 0) {
                try {
                    const res = await getMonthlySummary();
                    if (res.status === "success") {
                        const formatted = res.data.map((item) => ({
                            month: item.month,
                            exp: item.totalExpense,
                            transactionCount: item.transactionCount,
                        }));
                        setMonthlyData(formatted);
                        // Find the highest expense to scale others relative to it
                        const maxExpense = Math.max(...formatted.map((item) => item.exp || 0), 1);
                        const animValues = formatted.map(
                            (item) => new Animated.Value((item.exp / maxExpense) * 120) // 120 is the max bar height in px
                        );
                        setAnimatedHeights(animValues);
                        setCurrency(res.currency === "INR" ? "₹" : res.currency || "");
                    }
                } catch (err) {
                    Toast.show({
                        type: "error",
                        text1: "Failed to fetch monthly summary",
                    });
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchFallback();
    }, []);

    // ✅ Update graph when monthSummary prop changes
    useEffect(() => {
        if (monthSummary && Object.keys(monthSummary).length > 0) {
            const formatted = Object.keys(monthSummary).map((m) => ({
                month: m,
                exp: monthSummary[m].totalExpense || 0,
                transactionCount: monthSummary[m].transactionCount || 0,
            }));

            setMonthlyData(formatted);
            const animValues = formatted.map(
                (item) => new Animated.Value(item.exp / 400)
            );
            setAnimatedHeights(animValues);
            setLoading(false);
        }
    }, [monthSummary]);

    // ✅ Dynamically update selected index if activeMonth changes
    useEffect(() => {
        if (activeMonth && monthlyData.length > 0) {
            const index = monthlyData.findIndex((m) => m.month === activeMonth);
            if (index !== -1) setSelectedIndex(index);
        }
    }, [activeMonth, monthlyData]);

    // ✅ Animate bars when data updates
    useEffect(() => {
        animatedHeights.forEach((anim, i) => {
            const maxExpense = Math.max(...monthlyData.map((item) => item.exp || 0), 1);
            Animated.timing(anim, {
                toValue: (monthlyData[i]?.exp / maxExpense) * 120 || 0,
                duration: 600,
                useNativeDriver: false,
            }).start();
        });
    }, [monthlyData]);

    if (loading) {
        return (
            <Card style={[styles.container, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={{ color: "#fff", marginTop: 8 }}>Loading summary...</Text>
                </View>
            </Card>
        );
    }

    const selected = monthlyData[selectedIndex] || {};

    return (
        <Card style={[styles.container, { backgroundColor: theme.colors.primary }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.heading}>Total Expense</Text>
                <Text variant="headlineMedium" style={styles.amount}>
                    {currency}
                    {selected.exp ? selected.exp.toLocaleString() : "0"}
                </Text>
                <Text style={styles.subHeading}>
                    ({selected.month || "N/A"}) •{" "}
                    {selected.transactionCount || 0} transactions
                </Text>
            </View>

            {/* Bar chart */}
            <View style={styles.graphContainer}>
                {monthlyData.map((item, index) => {
                    const isActive = index === selectedIndex;
                    const barColor = isActive ? "#ffffff" : "rgba(255,255,255,0.5)";

                    return (
                        <TouchableOpacity
                            key={item.month}
                            style={styles.barWrapper}
                            activeOpacity={0.8}
                            onPress={() => {
                                setSelectedIndex(index);
                                onMonthSelect && onMonthSelect(item.month); // 👈 notify parent
                            }}
                        >
                            <Animated.View
                                style={[
                                    styles.bar,
                                    {
                                        height: animatedHeights[index],
                                        backgroundColor: barColor,
                                    },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.label,
                                    isActive && { color: "#fff", fontWeight: "700" },
                                ]}
                            >
                                {item.month}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        marginHorizontal: 10,
        marginTop: 10,
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    loaderContainer: {
        height: 160,
        alignItems: "center",
        justifyContent: "center",
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    heading: {
        color: "#fff",
        fontSize: 14,
    },
    amount: {
        color: "#fff",
        fontWeight: "700",
    },
    subHeading: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        marginTop: 2,
    },
    graphContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: 130,
        paddingHorizontal: 4,
    },
    barWrapper: {
        alignItems: "center",
        width: (screenWidth - 60) / 11,
    },
    bar: {
        width: 10,
        borderRadius: 5,
    },
    label: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        marginTop: 4,
    },
});