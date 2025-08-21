import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync();

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "your-project-id", // Replace with your actual project ID
        })
      ).data;
    } else {
      alert("Must use physical device for Push Notifications");
    }

    setExpoPushToken(token);
  };

  const scheduleDailyReminder = async () => {
    console.log(
      "Notifications not supported in Expo Go - use development build"
    );
    // Mock function for Expo Go compatibility
  };

  const scheduleWeeklyReminder = async () => {
    console.log(
      "Notifications not supported in Expo Go - use development build"
    );
    // Mock function for Expo Go compatibility
  };

  const scheduleMonthlyReminder = async () => {
    console.log(
      "Notifications not supported in Expo Go - use development build"
    );
    // Mock function for Expo Go compatibility
  };

  const sendImmediateNotification = async (title, body, data = {}) => {
    console.log("Notification:", title, body, data);
    // Mock function for Expo Go compatibility
  };

  const cancelAllNotifications = async () => {
    console.log("Notifications cancelled");
    // Mock function for Expo Go compatibility
  };

  const value = {
    expoPushToken,
    notification,
    scheduleDailyReminder,
    scheduleWeeklyReminder,
    scheduleMonthlyReminder,
    sendImmediateNotification,
    cancelAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
