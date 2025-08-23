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
    updateLastActiveTime,
  } = useSecurity();
  const { hasSettings } = useDatabase();
  const { theme } = useTheme();

  useEffect(() => {
    // If no security is enabled, go directly to main app
    if (!isSecurityEnabled) {
      navigation.replace("MainTabs");
      return;
    }

    
    if (isLocked) {
      navigation.replace("Lock");
// sourcery skip: merge-else-if
    } else if (isAuthenticated) {
      
      navigation.replace("MainTabs");
    } else {
      if (isBiometricAvailable && isBiometricEnabled) {
        handleBiometricAuth();
      } else {
        navigation.replace("Lock");
      }
    }
  }, [
    isSecurityEnabled,
    isLocked,
    isAuthenticated,
    isBiometricAvailable,
    isBiometricEnabled,
  ]);

  const handleBiometricAuth = async () => {
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        updateLastActiveTime();
        navigation.replace("MainTabs");
      } else {
        navigation.replace("Lock");
      }
    } catch (error) {
      navigation.replace("Lock");
    }
  };

  
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

export default SecureWrapper;
