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
    console.log(
      "SecurityNoticeContext: Component mounted, loading settings..."
    );
    loadSecurityNoticeSetting();
  }, []);

  const loadSecurityNoticeSetting = async () => {
    try {
      console.log(
        "SecurityNoticeContext: Starting to load security notice setting..."
      );

      // Clear old keys to avoid conflicts
      try {
        await AsyncStorage.removeItem("showSecurityNotice");
        console.log("SecurityNoticeContext: Old security notice key cleared");
      } catch (e) {
        console.log("SecurityNoticeContext: Error clearing old key:", e);
      }

      const setting = await AsyncStorage.getItem("securityNoticeEnabled");
      console.log("SecurityNoticeContext: Loaded from AsyncStorage:", setting);

      // ALWAYS force to true for now - this is the user's request
      // Force default to true for new installations or if setting is false
      if (setting === null || setting === "false") {
        console.log("SecurityNoticeContext: Setting to true (default)");
        setShowSecurityNotice(true);
        // Save the default setting to AsyncStorage
        await AsyncStorage.setItem("securityNoticeEnabled", "true");
        console.log(
          "SecurityNoticeContext: Default true saved to AsyncStorage"
        );
      } else if (setting === "true") {
        // User has explicitly set it to true
        console.log("SecurityNoticeContext: User preference found: true");
        setShowSecurityNotice(true);
      } else {
        // Any other value, force to true
        console.log(
          "SecurityNoticeContext: Invalid value found, forcing to true"
        );
        setShowSecurityNotice(true);
        await AsyncStorage.setItem("securityNoticeEnabled", "true");
      }
    } catch (error) {
      console.log("SecurityNoticeContext: Error loading setting:", error);
      // On error, keep default as true
      setShowSecurityNotice(true);
    }
  };

  const updateSecurityNoticeSetting = async (enabled) => {
    try {
      console.log(
        "SecurityNoticeContext: updateSecurityNoticeSetting called with:",
        enabled
      );
      console.log(
        "SecurityNoticeContext: Current state before update:",
        showSecurityNotice
      );

      await AsyncStorage.setItem("securityNoticeEnabled", enabled.toString());
      console.log("SecurityNoticeContext: Saved to AsyncStorage:", enabled);

      setShowSecurityNotice(enabled);
      console.log("SecurityNoticeContext: State updated to:", enabled);
      console.log(
        "SecurityNoticeContext: State after update:",
        showSecurityNotice
      );
    } catch (error) {
      console.log("SecurityNoticeContext: Error saving setting:", error);
    }
  };

  // Add effect to monitor state changes
  useEffect(() => {
    console.log("SecurityNoticeContext: State changed to:", showSecurityNotice);
  }, [showSecurityNotice]);

  const value = {
    showSecurityNotice,
    updateSecurityNoticeSetting,
    resetToDefault: async () => {
      console.log("SecurityNoticeContext: resetToDefault called");
      await AsyncStorage.setItem("securityNoticeEnabled", "true");
      setShowSecurityNotice(true);
      console.log("SecurityNoticeContext: Reset to default completed");
    },
    forceReset: async () => {
      console.log("SecurityNoticeContext: forceReset called");
      try {
        await AsyncStorage.removeItem("securityNoticeEnabled");
        await AsyncStorage.removeItem("showSecurityNotice");
        console.log("SecurityNoticeContext: AsyncStorage cleared");
        setShowSecurityNotice(true);
        await AsyncStorage.setItem("securityNoticeEnabled", "true");
        console.log("SecurityNoticeContext: Force reset completed");
      } catch (error) {
        console.log("SecurityNoticeContext: Error during force reset:", error);
        setShowSecurityNotice(true);
      }
    },
    ensureEnabled: async () => {
      console.log("SecurityNoticeContext: ensureEnabled called");
      setShowSecurityNotice(true);
      await AsyncStorage.setItem("securityNoticeEnabled", "true");
      console.log(
        "SecurityNoticeContext: Security notice ensured to be enabled"
      );
    },
  };

  return (
    <SecurityNoticeContext.Provider value={value}>
      {children}
    </SecurityNoticeContext.Provider>
  );
};
