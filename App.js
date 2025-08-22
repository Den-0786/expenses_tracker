import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AuthNavigator from "./src/navigation/AuthNavigator";

import { AuthProvider } from "./src/context/AuthContext";
import { DatabaseProvider } from "./src/context/DatabaseContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { BudgetProvider } from "./src/context/BudgetContext";
import { SecurityProvider } from "./src/context/SecurityContext";
import { SecurityNoticeProvider } from "./src/context/SecurityNoticeContext";

export default function App() {
  console.log("App.js: Starting Expenses Tracker App");

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
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
                  <AuthNavigator />
                </NavigationContainer>
              </SecurityNoticeProvider>
            </SecurityProvider>
          </BudgetProvider>
        </NotificationProvider>
      </DatabaseProvider>
    </PaperProvider>
  );
};
