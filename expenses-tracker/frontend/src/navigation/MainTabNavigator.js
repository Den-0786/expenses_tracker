import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

import HomeScreen from "../screens/HomeScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import IncomeScreen from "../screens/IncomeScreen";
import BudgetScreen from "../screens/BudgetScreen";
// import ReportsScreen from "../screens/ReportsScreen"; // Removed - only email reports
import NotesScreen from "../screens/NotesScreen";
import SettingsScreen from "../screens/SettingsScreen";
import OnboardingScreen from "../screens/OnboardingScreen";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { theme, isDarkMode } = useTheme();

  const CustomHomeIcon = ({ focused, size }) => (
    <View style={getHomeTabStyles(focused)}>
      <MaterialIcons name="home" size={size} color="#FFFFFF" />
      <Text style={styles.homeTabText}>Home</Text>
    </View>
  );

  const RegularIcon = ({ focused, iconName, size }) => (
    <MaterialIcons
      name={iconName}
      size={size}
      color={focused ? "#00897B" : "#6B7280"}
    />
  );

  const getHomeTabStyles = (focused) => ({
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: isDarkMode ? "#374151" : "#FFFFFF",
    borderWidth: 2,
    borderColor: "#00897B",
  });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          if (route.name === "Home") {
            return null;
          } else if (route.name === "Setup") {
            return (
              <RegularIcon focused={focused} iconName="build" size={size} />
            );
          } else if (route.name === "Expenses") {
            return (
              <RegularIcon focused={focused} iconName="receipt" size={size} />
            );
          } else if (route.name === "Income") {
            return (
              <RegularIcon
                focused={focused}
                iconName="trending-up"
                size={size}
              />
            );
          } else if (route.name === "Budget") {
            return (
              <RegularIcon
                focused={focused}
                iconName="account-balance-wallet"
                size={size}
              />
            );
          } else if (route.name === "Notes") {
            return (
              <RegularIcon focused={focused} iconName="note" size={size} />
            );
          } else if (route.name === "Settings") {
            return (
              <RegularIcon focused={focused} iconName="settings" size={size} />
            );
          }
        },
        tabBarActiveTintColor: "#00897B",
        tabBarInactiveTintColor: "#6B7280",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 3,
          borderTopColor: "#00897B",
          paddingBottom: 0,
          paddingTop: 0,
          height: 60,
          elevation: 0,
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            {/* Crescent moon shaped navigation bar */}
            <View style={styles.crescentContainer}>
              {/* Left side of crescent */}
              <View
                style={[
                  styles.crescentSide,
                  styles.crescentLeft,
                  { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF" },
                ]}
              />

              {/* Right side of crescent */}
              <View
                style={[
                  styles.crescentSide,
                  styles.crescentRight,
                  { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF" },
                ]}
              />

              {/* Center curved area for Home tab */}
              <View
                style={[
                  styles.centerCurve,
                  { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF" },
                ]}
              >
                {/* Home tab circle positioned in the curved area */}
                <View
                  style={[
                    styles.homeTabCircle,
                    { backgroundColor: isDarkMode ? "#374151" : "#FFFFFF" },
                  ]}
                >
                  <MaterialIcons name="home" size={28} color="#6B7280" />
                  <Text
                    style={[
                      styles.homeTabText,
                      { color: isDarkMode ? "#FFFFFF" : "#2C3E50" },
                    ]}
                  >
                    Home
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      })}
    >
      <Tab.Screen
        name="Setup"
        component={OnboardingScreen}
        options={{ title: "Setup" }}
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "" }} />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{ title: "Budget" }}
      />
      {/* Reports tab removed - only email reports */}
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: "Notes" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    position: "relative",
  },
  crescentContainer: {
    flex: 1,
    position: "relative",
    height: 60,
  },
  crescentSide: {
    position: "absolute",
    top: 0,
    height: 60,
    width: "50%",
  },
  crescentLeft: {
    left: 0,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 0,
  },
  crescentRight: {
    right: 0,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 0,
  },
  centerCurve: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -40,
    width: 80,
    height: 60,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  homeTabCircle: {
    position: "absolute",
    top: -15,
    left: "50%",
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: "#00897B",
  },
  homeTabText: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
});

export default MainTabNavigator;
