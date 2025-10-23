import React, { useRef, useEffect } from "react";
import { Animated, TouchableOpacity, View, ToastAndroid } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "../screens/HomeScreen";
import RemindersScreen from "../screens/RemindersScreen";
import ReceiptsScreen from "../screens/ReceiptsScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import Statistics from "../screens/StatisticsScreen";
import Toast from "react-native-toast-message";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

// Reusable animated icon component
function TabBarIcon({ name, focused, center }) {
  const scale = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: center ? 1.5 : scale }],
        backgroundColor: center ? "#2B8761" : "transparent", // green theme
        borderRadius: center ? 40 : 0,
        padding: center ? 12 : 0,
        justifyContent: "center",
        alignItems: "center",
        elevation: center ? 6 : 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      }}
    >
      <Ionicons
        name={name}
        size={center ? 28 : 22}
        color={center ? "#fff" : focused ? "#2B8761" : "#8C8C8C"}
      />
    </Animated.View>
  );
}

export default function AppTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2B8761",
        tabBarInactiveTintColor: "#8C8C8C",
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 70,
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          paddingBottom: 4,
        },
      }}
    >

      {/* Receipts */}
      <Tab.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="document-text-outline" focused={focused} />
          ),
        }}
      />


      {/* Reminders */}
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="alarm-outline" focused={focused} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                Toast.show({
                  type: "info",
                  text1: "Reminders feature ⏰",
                  text2: "Coming soon!",
                  visibilityTime: 2000,
                });
              }}
            />
          ),
        }}
      />

      {/* Add Expense (center, always big) */}
      <Tab.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={({ navigation }) => ({
          tabBarLabel: "",
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#2B8761",
                justifyContent: "center",
                alignItems: "center",
                elevation: 8, // ✅ Android visibility
                shadowColor: "#000", // ✅ iOS shadow
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            >
              <MaterialCommunityIcons name="plus" size={32} color="#fff" />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => navigation.navigate("AddExpense")}
              activeOpacity={0.8}
              style={{
                top: -25, // ✅ keeps it floating above bottom bar
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999, // ✅ ensures above all
                elevation: 10, // ✅ Android support
              }}
            />
          ),
        })}
      />

      {/* Receipts */}
      <Tab.Screen
        name="Statistics"
        component={Statistics}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="stats-chart-outline" focused={focused} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                Toast.show({
                  type: "info",
                  text1: "Statistics feature 📊",
                  text2: "Coming soon!",
                  visibilityTime: 2000,
                });
              }}
            />
          ),
        }}
      />

      {/* Home */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home-outline" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
