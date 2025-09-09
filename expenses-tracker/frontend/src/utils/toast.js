import Toast from "react-native-toast-message";

export const showToast = (type, title, message) => {
  Toast.show({
    type: type, // 'success', 'error', 'info'
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 60,
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
