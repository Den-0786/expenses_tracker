import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  Card,
  Title,
  Switch,
  Snackbar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useDatabase } from "../context/DatabaseContext";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { useSecurity } from "../context/SecurityContext";
import { useSecurityNotice } from "../context/SecurityNoticeContext";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { saveUserSettings, getUserSettings, isReady } = useDatabase();
  const {
    scheduleDailyReminder,
    scheduleWeeklyReminder,
    scheduleMonthlyReminder,
  } = useNotifications();
  const { theme } = useTheme();
  const { isSecurityEnabled } = useSecurity();
  const { showSecurityNotice, updateSecurityNoticeSetting } =
    useSecurityNotice();

  const [showSetup, setShowSetup] = useState(false);
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [tithingPercentage, setTithingPercentage] = useState("10");
  const [tithingEnabled, setTithingEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [splashProgress, setSplashProgress] = useState(0);
  const [userSettings, setUserSettings] = useState(null);

  // Removed Animated reference since we're not using animations

  useEffect(() => {
    if (isReady) {
      checkExistingSettings();
    }
  }, [isReady]);

  // Auto-hide security notice when security is enabled
  useEffect(() => {
    if (isSecurityEnabled && showSecurityNotice) {
      updateSecurityNoticeSetting(false);
    }
  }, [isSecurityEnabled, showSecurityNotice, updateSecurityNoticeSetting]);

  useEffect(() => {
    // Show ET branding for 10 seconds, then show setup
    const totalTime = 10000; // 10 seconds
    const interval = 100; // Update every 100ms for smooth progress

    const progressTimer = setInterval(() => {
      setSplashProgress((prev) => {
        const newProgress = prev + 100 / (totalTime / interval);
        if (newProgress >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return newProgress;
      });
    }, interval);

    const timer = setTimeout(() => {
      setShowSetup(true);
      setSplashProgress(0);
    }, totalTime);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, []);

  const checkExistingSettings = async () => {
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
      // Only auto-redirect if this is the first launch
      // If user navigated here from main app, don't redirect
      if (settings && !navigation.isFocused()) {
        navigation.replace("Main");
      }
    } catch (error) {
      console.error("Error checking settings:", error);
    }
  };

  // Check if user is coming from main app to edit settings
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // When screen comes into focus, check if we should show setup form
      if (userSettings) {
        setShowSetup(true);
      }
    });

    return unsubscribe;
  }, [navigation, userSettings]);

  // Populate form with existing settings when editing
  useEffect(() => {
    if (userSettings) {
      setPaymentFrequency(userSettings.payment_frequency || "monthly");
      setPaymentAmount(userSettings.payment_amount?.toString() || "");
      setTithingPercentage(userSettings.tithing_percentage?.toString() || "10");
      setTithingEnabled(userSettings.tithing_enabled === 1);
    }
  }, [userSettings]);

  const handleComplete = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showSnackbar("Please enter a valid payment amount.", "error");
      return;
    }

    if (
      tithingEnabled &&
      (parseFloat(tithingPercentage) < 10 ||
        parseFloat(tithingPercentage) > 100)
    ) {
      showSnackbar(
        "Please enter a valid percentage between 10 and 100.",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const result = await saveUserSettings(
        paymentFrequency,
        parseFloat(paymentAmount),
        parseFloat(tithingPercentage),
        tithingEnabled
      );

      await scheduleDailyReminder();
      await scheduleWeeklyReminder();
      await scheduleMonthlyReminder();

      showSnackbar("Setup complete! Redirecting to main app...", "success");
      setTimeout(() => {
        navigation.replace("Main");
      }, 1500);
    } catch (error) {
      console.error("Error saving settings:", error);
      showSnackbar("Failed to save settings. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateTithing = () => {
    if (!paymentAmount || !tithingEnabled) return 0;
    const amount = parseFloat(paymentAmount);
    const percentage = parseFloat(tithingPercentage);
    return (amount * percentage) / 100;
  };

  const calculateRemaining = () => {
    if (!paymentAmount) return 0;
    const amount = parseFloat(paymentAmount);
    const tithing = calculateTithing();
    return amount - tithing;
  };

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  // Show full-screen ET branding splash
  if (!showSetup) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[
            theme.colors.primary, // Teal
            theme.colors.info, // Blue
            theme.colors.secondary, // Green
          ]}
          style={styles.fullScreenGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.brandAcronym}>ET</Text>
            </View>
            <Text style={styles.brandText}>EXPENSES TRACKER</Text>
            <Text style={styles.brandTagline}>Smart Financial Management</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${splashProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(splashProgress)}%
              </Text>
            </View>

            <Text style={styles.loadingText}>
              Loading... {Math.round((100 - splashProgress) / 10)}s remaining
            </Text>

            {/* Manual skip button for testing */}
            <Button
              mode="contained"
              onPress={() => setShowSetup(true)}
              style={styles.skipButton}
              buttonColor="rgba(255, 255, 255, 0.2)"
              textColor="#ffffff"
            >
              Skip (Tap to continue)
            </Button>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Show setup form
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.info]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with ET branding */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.headerLogoCircle}>
              <Text style={styles.headerBrandAcronym}>ET</Text>
            </View>
            <Text style={styles.headerBrandText}>EXPENSES TRACKER</Text>
          </View>
        </View>

        {/* Setup Form */}
        <View style={styles.formContainer}>
          {/* Security Notice */}
          {!isSecurityEnabled && showSecurityNotice && (
            <Card
              style={[
                styles.securityCard,
                { borderLeftColor: theme.colors.warning, borderLeftWidth: 4 },
              ]}
            >
              <Card.Content>
                <View style={styles.securityHeader}>
                  <Title style={styles.securityTitle}>🔒 Security Notice</Title>
                  <TouchableOpacity
                    onPress={() => updateSecurityNoticeSetting(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.securityText}>
                  Welcome to ExpenseTracker! Your financial data is currently
                  unprotected. To secure your app, go to Settings → Security and
                  enable PIN or biometric authentication.
                </Text>
                <Text style={styles.securityNote}>
                  💡 You can disable this message from Settings → Security
                </Text>
              </Card.Content>
            </Card>
          )}

          <Card
            style={[
              styles.setupCard,
              {
                backgroundColor: "#FFFFFF", // Force white background
                elevation: 8,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Card.Content style={styles.cardContent}>
                <Title
                  style={[styles.setupTitle, { color: theme.colors.text }]}
                >
                  Setup Your Account
                </Title>
                <Text
                  style={[
                    styles.setupSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Configure your payment preferences to get started
                </Text>

                <View style={styles.frequencyContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    How often are you paid?
                  </Text>
                  <View style={styles.frequencyButtons}>
                    {["daily", "weekly", "monthly"].map((freq) => (
                      <Button
                        key={freq}
                        mode={
                          paymentFrequency === freq ? "contained" : "outlined"
                        }
                        onPress={() => setPaymentFrequency(freq)}
                        style={styles.frequencyButton}
                        labelStyle={styles.frequencyButtonLabel}
                        buttonColor={
                          paymentFrequency === freq
                            ? theme.colors.primary
                            : undefined
                        }
                        textColor={
                          paymentFrequency === freq
                            ? "#ffffff"
                            : theme.colors.primary
                        }
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Button>
                    ))}
                  </View>
                </View>

                {/* Add Expenses Button */}
                <View style={styles.addExpensesContainer}>
                  <Button
                    mode="contained"
                    onPress={() => navigation.replace("Main")}
                    style={styles.addExpensesButton}
                    buttonColor={theme.colors.secondary}
                    textColor="#FFFFFF"
                    icon="plus"
                  >
                    Add Expenses
                  </Button>
                  <Text
                    style={[
                      styles.addExpensesText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Skip setup and go directly to dashboard
                  </Text>
                </View>

                <TextInput
                  label="Payment Amount"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[
                    styles.input,
                    {
                      backgroundColor: "#FFFFFF", // Force white background
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Enter your payment amount"
                  left={<TextInput.Affix text="$" />}
                  textColor={theme.colors.text}
                  labelStyle={{ color: theme.colors.textSecondary }}
                  placeholderTextColor={theme.colors.textSecondary}
                  outlineColor={theme.colors.border}
                  activeOutlineColor={theme.colors.primary}
                />

                <View style={styles.tithingContainer}>
                  <View style={styles.tithingHeader}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Tithing (Optional)
                    </Text>
                    <Switch
                      value={tithingEnabled}
                      onValueChange={setTithingEnabled}
                      color={theme.colors.primary}
                    />
                  </View>

                  {tithingEnabled && (
                    <>
                      <TextInput
                        label="Tithing Percentage"
                        value={tithingPercentage}
                        onChangeText={setTithingPercentage}
                        keyboardType="numeric"
                        mode="outlined"
                        style={[
                          styles.input,
                          {
                            backgroundColor: "#FFFFFF", // Force white background
                            borderColor: theme.colors.border,
                          },
                        ]}
                        placeholder="10"
                        right={<TextInput.Affix text="%" />}
                        min={10}
                        textColor={theme.colors.text}
                        labelStyle={{ color: theme.colors.textSecondary }}
                        placeholderTextColor={theme.colors.textSecondary}
                        outlineColor={theme.colors.border}
                        activeOutlineColor={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.tithingNote,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Minimum tithing percentage is 10%
                      </Text>
                    </>
                  )}
                </View>

                {paymentAmount && (
                  <Card
                    style={[
                      styles.summaryCard,
                      {
                        backgroundColor: "#FFFFFF", // Force white background
                        borderLeftColor: theme.colors.primary,
                        borderLeftWidth: 4,
                        elevation: 2,
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 2, height: 0 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      },
                    ]}
                  >
                    <Card.Content>
                      <Title
                        style={[
                          styles.summaryTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        Summary
                      </Title>
                      <View style={styles.summaryRow}>
                        <Text
                          style={[
                            styles.summaryLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Payment Amount:
                        </Text>
                        <Text
                          style={[
                            styles.summaryValue,
                            { color: theme.colors.text },
                          ]}
                        >
                          ${parseFloat(paymentAmount || 0).toFixed(2)}
                        </Text>
                      </View>
                      {tithingEnabled && (
                        <View style={styles.summaryRow}>
                          <Text
                            style={[
                              styles.summaryLabel,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            Tithing ({tithingPercentage}%):
                          </Text>
                          <Text
                            style={[
                              styles.summaryValue,
                              { color: theme.colors.expense },
                            ]}
                          >
                            -${calculateTithing().toFixed(2)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.summaryRow}>
                        <Text
                          style={[
                            styles.summaryLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Available for Expenses:
                        </Text>
                        <Text
                          style={[
                            styles.summaryValue,
                            styles.remainingValue,
                            { color: theme.colors.income },
                          ]}
                        >
                          ${calculateRemaining().toFixed(2)}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>
                )}

                <Button
                  mode="contained"
                  onPress={handleComplete}
                  loading={loading}
                  disabled={loading || !paymentAmount}
                  style={styles.completeButton}
                  labelStyle={styles.completeButtonLabel}
                  buttonColor={theme.colors.accent}
                  textColor="#FFFFFF"
                >
                  {userSettings ? "Update Settings" : "Complete Setup"}
                </Button>
              </Card.Content>
            </ScrollView>
          </Card>
        </View>
      </LinearGradient>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={{
          backgroundColor:
            snackbarType === "success"
              ? theme.colors.success
              : snackbarType === "error"
                ? theme.colors.error
                : theme.colors.primary,
        }}
        action={{
          label: "Dismiss",
          onPress: hideSnackbar,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Full screen splash styles
  fullScreenGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  brandContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  brandAcronym: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 3,
  },
  brandText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    opacity: 0.95,
    letterSpacing: 4,
    marginBottom: 12,
  },
  brandTagline: {
    fontSize: 18,
    color: "#ffffff",
    opacity: 0.8,
    fontStyle: "italic",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.7,
  },
  skipButton: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  // Setup form styles
  backgroundGradient: {
    flex: 1,
  },
  header: {
    height: height * 0.25,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  headerBrand: {
    alignItems: "center",
  },
  headerLogoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerBrandAcronym: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 2,
  },
  headerBrandText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    opacity: 0.95,
    letterSpacing: 2,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  setupCard: {
    flex: 1,
    elevation: 8,
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 20,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  setupSubtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  frequencyContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  frequencyButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
  },
  frequencyButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  addExpensesContainer: {
    alignItems: "center",
    marginBottom: 25,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  addExpensesButton: {
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  addExpensesText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  input: {
    marginBottom: 20,
    borderRadius: 12,
  },
  tithingContainer: {
    marginBottom: 25,
  },
  tithingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  tithingNote: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: -15,
    marginBottom: 10,
  },
  summaryCard: {
    marginBottom: 25,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  completeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    marginTop: 10,
  },
  completeButtonLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // Progress bar styles
  progressContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "80%",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 4,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  // Security notice styles
  securityCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
  },
  securityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#856404",
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(133, 100, 4, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#856404",
    fontSize: 16,
    fontWeight: "bold",
  },
  securityText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
    marginBottom: 8,
  },
  securityNote: {
    fontSize: 12,
    color: "#856404",
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default OnboardingScreen;
