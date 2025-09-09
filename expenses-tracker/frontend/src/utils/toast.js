import Toast from "react-native-toast-message";

export const showToast = (type, title, message) => {
  Toast.show({
    type: type, // 'success', 'error', 'info'
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 5000,
    autoHide: true,
    topOffset: 60,
    text1Style: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#000000",
    },
    text2Style: {
      fontSize: 14,
      color: "#333333",
    },
    style: {
      backgroundColor:
        type === "error"
          ? "#ffebee"
          : type === "success"
            ? "#e8f5e8"
            : "#e3f2fd",
      borderLeftWidth: 4,
      borderLeftColor:
        type === "error"
          ? "#f44336"
          : type === "success"
            ? "#4caf50"
            : "#2196f3",
    },
  });
};

export const showNetworkError = () => {
  showToast(
    "error",
    "No Internet Connection",
    "Please check your internet connection and try again"
  );
};

export const showSuccess = (title, message) => {
  showToast("success", title, message);
};

export const showError = (title, message) => {
  showToast("error", title, message);
};

export const showInfo = (title, message) => {
  showToast("info", title, message);
};
