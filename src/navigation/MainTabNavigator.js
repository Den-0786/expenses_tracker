import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

import HomeScreen from "../screens/HomeScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import IncomeScreen from "../screens/IncomeScreen";
import BudgetScreen from "../screens/BudgetScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { theme } = useTheme();

  const getTabBarColor = (routeName) => {
    switch (routeName) {
      case "Home":
        return "#2196F3"; // Blue for Dashboard
      case "Income":
        return "#43A047"; // Green for Income
      case "Expenses":
        return "#2196F3"; // Blue for Expenses
      case "Budget":
        return "#2E7D32"; // Deep Green for Budget
      case "Settings":
        return "#1E88E5"; // Blue for Settings
      default:
        return "#2196F3";
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Expenses") {
            iconName = "receipt";
          } else if (route.name === "Income") {
            iconName = "trending-up";
          } else if (route.name === "Budget") {
            iconName = "account-balance-wallet";
          } else if (route.name === "Settings") {
            iconName = "settings";
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.7)",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["#4CAF50", "#2196F3"]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: "Expenses" }}
      />
      <Tab.Screen
        name="Income"
        component={IncomeScreen}
        options={{ title: "Income" }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{ title: "Budget" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
