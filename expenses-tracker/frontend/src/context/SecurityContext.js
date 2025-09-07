import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { AppState } from "react-native";

const SecurityContext = createContext();

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
};

export const SecurityProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [autoLockTimeout, setAutoLockTimeout] = useState(5); // 5 minutes
  const [autoLockOnLeave, setAutoLockOnLeave] = useState(0); // 0 = immediately, 1 = 1 min, 2 = 2 min, 3 = 3 min

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  // Reload security settings when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        loadSecuritySettings();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  // Reset security when settings are cleared (e.g., on logout)
  useEffect(() => {
    const checkSecurityReset = async () => {
      try {
        const securityEnabled = await AsyncStorage.getItem("securityEnabled");
        if (securityEnabled !== "true") {
          // Security was disabled/cleared, reset state
          setIsSecurityEnabled(false);
          setIsAuthenticated(true);
          setIsLocked(false);
          setPin(null);
          setIsBiometricEnabled(false);
          setFailedAttempts(0);
          setLockoutUntil(null);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    checkSecurityReset();
  }, []);

  useEffect(() => {
    if (isSecurityEnabled) {
      checkAppLockStatus();
    }
  }, [isSecurityEnabled]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        if (isSecurityEnabled && autoLockOnLeave > 0) {
          setTimeout(
            () => {
              if (AppState.currentState !== "active") {
                setIsLocked(true);
                setIsAuthenticated(false);
              }
            },
            autoLockOnLeave * 60 * 1000
          );
        } else if (isSecurityEnabled && autoLockOnLeave === 0) {
          setIsLocked(true);
          setIsAuthenticated(false);
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [isSecurityEnabled, autoLockOnLeave]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      setIsBiometricAvailable(false);
    }
  };

  const checkAppLockStatus = async () => {
    try {
      if (!autoLockEnabled) return;

      const lastActiveTime = await AsyncStorage.getItem("lastActiveTime");
      if (lastActiveTime) {
        const timeDiff = Date.now() - parseInt(lastActiveTime);
        const timeoutMs = autoLockTimeout * 60 * 1000; // Convert minutes to milliseconds

        if (timeDiff > timeoutMs) {
          setIsLocked(true);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const updateLastActiveTime = async () => {
    try {
      await AsyncStorage.setItem("lastActiveTime", Date.now().toString());
    } catch (error) {
      // Silent error handling
    }
  };

  const setAppPin = async (newPin) => {
    try {
      // PIN is now managed by backend, just update local state
      setPin(newPin);
      return true;
    } catch (error) {
      return false;
    }
  };

  const verifyPin = async (inputPin) => {
    try {
      // PIN verification is now handled by AuthContext signIn
      // This function is kept for compatibility but should not be used
      // Use AuthContext.signIn() instead for PIN verification
      return false;
    } catch (error) {
      return false;
    }
  };

  const authenticateWithBiometric = async () => {
    try {
      // Check if biometric is available before attempting authentication
      if (!isBiometricAvailable) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your finances",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        setIsLocked(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        updateLastActiveTime();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const handleFailedAttempt = () => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);

    if (newFailedAttempts >= 3) {
      const lockoutTime = Date.now() + 20 * 60 * 1000;
      setLockoutUntil(lockoutTime);
      setFailedAttempts(0);
    }
  };

  const isLockedOut = () => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      return true;
    }
    if (lockoutUntil && Date.now() >= lockoutUntil) {
      setLockoutUntil(null);
    }
    return false;
  };

  const getLockoutTimeRemaining = () => {
    if (!lockoutUntil) return 0;
    const remaining = Math.max(0, lockoutUntil - Date.now());
    return Math.ceil(remaining / 1000);
  };

  const lockApp = () => {
    if (isSecurityEnabled) {
      setIsAuthenticated(false);
      setIsLocked(true);
    }
  };

  const unlockApp = () => {
    setIsAuthenticated(true);
    setIsLocked(false);
    updateLastActiveTime();
  };

  const toggleBiometric = async () => {
    if (!isBiometricAvailable) return false;

    try {
      const newValue = !isBiometricEnabled;
      await AsyncStorage.setItem("biometricEnabled", newValue.toString());
      setIsBiometricEnabled(newValue);
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleSecurity = async (enabled, method = null) => {
    try {
      await AsyncStorage.setItem("securityEnabled", enabled.toString());
      setIsSecurityEnabled(enabled);

      if (enabled && method === "pin") {
        return "pin";
      } else if (enabled && method === "biometric") {
        if (isBiometricAvailable) {
          await AsyncStorage.setItem("biometricEnabled", "true");
          setIsBiometricEnabled(true);
          return "biometric";
        } else {
          return "biometric_unavailable";
        }
      } else if (!enabled) {
        // Disabling security
        await resetSecurity();
        setIsAuthenticated(true);
        setIsLocked(false);
      }

      return "success";
    } catch (error) {
      return "error";
    }
  };

  const toggleAutoLock = async (enabled) => {
    try {
      await AsyncStorage.setItem("autoLockEnabled", enabled.toString());
      setAutoLockEnabled(enabled);
      return true;
    } catch (error) {
      return false;
    }
  };

  const setAutoLockTimeoutValue = async (minutes) => {
    try {
      await AsyncStorage.setItem("autoLockTimeout", minutes.toString());
      setAutoLockTimeout(minutes);
      return true;
    } catch (error) {
      return false;
    }
  };

  const setAutoLockOnLeaveValue = async (delay) => {
    try {
      await AsyncStorage.setItem("autoLockOnLeave", delay.toString());
      setAutoLockOnLeave(delay);
      return true;
    } catch (error) {
      return false;
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const securityEnabled = await AsyncStorage.getItem("securityEnabled");
      const biometricEnabled = await AsyncStorage.getItem("biometricEnabled");
      const autoLockEnabled = await AsyncStorage.getItem("autoLockEnabled");
      const autoLockTimeout = await AsyncStorage.getItem("autoLockTimeout");
      const autoLockOnLeave = await AsyncStorage.getItem("autoLockOnLeave");

      if (securityEnabled === "true") {
        setIsSecurityEnabled(true);

        // PIN is now managed by backend, no local PIN storage

        if (biometricEnabled === "true") {
          setIsBiometricEnabled(true);
        }

        if (autoLockEnabled !== null) {
          setAutoLockEnabled(autoLockEnabled === "true");
        }

        if (autoLockTimeout) {
          setAutoLockTimeout(parseInt(autoLockTimeout));
        }

        if (autoLockOnLeave) {
          setAutoLockOnLeave(parseInt(autoLockOnLeave));
        }

        checkAppLockStatus();
      } else {
        setIsSecurityEnabled(false);
        setIsAuthenticated(true);
        setIsLocked(false);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const resetSecurity = async () => {
    try {
      // Don't remove userPin as it's needed for authentication
      await AsyncStorage.removeItem("biometricEnabled");
      await AsyncStorage.removeItem("lastActiveTime");
      setPin(null);
      setIsBiometricEnabled(false);
      setIsAuthenticated(true);
      setIsLocked(false);
      setFailedAttempts(0);
      setLockoutUntil(null);
    } catch (error) {
      // Silent error handling
    }
  };

  const reloadSecuritySettings = async () => {
    await loadSecuritySettings();
  };

  const value = {
    isAuthenticated,
    isLocked,
    pin,
    isBiometricEnabled,
    isBiometricAvailable,
    isSecurityEnabled,
    autoLockEnabled,
    autoLockTimeout,
    autoLockOnLeave,
    failedAttempts,
    lockoutUntil,
    isLockedOut: isLockedOut,
    lockoutTimeRemaining: getLockoutTimeRemaining,
    setAppPin,
    verifyPin,
    authenticateWithBiometric,
    lockApp,
    unlockApp,
    toggleBiometric,
    toggleSecurity,
    toggleAutoLock,
    setAutoLockTimeout: setAutoLockTimeoutValue,
    setAutoLockOnLeave: setAutoLockOnLeaveValue,
    resetSecurity,
    reloadSecuritySettings,
    updateLastActiveTime,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
