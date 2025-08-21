import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useSecurity } from "../context/SecurityContext";
import { useDatabase } from "../context/DatabaseContext";
import PinSetupScreen from "../screens/PinSetupScreen";
import LockScreen from "../screens/LockScreen";
import MainTabNavigator from "../navigation/MainTabNavigator";
import { useTheme } from "../context/ThemeContext";

const SecureWrapper = ({ navigation }) => {
  const { 
    isAuthenticated, 
    isLocked, 
    pin, 
    isBiometricAvailable,
    isBiometricEnabled,
    authenticateWithBiometric,
    updateLastActiveTime
  } = useSecurity();
  const { hasSettings } = useDatabase();
  const { theme } = useTheme();

  useEffect(() => {
    // If no security is enabled, go directly to main app
    if (!isSecurityEnabled) {
      navigation.replace("Main");
      return;
    }

    // Security is enabled, check authentication status
    if (isLocked) {
      // App is locked, show lock screen
      navigation.replace("Lock");
    } else if (isAuthenticated) {
      // User is authenticated, show main app
      navigation.replace("Main");
    } else {
      // User has security enabled but not authenticated
      // Try biometric first if available and enabled
      if (isBiometricAvailable && isBiometricEnabled) {
        handleBiometricAuth();
      } else {
        // No biometric available, show lock screen
        navigation.replace("Lock");
      }
    }
  }, [isSecurityEnabled, isLocked, isAuthenticated, isBiometricAvailable, isBiometricEnabled]);

  const handleBiometricAuth = async () => {
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        updateLastActiveTime();
        navigation.replace("Main");
      } else {
        navigation.replace("Lock");
      }
    } catch (error) {
      navigation.replace("Lock");
    }
  };

  // Show loading while determining which screen to show
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: "center", 
      alignItems: "center",
      backgroundColor: theme.colors.background 
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

export default SecureWrapper;
