import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import {
  Card,
  Title,
  Button,
  TextInput,
  Divider,
  List,
  Switch as PaperSwitch,
  Snackbar,
  Portal,
  Modal,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDatabase } from "../context/DatabaseContext";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { useSecurity } from "../context/SecurityContext";
import { useSecurityNotice } from "../context/SecurityNoticeContext";
import { useAuth } from "../context/AuthContext";
// TODO: Uncomment when database connection is fixed
// import ApiService from "../services/api";

const SettingsScreen = () => {
  const navigation = useNavigation();
  const {
    getUserSettings,
    saveUserSettings,
    clearOldData,
    exportData,
    backupData,
    getDataUsage,
  } = useDatabase();
  const {
    scheduleDailyReminder,
    scheduleWeeklyReminder,
    scheduleMonthlyReminder,
    notificationSettings,
    updateNotificationSetting,
    cancelAllNotifications,
  } = useNotifications();
  const { theme, isDarkMode, themeMode, setTheme, toggleTheme } = useTheme();
  const {
    pin,
    isBiometricAvailable,
    isBiometricEnabled,
    isSecurityEnabled,
    autoLockEnabled,
    autoLockTimeout,
    toggleBiometric,
    toggleSecurity,
    toggleAutoLock,
    setAutoLockTimeout: setAutoLockTimeoutValue,
    lockApp,
    resetSecurity,
    setAppPin,
  } = useSecurity();
  const {
    showSecurityNotice,
    updateSecurityNoticeSetting,
    resetToDefault,
    forceReset,
    ensureEnabled,
  } = useSecurityNotice();
  const { signOut, user, updateUser, deleteAccount } = useAuth();

  const [userSettings, setUserSettings] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    paymentFrequency: "monthly",
    paymentAmount: "",
    tithingPercentage: "10",
    tithingEnabled: true,
  });

  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [dataUsage, setDataUsage] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    totalRecords: 0,
    databaseSize: "0 KB",
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [isLoading, setIsLoading] = useState(false);
  const [pinSetupVisible, setPinSetupVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinStep, setPinStep] = useState("pin");
  const [localSecurityNotice, setLocalSecurityNotice] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  useEffect(() => {
    loadSettings();
    loadDataUsage();
    loadDataRetention();
    loadProfileImage();
  }, []);

  const loadProfileImage = async () => {
    try {
      // TODO: Database integration when connection is fixed
      // Try to load from database first
      // if (user?.id) {
      //   try {
      //     const response = await ApiService.getUserProfileImage();
      //     if (response.success && response.profileImage) {
      //       setProfileImage(response.profileImage);
      //       // Also save to AsyncStorage for offline access
      //       await AsyncStorage.setItem("profileImage", response.profileImage);
      //       return;
      //     }
      //   } catch (dbError) {
      //     console.error("Failed to load from database:", dbError);
      //     // Continue with AsyncStorage fallback
      //   }
      // }

      // Load from AsyncStorage for now
      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);

        // Save to AsyncStorage for immediate use
        await AsyncStorage.setItem("profileImage", imageUri);

        // TODO: Database integration when connection is fixed
        // Save to database when available
        // if (user?.id) {
        //   try {
        //     await ApiService.updateUserProfileImage(imageUri);
        //     showSnackbar(
        //       "Profile picture saved to database successfully!",
        //       "success"
        //     );
        //   } catch (dbError) {
        //     console.error("Failed to save to database:", dbError);
        //     // Continue with AsyncStorage fallback
        //   }
        // }

        showSnackbar("Profile picture updated successfully!", "success");
      }
    } catch (error) {
      showSnackbar(
        "Failed to update profile picture. Please try again.",
        "error"
      );
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showSnackbar("Camera permission is required to take a photo.", "error");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);

        // Save to AsyncStorage for immediate use
        await AsyncStorage.setItem("profileImage", imageUri);

        // TODO: Database integration when connection is fixed
        // Save to database when available
        // if (user?.id) {
        //   try {
        //     await ApiService.updateUserProfileImage(imageUri);
        //     showSnackbar(
        //       "Profile picture saved to database successfully!",
        //       "success"
        //     );
        //   } catch (dbError) {
        //     console.error("Failed to save to database:", dbError);
        //     // Continue with AsyncStorage fallback
        //   }
        // }

        showSnackbar("Profile picture updated successfully!", "success");
      }
    } catch (error) {
      showSnackbar("Failed to take photo. Please try again.", "error");
    }
  };

  const showImagePickerOptions = () => {
    setIsImagePickerVisible(true);
  };

  const removeProfileImage = async () => {
    try {
      setProfileImage(null);

      // Remove from AsyncStorage
      await AsyncStorage.removeItem("profileImage");

      // TODO: Database integration when connection is fixed
      // Remove from database when available
      // if (user?.id) {
      //   try {
      //     await ApiService.removeUserProfileImage();
      //     showSnackbar(
      //       "Profile picture removed from database successfully!",
      //       "success"
      //     );
      //   } catch (dbError) {
      //     console.error("Failed to remove from database:", dbError);
      //     // Continue with AsyncStorage fallback
      //   }
      // }

      showSnackbar("Profile picture removed successfully!", "success");
    } catch (error) {
      showSnackbar(
        "Failed to remove profile picture. Please try again.",
        "error"
      );
    }
  };

  useEffect(() => {
    if (showSecurityNotice !== undefined) {
      setLocalSecurityNotice(showSecurityNotice);
    }
  }, [showSecurityNotice]);

  useEffect(() => {
    if (showSecurityNotice === undefined) {
      resetToDefault();
    } else if (showSecurityNotice === false) {
      ensureEnabled();
    } else {
      setLocalSecurityNotice(showSecurityNotice);
    }
  }, []);

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await getUserSettings();
      if (settings) {
        setUserSettings(settings);
        setEditForm({
          paymentFrequency: settings.payment_frequency,
          paymentAmount: settings.payment_amount.toString(),
          tithingPercentage: settings.tithing_percentage.toString(),
          tithingEnabled: settings.tithing_enabled === 1,
        });
      }
    } catch (error) {
      showSnackbar("Failed to load settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataUsage = async () => {
    try {
      const usage = await getDataUsage();
      setDataUsage(usage);
    } catch (error) {}
  };

  const loadDataRetention = async () => {
    try {
      const retention = await AsyncStorage.getItem("dataRetentionDays");
      if (retention) {
        setDataRetentionDays(parseInt(retention));
      }
    } catch (error) {}
  };

  const saveDataRetention = async (days) => {
    try {
      await AsyncStorage.setItem("dataRetentionDays", days.toString());
      setDataRetentionDays(days);
    } catch (error) {}
  };

  const handleSecurityToggle = async (enabled) => {
    if (enabled) {
      showSnackbar("Choose security method: Set PIN or Use Biometric", "info");
      const result = await toggleSecurity(true, "pin");
      if (result === "pin") {
        setPinStep("pin");
        setPinInput("");
        setConfirmPinInput("");
        setPinSetupVisible(true);
      }
    } else {
      showSnackbar(
        "Security will be disabled. You can re-enable it anytime.",
        "info"
      );
      await toggleSecurity(false);
      showSnackbar("Security disabled", "info");
    }
  };

  const handlePinSetup = async () => {
    if (pinStep === "pin") {
      if (pinInput.length < 4) {
        showSnackbar("PIN must be at least 4 digits", "error");
        return;
      }
      setPinStep("confirm");
    } else {
      if (pinInput !== confirmPinInput) {
        showSnackbar("PINs do not match. Please try again.", "error");
        setConfirmPinInput("");
        return;
      }

      try {
        const success = await setAppPin(pinInput);
        if (success) {
          showSnackbar("PIN set successfully!", "success");
          setPinSetupVisible(false);
          setPinStep("pin");
          setPinInput("");
          setConfirmPinInput("");
        } else {
          showSnackbar("Failed to set PIN. Please try again.", "error");
        }
      } catch (error) {
        showSnackbar("An error occurred. Please try again.", "error");
      }
    }
  };

  const handlePinManagement = () => {
    if (pin) {
      setPinStep("pin");
      setPinInput("");
      setConfirmPinInput("");
      setPinSetupVisible(true);
    } else {
      setPinStep("pin");
      setPinInput("");
      setConfirmPinInput("");
      setPinSetupVisible(true);
    }
  };

  const handleSecurityNoticeToggle = async (enabled) => {
    if (!enabled) {
      showSnackbar(
        "Security notice must remain enabled for your safety",
        "info"
      );
      return;
    }

    setLocalSecurityNotice(enabled);
    try {
      await updateSecurityNoticeSetting(enabled);
    } catch (error) {
      setLocalSecurityNotice(!enabled);
      showSnackbar("Failed to update security notice setting", "error");
      return;
    }
    showSnackbar(
      enabled ? "Security notice enabled" : "Security notice disabled",
      "info"
    );
  };

  const handleResetSecurity = async () => {
    try {
      await resetSecurity();
      showSnackbar("Security settings reset successfully", "success");
    } catch (error) {
      showSnackbar("Failed to reset security settings", "error");
    }
  };

  const handleForceResetSecurityNotice = async () => {
    try {
      await forceReset();
      showSnackbar("Security notice reset to default successfully", "success");
    } catch (error) {
      showSnackbar("Failed to reset security notice", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!editForm.paymentAmount || parseFloat(editForm.paymentAmount) <= 0) {
      showSnackbar("Please enter a valid payment amount.", "error");
      return;
    }

    if (
      editForm.tithingEnabled &&
      (parseFloat(editForm.tithingPercentage) < 0 ||
        parseFloat(editForm.tithingPercentage) > 100)
    ) {
      showSnackbar(
        "Please enter a valid percentage between 0 and 100.",
        "error"
      );
      return;
    }

    try {
      await saveUserSettings(
        editForm.paymentFrequency,
        parseFloat(editForm.paymentAmount),
        parseFloat(editForm.tithingPercentage),
        editForm.tithingEnabled
      );

      setUserSettings({
        ...userSettings,
        payment_frequency: editForm.paymentFrequency,
        payment_amount: parseFloat(editForm.paymentAmount),
        tithing_percentage: parseFloat(editForm.tithingPercentage),
        tithing_enabled: editForm.tithingEnabled ? 1 : 0,
      });

      setEditMode(false);
      showSnackbar("Settings updated successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to save settings. Please try again.", "error");
    }
  };

  const handleClearOldData = async () => {
    try {
      await clearOldData(dataRetentionDays);
      showSnackbar("Old data cleared successfully!", "success");
      loadDataUsage();
    } catch (error) {
      showSnackbar("Failed to clear old data. Please try again.", "error");
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      showSnackbar("Data exported successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to export data. Please try again.", "error");
    }
  };

  const handleBackupData = async () => {
    try {
      const data = await backupData();
      showSnackbar("Data backed up successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to backup data. Please try again.", "error");
    }
  };

  const handleResetApp = async () => {
    try {
      await clearOldData(0);
      await resetSecurity();
      await cancelAllNotifications();

      // Use the deleteAccount function from AuthContext
      const result = await deleteAccount();

      if (result.success) {
        showSnackbar("App reset complete! Please restart the app.", "success");

        setTimeout(() => {
          navigation.replace("SignUp");
        }, 2000);
      } else {
        showSnackbar("Failed to reset app. Please try again.", "error");
      }
    } catch (error) {
      showSnackbar("Failed to reset app. Please try again.", "error");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showSnackbar("Signed out successfully", "success");
      navigation.reset({
        index: 0,
        routes: [{ name: "SignIn" }],
      });
    } catch (error) {
      showSnackbar("Error signing out", "error");
    }
  };

  const calculateTithing = () => {
    if (!editForm.paymentAmount || !editForm.tithingEnabled) return 0;
    const amount = parseFloat(editForm.paymentAmount);
    const percentage = parseFloat(editForm.tithingPercentage);
    return (amount * percentage) / 100;
  };

  const calculateRemaining = () => {
    if (!editForm.paymentAmount) return 0;
    const amount = parseFloat(editForm.paymentAmount);
    const tithing = calculateTithing();
    return amount - tithing;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return labels[frequency] || frequency;
  };

  const handleProfileEdit = () => {
    setProfileEditMode(true);
    setProfileForm({
      username: user?.username || "",
      email: user?.email || "",
    });
  };

  const handleProfileCancel = async () => {
    setProfileEditMode(false);
    await loadSettings(); // Reload settings to revert profile form
  };

  const handleProfileSave = async () => {
    if (!profileForm.username) {
      showSnackbar("Username cannot be empty.", "error");
      return;
    }
    if (!profileForm.email || !profileForm.email.includes("@")) {
      showSnackbar("Please enter a valid email address.", "error");
      return;
    }

    try {
      // Update user profile using AuthContext
      const result = await updateUser({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      });

      if (result.success) {
        showSnackbar("Profile updated successfully!", "success");
        setProfileEditMode(false);
      } else {
        showSnackbar("Failed to update profile", "error");
      }
    } catch (error) {
      showSnackbar("Failed to save profile. Please try again.", "error");
    }
  };

  const handlePinChange = () => {
    setPinStep("pin");
    setPinInput("");
    setConfirmPinInput("");
    setPinSetupVisible(true);
  };

  const handleCurrencyChange = async (currency) => {
    try {
      await AsyncStorage.setItem("defaultCurrency", currency);
      setDefaultCurrency(currency);
      setShowCurrencyModal(false);
      showSnackbar(`Default currency set to ${currency}`, "success");
    } catch (error) {
      showSnackbar("Failed to update currency", "error");
    }
  };

  const handlePaymentMethodChange = async (method) => {
    try {
      await AsyncStorage.setItem("defaultPaymentMethod", method);
      setDefaultPaymentMethod(method);
      setShowPaymentMethodModal(false);
      showSnackbar(`Default payment method set to ${method}`, "success");
    } catch (error) {
      showSnackbar("Failed to update payment method", "error");
    }
  };

  const handleStartOfWeekChange = async (day) => {
    try {
      await AsyncStorage.setItem("startOfWeek", day);
      setStartOfWeek(day);
      setShowStartOfWeekModal(false);
      showSnackbar(`Start of week set to ${day}`, "success");
    } catch (error) {
      showSnackbar("Failed to update start of week", "error");
    }
  };

  const loadAppPreferences = async () => {
    try {
      const currency = await AsyncStorage.getItem("defaultCurrency");
      const paymentMethod = await AsyncStorage.getItem("defaultPaymentMethod");
      const weekStart = await AsyncStorage.getItem("startOfWeek");
      
      if (currency) setDefaultCurrency(currency);
      if (paymentMethod) setDefaultPaymentMethod(paymentMethod);
      if (weekStart) setStartOfWeek(weekStart);
    } catch (error) {
      console.error("Error loading app preferences:", error);
    }
  };

  const handleManageCategories = () => {
    setShowCategoriesModal(true);
  };

  const handleManagePaymentMethods = () => {
    setShowPaymentMethodsModal(true);
  };

  const handleHelpCenter = () => {
    setShowHelpModal(true);
  };

  const handleContactUs = () => {
    setShowContactModal(true);
  };

  const handleTutorial = () => {
    setShowTutorialModal(true);
  };

  const handleSendFeedback = () => {
    setShowFeedbackModal(true);
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacyModal(true);
  };

  const handleTermsOfService = () => {
    setShowTermsModal(true);
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Settings</Text>
            {/* <Text style={styles.headerSubtitle}>
              {isLoading ? "Loading..." : "Manage your preferences"}
            </Text> */}
          </View>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={showImagePickerOptions}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileInitials}>
                <Text style={styles.profileInitialsText}>
                  {user?.username
                    ? user.username.substring(0, 2).toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.contentContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Payment Settings
                </Title>
                <Button
                  mode={editMode ? "contained" : "outlined"}
                  onPress={() => setEditMode(!editMode)}
                  compact
                >
                  {editMode ? "Save" : "Edit"}
                </Button>
              </View>

              {editMode ? (
                <View>
                  <View style={styles.frequencyContainer}>
                    <Text style={styles.label}>Payment Frequency</Text>
                    <View style={styles.frequencyButtons}>
                      {["daily", "weekly", "monthly"].map((freq) => (
                        <Button
                          key={freq}
                          mode={
                            editForm.paymentFrequency === freq
                              ? "contained"
                              : "outlined"
                          }
                          onPress={() =>
                            setEditForm({ ...editForm, paymentFrequency: freq })
                          }
                          style={styles.frequencyButton}
                          compact
                        >
                          {getFrequencyLabel(freq)}
                        </Button>
                      ))}
                    </View>
                  </View>

                  <TextInput
                    label="Payment Amount"
                    value={editForm.paymentAmount}
                    onChangeText={(text) =>
                      setEditForm({ ...editForm, paymentAmount: text })
                    }
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                    placeholder="Enter your payment amount"
                  />

                  <View style={styles.tithingContainer}>
                    <View style={styles.tithingHeader}>
                      <Text style={styles.label}>Tithing</Text>
                      <PaperSwitch
                        value={editForm.tithingEnabled}
                        onValueChange={(value) =>
                          setEditForm({ ...editForm, tithingEnabled: value })
                        }
                        color="#2196F3"
                      />
                    </View>

                    {editForm.tithingEnabled && (
                      <TextInput
                        label="Tithing Percentage"
                        value={editForm.tithingPercentage}
                        onChangeText={(text) =>
                          setEditForm({ ...editForm, tithingPercentage: text })
                        }
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                        placeholder="10"
                        right={<TextInput.Affix text="%" />}
                      />
                    )}
                  </View>

                  {editForm.paymentAmount && (
                    <Card style={styles.summaryCard}>
                      <Card.Content>
                        <Title style={styles.summaryTitle}>Summary</Title>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>
                            Payment Amount:
                          </Text>
                          <Text style={styles.summaryValue}>
                            $
                            {parseFloat(editForm.paymentAmount || 0).toFixed(2)}
                          </Text>
                        </View>
                        {editForm.tithingEnabled && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Tithing ({editForm.tithingPercentage}%):
                            </Text>
                            <Text style={styles.summaryValue}>
                              -${calculateTithing().toFixed(2)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>
                            Available for Expenses:
                          </Text>
                          <Text
                            style={[styles.summaryValue, styles.remainingValue]}
                          >
                            ${calculateRemaining().toFixed(2)}
                          </Text>
                        </View>
                      </Card.Content>
                    </Card>
                  )}

                  <View style={styles.editButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setEditMode(false);
                        loadSettings();
                      }}
                      style={styles.editButton}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSaveSettings}
                      style={styles.editButton}
                    >
                      Save Changes
                    </Button>
                  </View>
                </View>
              ) : (
                <View>
                  <List.Item
                    title="Payment Frequency"
                    description={getFrequencyLabel(
                      userSettings?.payment_frequency
                    )}
                    left={(props) => (
                      <List.Icon {...props} icon="calendar-month" />
                    )}
                  />
                  <Divider style={styles.itemDivider} />
                  <List.Item
                    title="Payment Amount"
                    left={(props) => (
                      <List.Icon {...props} icon="currency-usd" />
                    )}
                  />
                  <Divider style={styles.itemDivider} />
                  <List.Item
                    title="Tithing"
                    left={(props) => <List.Icon {...props} icon="church" />}
                  />
                </View>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                Notifications
              </Title>
              <List.Item
                title="Daily Reminders"
                left={(props) => <List.Icon {...props} icon="bell" />}
                right={() => (
                  <Switch
                    value={notificationSettings.daily}
                    onValueChange={(value) =>
                      updateNotificationSetting("daily", value)
                    }
                    color="#2196F3"
                  />
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Weekly Summaries"
                left={(props) => <List.Icon {...props} icon="view-week" />}
                right={() => (
                  <Switch
                    value={notificationSettings.weekly}
                    onValueChange={(value) =>
                      updateNotificationSetting("weekly", value)
                    }
                    color="#2196F3"
                  />
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Monthly Summaries"
                left={(props) => <List.Icon {...props} icon="calendar-month" />}
                right={() => (
                  <Switch
                    value={notificationSettings.monthly}
                    onValueChange={(value) =>
                      updateNotificationSetting("monthly", value)
                    }
                    color="#2196F3"
                  />
                )}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                Data Management
              </Title>

              <List.Item
                title="Data Retention"
                description={`Keep expenses for ${dataRetentionDays} days`}
                left={(props) => <List.Icon {...props} icon="database" />}
              />

              <View style={styles.retentionSlider}>
                <Text
                  style={[
                    styles.retentionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Days to keep data:
                </Text>
                <View style={styles.retentionButtons}>
                  {[30, 90, 180, 365].map((days) => (
                    <Button
                      key={days}
                      mode={
                        dataRetentionDays === days ? "contained" : "outlined"
                      }
                      onPress={() => saveDataRetention(days)}
                      compact
                      style={styles.retentionButton}
                    >
                      {days}
                    </Button>
                  ))}
                </View>
              </View>

              <Divider style={styles.itemDivider} />

              <List.Item
                title="Export Data"
                description="Download all data as JSON"
                left={(props) => <List.Icon {...props} icon="download" />}
                right={() => (
                  <Button mode="outlined" compact onPress={handleExportData}>
                    Export
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Backup & Restore"
                description="Create backup of your data"
                left={(props) => <List.Icon {...props} icon="backup-restore" />}
                right={() => (
                  <Button mode="outlined" compact onPress={handleBackupData}>
                    Backup
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Data Usage"
                description={`${dataUsage.totalRecords} records (${dataUsage.databaseSize})`}
                left={(props) => <List.Icon {...props} icon="cloud-download" />}
                right={() => (
                  <Button mode="outlined" compact onPress={loadDataUsage}>
                    Refresh
                  </Button>
                )}
              />

              <Divider style={styles.divider} />

              <Button
                mode="outlined"
                onPress={handleClearOldData}
                style={styles.dangerButton}
                textColor="#F44336"
              >
                Clear Old Data
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                Account Settings
              </Title>

              {profileEditMode ? (
                <View>
                  <TextInput
                    label="Username"
                    value={profileForm.username}
                    onChangeText={(text) =>
                      setProfileForm({ ...profileForm, username: text })
                    }
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="account" />}
                  />

                  <TextInput
                    label="Email"
                    value={profileForm.email}
                    onChangeText={(text) =>
                      setProfileForm({ ...profileForm, email: text })
                    }
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="email" />}
                  />

                  <View style={styles.editButtons}>
                    <Button
                      mode="outlined"
                      onPress={handleProfileCancel}
                      style={styles.editButton}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleProfileSave}
                      style={styles.editButton}
                    >
                      Save Changes
                    </Button>
                  </View>
                </View>
              ) : (
                <>
                  <List.Item
                    title="Username"
                    description={user?.username || "Not set"}
                    left={(props) => <List.Icon {...props} icon="account" />}
                    right={() => (
                      <Button
                        mode="outlined"
                        compact
                        onPress={handleProfileEdit}
                      >
                        Edit
                      </Button>
                    )}
                  />
                  <Divider style={styles.itemDivider} />
                  <List.Item
                    title="Email"
                    description={user?.email || "Not set"}
                    left={(props) => <List.Icon {...props} icon="email" />}
                    right={() => (
                      <Button
                        mode="outlined"
                        compact
                        onPress={handleProfileEdit}
                      >
                        Edit
                      </Button>
                    )}
                  />
                  <Divider style={styles.itemDivider} />
                  <List.Item
                    title="Authentication Method"
                    description="PIN"
                    left={(props) => <List.Icon {...props} icon="lock" />}
                    right={() => (
                      <Button mode="outlined" compact onPress={handlePinChange}>
                        Change PIN
                      </Button>
                    )}
                  />
                </>
              )}

              <Divider style={styles.divider} />

              <Text style={styles.infoText}>
                Sign Out: Temporarily sign out, your account data is preserved.
              </Text>
              <Text style={styles.infoText}>
                Delete Account: Permanently removes all your data and account.
              </Text>

              <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.dangerButton}
                textColor="#F44336"
              >
                Sign Out
              </Button>

              <View style={styles.divider} />

              <Button
                mode="outlined"
                onPress={handleResetApp}
                style={styles.dangerButton}
                textColor="#FF9800"
              >
                Delete Account & Reset App
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                App Preferences
              </Title>
              <List.Item
                title="Default Currency"
                description={defaultCurrency}
                left={(props) => <List.Icon {...props} icon="currency-usd" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => setShowCurrencyModal(true)}>
                    Change
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Default Payment Method"
                description={defaultPaymentMethod}
                left={(props) => <List.Icon {...props} icon="credit-card" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => setShowPaymentMethodModal(true)}>
                    Change
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Theme"
                left={(props) => (
                  <List.Icon {...props} icon="theme-light-dark" />
                )}
                right={() => (
                  <View style={styles.themeButtons}>
                    <Button
                      mode={themeMode === "light" ? "contained" : "outlined"}
                      compact
                      onPress={() => setTheme("light")}
                      style={styles.themeButton}
                    >
                      Light
                    </Button>
                    <Button
                      mode={themeMode === "dark" ? "contained" : "outlined"}
                      compact
                      onPress={() => setTheme("dark")}
                      style={styles.themeButton}
                    >
                      Dark
                    </Button>
                    <Button
                      mode={themeMode === "system" ? "contained" : "outlined"}
                      compact
                      onPress={() => setTheme("system")}
                      style={styles.themeButton}
                    >
                      Auto
                    </Button>
                  </View>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Start of Week"
                description={startOfWeek.charAt(0).toUpperCase() + startOfWeek.slice(1)}
                left={(props) => <List.Icon {...props} icon="view-week" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => setShowStartOfWeekModal(true)}>
                    Change
                  </Button>
                )}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                Security & Privacy
              </Title>

              <List.Item
                title="App Security"
                description={isSecurityEnabled ? "Enabled" : "Disabled"}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="shield-check"
                    color={theme.colors.primary}
                  />
                )}
                right={() => (
                  <Switch
                    value={isSecurityEnabled}
                    onValueChange={handleSecurityToggle}
                    color={theme.colors.primary}
                  />
                )}
              />
              <Divider style={styles.itemDivider} />

              <List.Item
                title="Show Security Notice"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="bell-outline"
                    color={theme.colors.primary}
                  />
                )}
                right={() => (
                  <Switch
                    value={localSecurityNotice}
                    onValueChange={handleSecurityNoticeToggle}
                    color={theme.colors.primary}
                  />
                )}
              />

              <View style={styles.securityNoticeResetContainer}>
                <Button
                  mode="outlined"
                  onPress={handleForceResetSecurityNotice}
                  compact
                  textColor={theme.colors.warning}
                  outlineColor={theme.colors.warning}
                  style={styles.securityNoticeResetButton}
                >
                  Reset to Default (ON)
                </Button>
              </View>

              {isSecurityEnabled && (
                <>
                  <List.Item
                    title="PIN Lock"
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="lock"
                        color={theme.colors.primary}
                      />
                    )}
                    right={() => (
                      <Button
                        mode="outlined"
                        compact
                        onPress={() => handlePinManagement()}
                        textColor={theme.colors.primary}
                        outlineColor={theme.colors.primary}
                      >
                        {pin ? "Change" : "Set"}
                      </Button>
                    )}
                  />
                  <Divider style={styles.itemDivider} />

                  {isBiometricAvailable && (
                    <List.Item
                      title="Biometric Lock"
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon="fingerprint"
                          color={theme.colors.primary}
                        />
                      )}
                      right={() => (
                        <Switch
                          value={isBiometricEnabled}
                          onValueChange={toggleBiometric}
                          color={theme.colors.primary}
                        />
                      )}
                    />
                  )}
                  {isBiometricAvailable && (
                    <Divider style={styles.itemDivider} />
                  )}

                  <List.Item
                    title="Auto Lock"
                    description={`Lock app after ${autoLockTimeout} minutes of inactivity`}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="clock-outline"
                        color={theme.colors.primary}
                      />
                    )}
                    right={() => (
                      <Switch
                        value={autoLockEnabled}
                        onValueChange={toggleAutoLock}
                        color={theme.colors.primary}
                      />
                    )}
                  />

                  {autoLockEnabled && (
                    <View style={styles.autoLockContainer}>
                      <Text style={styles.autoLockLabel}>
                        Timeout (minutes):
                      </Text>
                      <View style={styles.autoLockButtons}>
                        {[1, 5, 15, 30].map((minutes) => (
                          <Button
                            key={minutes}
                            mode={
                              autoLockTimeout === minutes
                                ? "contained"
                                : "outlined"
                            }
                            onPress={() => setAutoLockTimeoutValue(minutes)}
                            compact
                            style={styles.autoLockButton}
                          >
                            {minutes}
                          </Button>
                        ))}
                      </View>
                    </View>
                  )}
                  <Divider style={styles.itemDivider} />

                  <List.Item
                    title="Lock App Now"
                    description="Immediately lock the app"
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="lock-clock"
                        color={theme.colors.primary}
                      />
                    )}
                    right={() => (
                      <Button
                        mode="outlined"
                        compact
                        onPress={lockApp}
                        textColor={theme.colors.error}
                        outlineColor={theme.colors.error}
                      >
                        Lock
                      </Button>
                    )}
                  />
                  <Divider style={styles.itemDivider} />

                  <List.Item
                    title="Reset Security"
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="security"
                        color={theme.colors.warning}
                      />
                    )}
                    right={() => (
                      <Button
                        mode="outlined"
                        compact
                        onPress={handleResetSecurity}
                        textColor={theme.colors.warning}
                        outlineColor={theme.colors.warning}
                      >
                        Reset
                      </Button>
                    )}
                  />
                  <Divider style={styles.itemDivider} />

                  <List.Item
                    title="Privacy Policy"
                    description="View privacy policy"
                    left={(props) => (
                      <List.Icon {...props} icon="shield-account" />
                    )}
                    right={() => (
                      <Button mode="outlined" compact onPress={handlePrivacyPolicy}>
                        View
                      </Button>
                    )}
                  />
                  <Divider style={styles.itemDivider} />

                  <List.Item
                    title="Terms of Service"
                    description="View terms"
                    left={(props) => (
                      <List.Icon {...props} icon="file-document" />
                    )}
                    right={() => (
                      <Button mode="outlined" compact onPress={handleTermsOfService}>
                        View
                      </Button>
                    )}
                  />
                </>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                Categories & Payment Methods
              </Title>
              <List.Item
                title="Manage Categories"
                left={(props) => <List.Icon {...props} icon="tag-multiple" />}
                right={() => (
                  <Button mode="outlined" compact onPress={handleManageCategories}>
                    Manage
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Payment Methods"
                left={(props) => (
                  <List.Icon {...props} icon="credit-card-multiple" />
                )}
                right={() => (
                  <Button mode="outlined" compact onPress={handleManagePaymentMethods}>
                    Manage
                  </Button>
                )}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                Help & Support
              </Title>
              <List.Item
                title="Help Center"
                left={(props) => <List.Icon {...props} icon="help-circle" />}
                right={() => (
                  <Button mode="outlined" compact onPress={handleHelpCenter}>
                    Open
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Contact Us"
                left={(props) => <List.Icon {...props} icon="message" />}
                right={() => (
                  <Button mode="outlined" compact onPress={handleContactUs}>
                    Contact
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Tutorial"
                left={(props) => <List.Icon {...props} icon="play-circle" />}
                right={() => (
                  <Button mode="outlined" compact onPress={handleTutorial}>
                    Replay
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Send Feedback"
                left={(props) => <List.Icon {...props} icon="comment-text" />}
                right={() => (
                  <Button mode="outlined" compact onPress={handleSendFeedback}>
                    Send
                  </Button>
                )}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                App Information
              </Title>
              <List.Item
                title="Version"
                description={Constants.expoConfig?.version || "1.0.0"}
                left={(props) => <List.Icon {...props} icon="information" />}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Build"
                description={
                  Constants.expoConfig?.runtimeVersion || "Development"
                }
                left={(props) => <List.Icon {...props} icon="code-braces" />}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Database"
                description="SQLite Local Database"
                left={(props) => <List.Icon {...props} icon="database" />}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                App Reset
              </Title>
              <Text style={styles.warningText}>
                Warning: This will delete all your data and reset the app to its
                initial state.
              </Text>
              <View style={styles.resetButtons}>
                <Button
                  mode="outlined"
                  onPress={handleResetApp}
                  style={styles.dangerButton}
                  textColor="#F44336"
                >
                  Reset App
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleSignOut}
                  style={styles.dangerButton}
                  textColor="#FF9800"
                >
                  Sign Out
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Portal>
            <Modal
              visible={pinSetupVisible}
              onDismiss={() => setPinSetupVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    {pinStep === "pin" ? "Set Your PIN" : "Confirm Your PIN"}
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    {pinStep === "pin"
                      ? "Choose a 4-6 digit PIN to secure your app"
                      : "Re-enter your PIN to confirm"}
                  </Text>

                  <TextInput
                    label={pinStep === "pin" ? "Enter PIN" : "Confirm PIN"}
                    value={pinStep === "pin" ? pinInput : confirmPinInput}
                    onChangeText={
                      pinStep === "pin" ? setPinInput : setConfirmPinInput
                    }
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.modalInput}
                    placeholder="PIN"
                    maxLength={6}
                    secureTextEntry
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.textSecondary}
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                  />

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setPinSetupVisible(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handlePinSetup}
                      disabled={
                        (pinStep === "pin" && pinInput.length < 4) ||
                        (pinStep === "confirm" && confirmPinInput.length < 4)
                      }
                      style={styles.modalButton}
                      buttonColor={theme.colors.primary}
                      textColor="#FFFFFF"
                    >
                      {pinStep === "pin" ? "Continue" : "Set PIN"}
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          <Portal>
            <Modal
              visible={isImagePickerVisible}
              onDismiss={() => setIsImagePickerVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    Update Profile Picture
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    Choose how you want to update your profile picture
                  </Text>

                  <View style={styles.imagePickerButtons}>
                    <Button
                      mode="contained"
                      onPress={() => {
                        takePhoto();
                        setIsImagePickerVisible(false);
                      }}
                      style={styles.imagePickerButton}
                      buttonColor="#4CAF50"
                      textColor="#FFFFFF"
                      icon="camera"
                    >
                      Take Photo
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => {
                        pickImage();
                        setIsImagePickerVisible(false);
                      }}
                      style={styles.imagePickerButton}
                      buttonColor="#2196F3"
                      textColor="#FFFFFF"
                      icon="image"
                    >
                      Choose from Gallery
                    </Button>
                    {profileImage && (
                      <Button
                        mode="outlined"
                        onPress={() => {
                          removeProfileImage();
                          setIsImagePickerVisible(false);
                        }}
                        style={styles.imagePickerButton}
                        textColor="#F44336"
                        outlineColor="#F44336"
                        icon="delete"
                      >
                        Remove Picture
                      </Button>
                    )}
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setIsImagePickerVisible(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={hideSnackbar}
            duration={3000}
            style={{
              backgroundColor:
                snackbarType === "success"
                  ? "#4CAF50"
                  : snackbarType === "error"
                    ? "#F44336"
                    : "#2196F3",
            }}
            action={{
              label: "Dismiss",
              onPress: hideSnackbar,
            }}
          >
            {snackbarMessage}
          </Snackbar>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    top: 7,
  },
  profileImageContainer: {
    position: "relative",
    marginLeft: 15,
    bottom: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  profileInitials: {
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  profileInitialsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  editIconContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  card: {
    margin: 10,
    marginTop: 5,
    marginBottom: 15,
    elevation: 4,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  frequencyContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  frequencyButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  frequencyButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  tithingContainer: {
    marginBottom: 20,
  },
  tithingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  remainingValue: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "bold",
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  editButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  retentionSlider: {
    marginVertical: 15,
  },
  retentionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  retentionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  retentionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 20,
  },
  dangerButton: {
    borderColor: "#F44336",
    marginTop: 10,
  },
  warningText: {
    fontSize: 14,
    color: "#F44336",
    marginBottom: 15,
    textAlign: "center",
    fontStyle: "italic",
  },
  themeButtons: {
    flexDirection: "row",
    gap: 5,
  },
  themeButton: {
    minWidth: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    elevation: 8,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
  },
  imagePickerButtons: {
    marginBottom: 20,
    gap: 15,
  },
  imagePickerButton: {
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 20,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  itemDivider: {
    marginVertical: 10,
    backgroundColor: "#BDBDBD",
    height: 1.5,
  },
  resetButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  autoLockContainer: {
    marginVertical: 15,
    paddingHorizontal: 16,
  },
  autoLockLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  autoLockButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  autoLockButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  securityNoticeResetContainer: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  securityNoticeResetButton: {
    alignSelf: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
});

export default SettingsScreen;
