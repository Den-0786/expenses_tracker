import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import OnboardingScreen from "./src/screens/OnboardingScreen";
import MainTabNavigator from "./src/navigation/MainTabNavigator";

import { DatabaseProvider } from "./src/context/DatabaseContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { BudgetProvider } from "./src/context/BudgetContext";
import { SecurityProvider } from "./src/context/SecurityContext";
import { SecurityNoticeProvider } from "./src/context/SecurityNoticeContext";

const Stack = createStackNavigator();

export default function App() {
  console.log("App.js: Starting Expenses Tracker App");

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <DatabaseProvider>
        <NotificationProvider>
          <BudgetProvider>
            <SecurityProvider>
              <SecurityNoticeProvider>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <Stack.Navigator
                    initialRouteName="Onboarding"
                    screenOptions={{ headerShown: false }}
                  >
                    <Stack.Screen
                      name="Onboarding"
                      component={OnboardingScreen}
                    />
                    <Stack.Screen name="Main" component={MainTabNavigator} />
                  </Stack.Navigator>
                </NavigationContainer>
              </SecurityNoticeProvider>
            </SecurityProvider>
          </BudgetProvider>
        </NotificationProvider>
      </DatabaseProvider>
    </PaperProvider>
  );
};
