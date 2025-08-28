// App Configuration
export const APP_CONFIG = {
  // Set to 'api' to use real backend, 'mock' to use mock data
  DATA_SOURCE: "api", // Change this to 'mock' to use mock data

  // Backend API configuration
  API: {
    BASE_URL: "http://localhost:3000/api",
    TIMEOUT: 10000, // 10 seconds
  },

  // App settings
  APP: {
    NAME: "Expense Tracker",
    VERSION: "1.0.0",
    CURRENCY: "GHC",
    DATE_FORMAT: "yyyy-MM-dd",
    DATETIME_FORMAT: "yyyy-MM-dd HH:mm:ss",
  },

  // Feature flags
  FEATURES: {
    ENABLE_NOTIFICATIONS: true,
    ENABLE_BACKUP: true,
    ENABLE_EXPORT: true,
    ENABLE_ANALYTICS: true,
    ENABLE_SEARCH: true,
  },

  // Theme configuration
  THEME: {
    PRIMARY_COLOR: "#1E88E5",
    SECONDARY_COLOR: "#43A047",
    ACCENT_COLOR: "#FBC02D",
    SUCCESS_COLOR: "#4CAF50",
    WARNING_COLOR: "#FF9800",
    ERROR_COLOR: "#E53935",
    BACKGROUND_LIGHT: "#FFFFFF",
    BACKGROUND_DARK: "#121212",
    TEXT_PRIMARY: "#212121",
    TEXT_SECONDARY: "#757575",
  },
};

// Helper function to check if using API
export const isUsingAPI = () => APP_CONFIG.DATA_SOURCE === "api";

// Helper function to check if using mock data
export const isUsingMock = () => APP_CONFIG.DATA_SOURCE === "mock";

// Helper function to get API base URL
export const getApiBaseUrl = () => APP_CONFIG.API.BASE_URL;

// Helper function to get app currency
export const getAppCurrency = () => APP_CONFIG.APP.CURRENCY;

