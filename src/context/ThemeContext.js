import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode for modern financial app
  const [themeMode, setThemeMode] = useState("light"); // Default to light mode

  useEffect(() => {
    if (themeMode === "system") {
      setIsDarkMode(systemColorScheme === "dark");
    }
  }, [systemColorScheme, themeMode]);

  const toggleTheme = () => {
    if (themeMode === "system") {
      setThemeMode(isDarkMode ? "light" : "dark");
      setIsDarkMode(!isDarkMode);
    } else {
      setThemeMode(themeMode === "light" ? "dark" : "light");
      setIsDarkMode(!isDarkMode);
    }
  };

  const setTheme = (mode) => {
    setThemeMode(mode);
    if (mode === "system") {
      setIsDarkMode(systemColorScheme === "dark");
    } else {
      setIsDarkMode(mode === "dark");
    }
  };

  // Update theme when isDarkMode changes
  useEffect(() => {
    if (themeMode === "system") {
      setIsDarkMode(systemColorScheme === "dark");
    }
  }, [themeMode, systemColorScheme]);

  const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  const customTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      // Modern Financial App Colors
      primary: "#00897B", // Teal - Top navigation, main brand
      secondary: "#43A047", // Green - Income, positive values
      accent: "#FB8C00", // Orange - Buttons, call-to-action
      background: isDarkMode ? "#121212" : "#FFFFFF", // White background for modern look
      surface: isDarkMode ? "#1E1E1E" : "#FFFFFF", // Pure white cards for modern design
      text: isDarkMode ? "#FFFFFF" : "#2C3E50", // Dark blue-gray text (no black!)
      textSecondary: isDarkMode ? "#B0B0B0" : "#6C757D", // Medium gray for labels
      border: isDarkMode ? "#2C3E50" : "#E9ECEF", // Subtle borders

      // Financial-specific colors
      success: "#43A047", // Green for income
      warning: "#FB8C00", // Orange for warnings
      error: "#E53935", // Red for expenses
      income: "#43A047", // Green for income numbers
      expense: "#E53935", // Red for expense numbers

      // Additional modern colors
      info: "#2196F3", // Blue for info
      chart: "#4CAF50", // Green for charts
      chartExpense: "#F44336", // Red for expense charts
    },
  };

  const value = {
    isDarkMode,
    themeMode,
    theme: customTheme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
