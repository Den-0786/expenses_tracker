import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
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
  const { signOut, user } = useAuth();

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
  const [pinStep, setPinStep] = useState("pin"); // "pin" or "confirm"
  const [localSecurityNotice, setLocalSecurityNotice] = useState(true); // Enable by default

  useEffect(() => {
    loadSettings();
    loadDataUsage();
    loadDataRetention();
  }, []);

  useEffect(() => {
    // Sync local state with context state
    if (showSecurityNotice !== undefined) {
      setLocalSecurityNotice(showSecurityNotice);
    }
  }, [showSecurityNotice]);

  // Initialize security notice on mount
  useEffect(() => {
    if (showSecurityNotice === undefined) {
      console.log("Security notice undefined, resetting to default");
      resetToDefault();
    } else if (showSecurityNotice === false) {
      console.log("Security notice is false, ensuring it's enabled");
      ensureEnabled();
    } else {
      console.log("Security notice initialized with:", showSecurityNotice);
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
      console.error("Error loading settings:", error);
      showSnackbar("Failed to load settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataUsage = async () => {
    try {
      const usage = await getDataUsage();
      setDataUsage(usage);
    } catch (error) {
      console.error("Error loading data usage:", error);
    }
  };

  const loadDataRetention = async () => {
    try {
      const retention = await AsyncStorage.getItem("dataRetentionDays");
      if (retention) {
        setDataRetentionDays(parseInt(retention));
      }
    } catch (error) {
      console.error("Error loading data retention:", error);
    }
  };

  const saveDataRetention = async (days) => {
    try {
      await AsyncStorage.setItem("dataRetentionDays", days.toString());
      setDataRetentionDays(days);
    } catch (error) {
      console.error("Error saving data retention:", error);
    }
  };

  const handleSecurityToggle = async (enabled) => {
    if (enabled) {
      // User is enabling security - show method selection
      showSnackbar("Choose security method: Set PIN or Use Biometric", "info");
      // For now, default to PIN setup since we can't show multiple options in toast
      const result = await toggleSecurity(true, "pin");
      if (result === "pin") {
        // Show PIN setup modal
        setPinStep("pin");
        setPinInput("");
        setConfirmPinInput("");
        setPinSetupVisible(true);
      }
    } else {
      // User is disabling security
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
      // First step: validate PIN and move to confirmation
      if (pinInput.length < 4) {
        showSnackbar("PIN must be at least 4 digits", "error");
        return;
      }
      setPinStep("confirm");
    } else {
      // Second step: confirm PIN
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
      // Change existing PIN
      setPinStep("pin");
      setPinInput("");
      setConfirmPinInput("");
      setPinSetupVisible(true);
    } else {
      // Set new PIN
      setPinStep("pin");
      setPinInput("");
      setConfirmPinInput("");
      setPinSetupVisible(true);
    }
  };

  const handleSecurityNoticeToggle = async (enabled) => {
    console.log("Toggling security notice to:", enabled);
    console.log("Current showSecurityNotice from context:", showSecurityNotice);
    console.log("Current localSecurityNotice:", localSecurityNotice);

    // Always keep security notice enabled for now
    if (!enabled) {
      console.log("Security notice cannot be disabled, keeping it enabled");
      showSnackbar("Security notice must remain enabled for your safety", "info");
      return;
    }

    setLocalSecurityNotice(enabled);
    try {
      await updateSecurityNoticeSetting(enabled);
      console.log("Security notice setting updated successfully");
      console.log("New showSecurityNotice from context:", showSecurityNotice);
    } catch (error) {
      console.error("Error updating security notice setting:", error);
      // Revert local state if update failed
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
      console.error("Error saving settings:", error);
      showSnackbar("Failed to save settings. Please try again.", "error");
    }
  };

  const handleClearOldData = async () => {
    try {
      await clearOldData(dataRetentionDays);
      showSnackbar("Old data cleared successfully!", "success");
      loadDataUsage(); // Refresh data usage after clearing
    } catch (error) {
      console.error("Error clearing data:", error);
      showSnackbar("Failed to clear old data. Please try again.", "error");
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      // In a real app, you would save this to a file or share it
      console.log("Data exported:", data);
      showSnackbar("Data exported successfully!", "success");
    } catch (error) {
      console.error("Error exporting data:", error);
      showSnackbar("Failed to export data. Please try again.", "error");
    }
  };

  const handleBackupData = async () => {
    try {
      const data = await backupData();
      // In a real app, you would save this to cloud storage
      console.log("Data backed up:", data);
      showSnackbar("Data backed up successfully!", "success");
    } catch (error) {
      console.error("Error backing up data:", error);
      showSnackbar("Failed to backup data. Please try again.", "error");
    }
  };

  const handleResetApp = async () => {
    try {
      // Clear all data from database
      await clearOldData(0); // 0 days = clear everything

      // Clear all security settings
      await resetSecurity();

      // Clear all notification settings
      await cancelAllNotifications();

      // Clear all user settings
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userPin");
      await AsyncStorage.removeItem("onboardingCompleted");
      await AsyncStorage.removeItem("securityEnabled");
      await AsyncStorage.removeItem("biometricEnabled");
      await AsyncStorage.removeItem("autoLockEnabled");
      await AsyncStorage.removeItem("autoLockTimeout");

      showSnackbar("App reset complete! Please restart the app.", "success");

      // Navigate to SignUp after a short delay
      setTimeout(() => {
        navigation.replace("SignUp");
      }, 2000);
    } catch (error) {
      console.error("Error resetting app:", error);
      showSnackbar("Failed to reset app. Please try again.", "error");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showSnackbar("Signed out successfully", "success");
      // Navigate to SignUp page after sign out
      navigation.replace("SignUp");
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

  return (
    <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          {isLoading ? "Loading..." : "Manage your preferences"}
        </Text>
      </View>

      {/* Main Content Container - Gray Parent Card */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Setup Account Button */}
          <Card style={styles.setupCard}>
            <Card.Content>
              <View style={styles.setupHeader}>
                <View style={styles.setupInfo}>
                  <Title style={styles.setupTitle}>Account Setup</Title>
                  <Text style={styles.setupSubtitle}>
                    Configure your payment frequency, amount, and tithing
                    preferences
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => navigation.replace("Onboarding")}
                  icon="account-cog"
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                >
                  Setup
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Payment Settings */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.cardTitle}>Payment Settings</Title>
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
                    left={(props) => <List.Icon {...props} icon="calendar" />}
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

          {/* Notifications */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Notifications</Title>
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

          {/* Data Management */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Data Management</Title>

              <List.Item
                title="Data Retention"
                description={`Keep expenses for ${dataRetentionDays} days`}
                left={(props) => <List.Icon {...props} icon="database" />}
              />

              <View style={styles.retentionSlider}>
                <Text style={styles.retentionLabel}>Days to keep data:</Text>
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

          {/* Account Settings */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Account Settings</Title>
              <List.Item
                title="Username"
                description={user?.username || "Not set"}
                left={(props) => <List.Icon {...props} icon="account" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
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
                  <Button mode="outlined" compact onPress={() => {}}>
                    Edit
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Authentication Method"
                description={user?.authMethod || "PIN"}
                left={(props) => (
                  <List.Icon {...props} icon="account-multiple" />
                )}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
                    Change
                  </Button>
                )}
              />
              <Divider style={styles.divider} />
              <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.dangerButton}
                textColor="#F44336"
              >
                Sign Out
              </Button>
            </Card.Content>
          </Card>

          {/* App Preferences */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>App Preferences</Title>
              <List.Item
                title="Default Currency"
                left={(props) => <List.Icon {...props} icon="currency-usd" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
                    Change
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Default Payment Method"
                left={(props) => <List.Icon {...props} icon="credit-card" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
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
                left={(props) => <List.Icon {...props} icon="view-week" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
                    Change
                  </Button>
                )}
              />
            </Card.Content>
          </Card>

          {/* Security & Privacy */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Security & Privacy</Title>

              {/* Master Security Toggle */}
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
              
              {/* Security Notice Toggle */}
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

              {/* Security Notice Reset Button */}
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

              {/* Security Method Selection (only show when security is enabled) */}
              {isSecurityEnabled && (
                <>
                  {/* PIN Management */}
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
                  
                  {/* Biometric Authentication */}
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
                  
                  {/* Auto Lock */}
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
                  
                  {/* Lock App Now */}
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
                  
                  {/* Reset Security */}
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
                      <Button mode="outlined" compact onPress={() => {}}>
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
                      <Button mode="outlined" compact onPress={() => {}}>
                        View
                      </Button>
                    )}
                  />
                </>
              )}
            </Card.Content>
          </Card>

          {/* Categories & Payment Methods */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>
                Categories & Payment Methods
              </Title>
              <List.Item
                title="Manage Categories"
                left={(props) => <List.Icon {...props} icon="tag-multiple" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
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
                  <Button mode="outlined" compact onPress={() => {}}>
                    Manage
                  </Button>
                )}
              />
            </Card.Content>
          </Card>

          {/* Help & Support */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Help & Support</Title>
              <List.Item
                title="Help Center"
                left={(props) => <List.Icon {...props} icon="help-circle" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
                    Open
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Contact Us"
                left={(props) => <List.Icon {...props} icon="message" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
                    Contact
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Tutorial"
                left={(props) => <List.Icon {...props} icon="play-circle" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
                    Replay
                  </Button>
                )}
              />
              <Divider style={styles.itemDivider} />
              <List.Item
                title="Send Feedback"
                left={(props) => <List.Icon {...props} icon="comment-text" />}
                right={() => (
                  <Button mode="outlined" compact onPress={() => {}}>
                    Send
                  </Button>
                )}
              />
            </Card.Content>
          </Card>

          {/* App Info */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>App Information</Title>
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

          {/* App Reset */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>App Reset</Title>
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

          {/* PIN Setup Modal */}
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
  header: {
    backgroundColor: "transparent",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
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
  // Setup card styles
  setupCard: {
    margin: 10,
    marginTop: 5,
    marginBottom: 15,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  setupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setupInfo: {
    flex: 1,
    marginRight: 15,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  setupSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  // Modal styles
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
  contentContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -20,
    marginHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
});

export default SettingsScreen;
