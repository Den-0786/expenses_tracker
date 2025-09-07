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
      // Check if security is enabled
      const securityEnabled = await AsyncStorage.getItem("securityEnabled");
      const appPin = await AsyncStorage.getItem("appPin");

      // Only show security notice if security is NOT enabled
      if (securityEnabled !== "true" || !appPin) {
        setShowSecurityNotice(true);
      } else {
        setShowSecurityNotice(false);
      }
    } catch (error) {
      // On error, show notice by default
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
