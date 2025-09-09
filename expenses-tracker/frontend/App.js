import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import AuthNavigator from "./src/navigation/AuthNavigator";

import { AuthProvider } from "./src/context/AuthContext";
import { DatabaseProvider } from "./src/context/DatabaseContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { SecurityProvider } from "./src/context/SecurityContext";
import { SecurityNoticeProvider } from "./src/context/SecurityNoticeContext";

export default function App() {
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
          <SecurityProvider>
            <SecurityNoticeProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AuthNavigator />
                <Toast />
              </NavigationContainer>
            </SecurityNoticeProvider>
          </SecurityProvider>
        </NotificationProvider>
      </DatabaseProvider>
    </PaperProvider>
  );
};
