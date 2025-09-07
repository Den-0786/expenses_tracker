// Environment Configuration
// This file helps manage different environments (development, production)

export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
};

// Current environment - change this to switch between dev and production
export const CURRENT_ENVIRONMENT = __DEV__
  ? ENVIRONMENTS.DEVELOPMENT
  : ENVIRONMENTS.PRODUCTION;

// API URLs for different environments
export const API_URLS = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    // For development, you can use localhost or your local IP
    LOCALHOST: "http://localhost:3000/api",
    LOCAL_IP: "http://172.20.10.2:3000/api",
  },
  [ENVIRONMENTS.PRODUCTION]: {
    // Your Render production URL
    RENDER: "https://expenses-tracker-backend-wpui.onrender.com/api",
  },
};

// Get the appropriate API URL based on current environment
export const getApiUrl = () => {
  if (CURRENT_ENVIRONMENT === ENVIRONMENTS.DEVELOPMENT) {
    // In development, you can choose between localhost or local IP
    // Change this to API_URLS[ENVIRONMENTS.DEVELOPMENT].LOCAL_IP if using mobile device
    return API_URLS[ENVIRONMENTS.DEVELOPMENT].LOCALHOST;
  }

  // Production environment
  return API_URLS[ENVIRONMENTS.PRODUCTION].RENDER;
};

// Helper functions
export const isDevelopment = () =>
  CURRENT_ENVIRONMENT === ENVIRONMENTS.DEVELOPMENT;
export const isProduction = () =>
  CURRENT_ENVIRONMENT === ENVIRONMENTS.PRODUCTION;
