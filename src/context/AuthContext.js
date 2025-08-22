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
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username, authMethod, email) => {
    try {
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        authMethod,
        createdAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      setHasCompletedOnboarding(false);
      
      return { success: true };
    } catch (error) {
      console.error('Error during sign up:', error);
      return { success: false, error: error.message };
    }
  };

  const signIn = async (pin) => {
    try {
      const storedPin = await AsyncStorage.getItem("userPin");
      if (storedPin === pin) {
        setIsAuthenticated(true);
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
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userPin");
      await AsyncStorage.removeItem("onboardingCompleted");
      setUser(null);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error("Error during sign out:", error);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
