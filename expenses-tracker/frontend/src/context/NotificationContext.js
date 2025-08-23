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
  const [notificationSettings, setNotificationSettings] = useState({
    daily: false,
    weekly: false,
    monthly: false,
  });

  useEffect(() => {
    registerForPushNotificationsAsync();
    loadNotificationSettings();

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

    try {
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
          console.log(
            "Push notification permission denied - this is normal for development"
          );
          console.log(
            "Users can enable notifications later in the app settings"
          );
          return;
        }

        // Check if project ID is set
        const projectId = process.env.EXPO_PROJECT_ID || "your-project-id";
        if (projectId === "your-project-id") {
          console.log(
            "Warning: EXPO_PROJECT_ID not set. Push notifications may not work."
          );
          console.log(
            "Please set EXPO_PROJECT_ID in your .env file or replace the placeholder."
          );
          return;
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;

        console.log("Push token obtained successfully:", token);
      } else {
        console.log(
          "Push notifications require a physical device - working in simulator/emulator"
        );
      }
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      if (error.message?.includes("projectId")) {
        console.error(
          "Make sure EXPO_PROJECT_ID is set correctly in your environment variables"
        );
      }
      // Don't crash the app - just log the error
      console.log("Push notifications will be disabled due to error");
    }

    setExpoPushToken(token);
  };

  const scheduleDailyReminder = async (enabled = true) => {
    try {
      if (!enabled) {
        await Notifications.cancelScheduledNotificationAsync("daily-reminder");
        return true;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Daily Expense Reminder",
          body: "Don't forget to log your expenses today!",
          data: { type: "daily-reminder" },
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
        identifier: "daily-reminder",
      });
      return true;
    } catch (error) {
      console.log("Error scheduling daily reminder:", error);
      return false;
    }
  };

  const scheduleWeeklyReminder = async (enabled = true) => {
    try {
      if (!enabled) {
        await Notifications.cancelScheduledNotificationAsync("weekly-reminder");
        return true;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Weekly Summary",
          body: "Review your spending for this week",
          data: { type: "weekly-reminder" },
        },
        trigger: {
          weekday: 1, // Monday
          hour: 9,
          minute: 0,
          repeats: true,
        },
        identifier: "weekly-reminder",
      });
      return true;
    } catch (error) {
      console.log("Error scheduling weekly reminder:", error);
      return false;
    }
  };

  const scheduleMonthlyReminder = async (enabled = true) => {
    try {
      if (!enabled) {
        await Notifications.cancelScheduledNotificationAsync(
          "monthly-reminder"
        );
        return true;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Monthly Summary",
          body: "Review your spending for this month",
          data: { type: "monthly-reminder" },
        },
        trigger: {
          day: 1, // First day of month
          hour: 10,
          minute: 0,
          repeats: true,
        },
        identifier: "monthly-reminder",
      });
      return true;
    } catch (error) {
      console.log("Error scheduling monthly reminder:", error);
      return false;
    }
  };

  const sendImmediateNotification = async (title, body, data = {}) => {
    console.log("Notification:", title, body, data);
    // Mock function for Expo Go compatibility
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("All notifications cancelled");
      return true;
    } catch (error) {
      console.log("Error cancelling notifications:", error);
      return false;
    }
  };

  const updateNotificationSetting = async (type, enabled) => {
    try {
      setNotificationSettings((prev) => ({ ...prev, [type]: enabled }));

      switch (type) {
        case "daily":
          await scheduleDailyReminder(enabled);
          break;
        case "weekly":
          await scheduleWeeklyReminder(enabled);
          break;
        case "monthly":
          await scheduleMonthlyReminder(enabled);
          break;
      }

      return true;
    } catch (error) {
      console.log("Error updating notification setting:", error);
      return false;
    }
  };

  const loadNotificationSettings = async () => {
    try {
      // For now, we'll use the local state since getScheduledNotificationAsync
      // is not available in this version of expo-notifications
      // TODO: Implement proper notification status checking when upgrading expo-notifications
      console.log("Loading notification settings from local state");

      // Set default values - these will be updated when user toggles them
      setNotificationSettings({
        daily: false,
        weekly: false,
        monthly: false,
      });
    } catch (error) {
      console.log("Error loading notification settings:", error);
    }
  };

  const value = {
    expoPushToken,
    notification,
    notificationSettings,
    scheduleDailyReminder,
    scheduleWeeklyReminder,
    scheduleMonthlyReminder,
    sendImmediateNotification,
    cancelAllNotifications,
    updateNotificationSetting,
    loadNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
