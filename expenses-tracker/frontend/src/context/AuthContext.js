import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../services/api";

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
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem("user");
      const authToken = await AsyncStorage.getItem("authToken");
      const onboardingStatus = await AsyncStorage.getItem(
        "onboardingCompleted"
      );
      const sessionActive = await AsyncStorage.getItem("sessionActive");

      // Only authenticate if we have user data, token, AND an active session
      if (userData && authToken && sessionActive === "true") {
        // Set the token in ApiService
        ApiService.setToken(authToken);

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsSessionActive(true);
        setHasCompletedOnboarding(onboardingStatus === "true");
      } else {
        // Clear any existing session data
        await AsyncStorage.removeItem("sessionActive");
        await AsyncStorage.removeItem("authToken");
        setUser(null);
        setIsAuthenticated(false);
        setIsSessionActive(false);
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      // On error, clear everything and assume user is not authenticated
      await AsyncStorage.removeItem("sessionActive");
      await AsyncStorage.removeItem("authToken");
      setUser(null);
      setIsAuthenticated(false);
      setIsSessionActive(false);
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
      // Call backend API to create user
      const response = await ApiService.request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, email, pin }),
      });

      if (response.token) {
        // Set the JWT token in ApiService
        ApiService.setToken(response.token);

        // Store token and user data (no local PIN storage)
        await AsyncStorage.setItem("authToken", response.token);
        await AsyncStorage.setItem("user", JSON.stringify(response.user));
        await AsyncStorage.setItem("sessionActive", "true");

        setUser(response.user);
        setIsAuthenticated(true);
        setIsSessionActive(true);
        setHasCompletedOnboarding(
          response.user.hasCompletedOnboarding || false
        );

        return { success: true };
      } else {
        return { success: false, error: "No token received from server" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async (pin) => {
    try {
      const userData = await AsyncStorage.getItem("user");

      if (!userData) {
        return {
          success: false,
          error: "No account found. Please sign up first.",
        };
      }

      const parsedUser = JSON.parse(userData);

      // Call backend API to authenticate
      const response = await ApiService.request("/auth/signin", {
        method: "POST",
        body: JSON.stringify({
          username: parsedUser.username,
          pin: pin,
        }),
      });

      if (response.token) {
        // Set the JWT token in ApiService
        ApiService.setToken(response.token);

        // Store token and update session
        await AsyncStorage.setItem("authToken", response.token);
        await AsyncStorage.setItem("sessionActive", "true");

        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsSessionActive(true);
        setHasCompletedOnboarding(parsedUser.hasCompletedOnboarding || false);
        return { success: true };
      } else {
        return { success: false, error: "Invalid PIN" };
      }
    } catch (error) {
      // Don't log the error to console to avoid "User not found" messages
      // Handle specific backend errors gracefully
      if (error.message && error.message.includes("User not found")) {
        return {
          success: false,
          error: "No account found. Please sign up first.",
        };
      }
      if (error.message && error.message.includes("Invalid credentials")) {
        return { success: false, error: "Invalid PIN" };
      }
      return { success: false, error: "Sign in failed. Please try again." };
    }
  };

  const changePin = async (oldPin, newPin) => {
    try {
      // Call backend API to change PIN
      const response = await ApiService.request("/auth/change-pin", {
        method: "POST",
        body: JSON.stringify({ oldPin, newPin }),
      });

      if (response.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || "Failed to change PIN",
        };
      }
    } catch (error) {
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
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // Clear session and authentication state
      await AsyncStorage.removeItem("sessionActive");
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("onboardingCompleted");
      await AsyncStorage.removeItem("lastActiveTime");

      // Clear token from ApiService
      ApiService.setToken(null);

      // Clear authentication state
      setUser(null);
      setIsAuthenticated(false);
      setIsSessionActive(false);
      setHasCompletedOnboarding(false);
    } catch (error) {
      // Silent error handling for sign out
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const updatedUser = { ...user, ...updatedUserData };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userPin");
      await AsyncStorage.removeItem("onboardingCompleted");
      await AsyncStorage.removeItem("sessionActive");
      await AsyncStorage.removeItem("profileImage");
      setUser(null);
      setIsAuthenticated(false);
      setIsSessionActive(false);
      setHasCompletedOnboarding(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearAllData = async () => {
    try {
      // Clear all user data
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("sessionActive");
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("onboardingCompleted");
      await AsyncStorage.removeItem("profileImage");

      // Clear security data
      await AsyncStorage.removeItem("securityEnabled");
      await AsyncStorage.removeItem("biometricEnabled");
      await AsyncStorage.removeItem("lastActiveTime");

      // Clear token from ApiService
      ApiService.setToken(null);

      // Clear authentication state
      setUser(null);
      setIsAuthenticated(false);
      setIsSessionActive(false);
      setHasCompletedOnboarding(false);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    hasCompletedOnboarding,
    isSessionActive,
    signUp,
    signIn,
    changePin,
    completeOnboarding,
    signOut,
    userExists,
    updateUser,
    deleteAccount,
    clearAllData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
