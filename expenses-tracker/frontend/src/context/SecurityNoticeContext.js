import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SecurityNoticeContext = createContext();

export const useSecurityNotice = () => {
  const context = useContext(SecurityNoticeContext);
  if (!context) {
    throw new Error(
      "useSecurityNotice must be used within a SecurityNoticeProvider"
    );
  }
  return context;
};

export const SecurityNoticeProvider = ({ children }) => {
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);

  useEffect(() => {
    loadSecurityNoticeSetting();
  }, []);

  const loadSecurityNoticeSetting = async () => {
    try {
      // Clear old keys to avoid conflicts
      try {
        await AsyncStorage.removeItem("showSecurityNotice");
      } catch (e) {}

      const setting = await AsyncStorage.getItem("securityNoticeEnabled");

      // ALWAYS force to true for now - this is the user's request
      // Force default to true for new installations or if setting is false
      if (setting === null || setting === "false") {
        setShowSecurityNotice(true);
        // Save the default setting to AsyncStorage
        await AsyncStorage.setItem("securityNoticeEnabled", "true");
      } else if (setting === "true") {
        // User has explicitly set it to true

        setShowSecurityNotice(true);
      } else {
        // Any other value, force to true

        setShowSecurityNotice(true);
        await AsyncStorage.setItem("securityNoticeEnabled", "true");
      }
    } catch (error) {
      // On error, keep default as true
      setShowSecurityNotice(true);
    }
  };

  const updateSecurityNoticeSetting = async (enabled) => {
    try {
      await AsyncStorage.setItem("securityNoticeEnabled", enabled.toString());

      setShowSecurityNotice(enabled);
    } catch (error) {}
  };

  const value = {
    showSecurityNotice,
    updateSecurityNoticeSetting,
    resetToDefault: async () => {
      await AsyncStorage.setItem("securityNoticeEnabled", "true");
      setShowSecurityNotice(true);
    },
    forceReset: async () => {
      try {
        await AsyncStorage.removeItem("securityNoticeEnabled");
        await AsyncStorage.removeItem("showSecurityNotice");

        setShowSecurityNotice(true);
        await AsyncStorage.setItem("securityNoticeEnabled", "true");
      } catch (error) {
        setShowSecurityNotice(true);
      }
    },
    ensureEnabled: async () => {
      setShowSecurityNotice(true);
      await AsyncStorage.setItem("securityNoticeEnabled", "true");
    },
  };

  return (
    <SecurityNoticeContext.Provider value={value}>
      {children}
    </SecurityNoticeContext.Provider>
  );
};
