// API Configuration for different environments
import { Platform } from "react-native";

// Determine the correct API base URL based on platform and environment
const getApiBaseUrl = () => {
  // For development, use local IP address for mobile devices
  if (__DEV__) {
    // Use your computer's local IP address for mobile development
    // You can change this to match your network configuration
    const LOCAL_IP = "172.20.10.2";
    const PORT = "3000";

    if (Platform.OS === "web") {
      // Web development - use localhost
      return `http://localhost:${PORT}/api`;
    } else {
      // Mobile development - use local IP
      return `http://${LOCAL_IP}:${PORT}/api`;
    }
  }

  // Production - use your production API URL
  return "https://your-production-api.com/api";
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
};
