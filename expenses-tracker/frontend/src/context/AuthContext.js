import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem("user");
      const onboardingStatus = await AsyncStorage.getItem(
        "onboardingCompleted"
      );

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setHasCompletedOnboarding(onboardingStatus === "true");
      } else {
        // No user data found, user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      // On error, assume user is not authenticated
      setUser(null);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const userExists = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      return !!userData;
    } catch (error) {
      return false;
    }
  };

  const signUp = async (username, email, pin) => {
    try {
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        createdAt: new Date().toISOString(),
      };

      // Store user data and PIN
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      await AsyncStorage.setItem("userPin", pin);

      setUser(newUser);
      setIsAuthenticated(true);
      setHasCompletedOnboarding(false);

      return { success: true };
    } catch (error) {
      console.error("Error during sign up:", error);
      return { success: false, error: error.message };
    }
  };

  const signIn = async (pin) => {
    try {
      const storedPin = await AsyncStorage.getItem("userPin");
      const userData = await AsyncStorage.getItem("user");

      if (!storedPin || !userData) {
        return {
          success: false,
          error: "No account found. Please sign up first.",
        };
      }

      if (storedPin === pin) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setHasCompletedOnboarding(parsedUser.hasCompletedOnboarding || false);
        return { success: true };
      } else {
        return { success: false, error: "Invalid PIN" };
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      return { success: false, error: error.message };
    }
  };

  const setPin = async (pin) => {
    try {
      await AsyncStorage.setItem("userPin", pin);
      return { success: true };
    } catch (error) {
      console.error("Error setting PIN:", error);
      return { success: false, error: error.message };
    }
  };

  const completeOnboarding = async (pin = null) => {
    try {
      await AsyncStorage.setItem("onboardingCompleted", "true");
      if (pin) {
        await AsyncStorage.setItem("userPin", pin);
      }
      setHasCompletedOnboarding(true);
      return { success: true };
    } catch (error) {
      console.error("Error completing onboarding:", error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // Only clear authentication state, keep user account data
      // This allows users to sign back in with the same account
      await AsyncStorage.removeItem("onboardingCompleted");

      // Clear authentication state
      setUser(null);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);

      // Note: We keep "user" and "userPin" in AsyncStorage
      // so the user can sign back in with the same account
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const updatedUser = { ...user, ...updatedUserData };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userPin");
      await AsyncStorage.removeItem("onboardingCompleted");
      setUser(null);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      return { success: true };
    } catch (error) {
      console.error("Error deleting account:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    hasCompletedOnboarding,
    signUp,
    signIn,
    setPin,
    completeOnboarding,
    signOut,
    userExists,
    updateUser,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
