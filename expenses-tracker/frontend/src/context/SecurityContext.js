import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

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

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  useEffect(() => {
    if (isSecurityEnabled) {
      checkAppLockStatus();
    }
  }, [isSecurityEnabled]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.log("Biometric check failed:", error);
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
      console.log("Error checking lock status:", error);
    }
  };

  const updateLastActiveTime = async () => {
    try {
      await AsyncStorage.setItem("lastActiveTime", Date.now().toString());
    } catch (error) {
      console.log("Error updating last active time:", error);
    }
  };

  const setAppPin = async (newPin) => {
    try {
      await AsyncStorage.setItem("appPin", newPin);
      setPin(newPin);
      return true;
    } catch (error) {
      console.log("Error setting PIN:", error);
      return false;
    }
  };

  const verifyPin = async (inputPin) => {
    try {
      const storedPin = await AsyncStorage.getItem("appPin");
      if (storedPin === inputPin) {
        setIsAuthenticated(true);
        setIsLocked(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        updateLastActiveTime();
        return true;
      } else {
        handleFailedAttempt();
        return false;
      }
    } catch (error) {
      console.log("Error verifying PIN:", error);
      return false;
    }
  };

  const authenticateWithBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your finances",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        setIsAuthenticated(true);
        setIsLocked(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        updateLastActiveTime();
        return true;
      }
      return false;
    } catch (error) {
      console.log("Biometric authentication failed:", error);
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
      console.log("Error toggling biometric:", error);
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
      console.log("Error toggling security:", error);
      return "error";
    }
  };

  const toggleAutoLock = async (enabled) => {
    try {
      await AsyncStorage.setItem("autoLockEnabled", enabled.toString());
      setAutoLockEnabled(enabled);
      return true;
    } catch (error) {
      console.log("Error toggling auto lock:", error);
      return false;
    }
  };

  const setAutoLockTimeoutValue = async (minutes) => {
    try {
      await AsyncStorage.setItem("autoLockTimeout", minutes.toString());
      setAutoLockTimeout(minutes);
      return true;
    } catch (error) {
      console.log("Error setting auto lock timeout:", error);
      return false;
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const securityEnabled = await AsyncStorage.getItem("securityEnabled");
      const storedPin = await AsyncStorage.getItem("appPin");
      const biometricEnabled = await AsyncStorage.getItem("biometricEnabled");
      const autoLockEnabled = await AsyncStorage.getItem("autoLockEnabled");
      const autoLockTimeout = await AsyncStorage.getItem("autoLockTimeout");

      if (securityEnabled === "true") {
        setIsSecurityEnabled(true);

        if (storedPin) {
          setPin(storedPin);
        }

        if (biometricEnabled === "true") {
          setIsBiometricEnabled(true);
        }

        if (autoLockEnabled !== null) {
          setAutoLockEnabled(autoLockEnabled === "true");
        }

        if (autoLockTimeout) {
          setAutoLockTimeout(parseInt(autoLockTimeout));
        }

        checkAppLockStatus();
      } else {
        setIsSecurityEnabled(false);
        setIsAuthenticated(true);
        setIsLocked(false);
      }
    } catch (error) {
      console.log("Error loading security settings:", error);
    }
  };

  const resetSecurity = async () => {
    try {
      await AsyncStorage.removeItem("appPin");
      await AsyncStorage.removeItem("biometricEnabled");
      await AsyncStorage.removeItem("lastActiveTime");
      setPin(null);
      setIsBiometricEnabled(false);
      setIsAuthenticated(true);
      setIsLocked(false);
      setFailedAttempts(0);
      setLockoutUntil(null);
    } catch (error) {
      console.log("Error resetting security:", error);
    }
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
    failedAttempts,
    lockoutUntil,
    isLockedOut: isLockedOut(),
    lockoutTimeRemaining: getLockoutTimeRemaining(),
    setAppPin,
    verifyPin,
    authenticateWithBiometric,
    lockApp,
    unlockApp,
    toggleBiometric,
    toggleSecurity,
    toggleAutoLock,
    setAutoLockTimeout: setAutoLockTimeoutValue,
    resetSecurity,
    updateLastActiveTime,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
