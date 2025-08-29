import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
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

import { useDatabase } from "../context/DatabaseContext";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { useSecurity } from "../context/SecurityContext";
import { useSecurityNotice } from "../context/SecurityNoticeContext";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
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
  const { completeOnboarding, isAuthenticated, user } = useAuth();

  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [tithingPercentage, setTithingPercentage] = useState("");
  const [tithingEnabled, setTithingEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  const [userSettings, setUserSettings] = useState(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState("pin");

  useEffect(() => {
    if (isReady) {
      checkExistingSettings();
    }
  }, [isReady]);

  const checkExistingSettings = async () => {
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
    } catch (error) {}
  };

  useEffect(() => {
    if (userSettings) {
      setPaymentFrequency(userSettings.payment_frequency || "monthly");
      setPaymentAmount(userSettings.payment_amount?.toString() || "");
      setTithingPercentage(userSettings.tithing_percentage?.toString() || "");
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
      (!tithingPercentage ||
        parseFloat(tithingPercentage) < 10 ||
        parseFloat(tithingPercentage) > 100)
    ) {
      showSnackbar(
        "Please enter a valid percentage between 10 and 100.",
        "error"
      );
      return;
    }

    if (tithingEnabled && !tithingPercentage) {
      showSnackbar("Please enter a tithing percentage.", "error");
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

      setShowPinSetup(true);
      setLoading(false);
    } catch (error) {
      showSnackbar("Failed to save settings. Please try again.", "error");
      setLoading(false);
    }
  };

  const handlePinSetup = async () => {
    if (pinStep === "pin") {
      if (pin.length < 4) {
        showSnackbar("PIN must be at least 4 digits", "error");
        return;
      }
      setPinStep("confirm");
    } else {
      if (pin !== confirmPin) {
        showSnackbar("PINs do not match. Please try again.", "error");
        setConfirmPin("");
        return;
      }

      try {
        await completeOnboarding(pin);
        showSnackbar(
          "Income setup complete! Redirecting to main app...",
          "success"
        );
        // Setup completed successfully
      } catch (error) {
        showSnackbar("An error occurred. Please try again.", "error");
      }
    }
  };

  const handleClosePinSetup = () => {
    setShowPinSetup(false);
    setPin("");
    setConfirmPin("");
    setPinStep("pin");
  };

  const handleSkipPin = async () => {
    try {
      await completeOnboarding();
      showSnackbar(
        "Income setup complete! Redirecting to main app...",
        "success"
      );
      // Setup completed successfully
    } catch (error) {
      showSnackbar("An error occurred. Please try again.", "error");
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.info]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.headerLeft}>
              <View style={styles.headerLogoCircle}>
                <Text
                  style={[
                    styles.headerBrandAcronym,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  ET
                </Text>
              </View>
              <Text
                style={[
                  styles.headerBrandText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                EXPENSES TRACKER
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text
                style={[styles.welcomeText, { color: theme.colors.onPrimary }]}
              >
                Welcome, {user?.username || "User"}!
              </Text>
              <Text
                style={[styles.dateText, { color: theme.colors.onPrimary }]}
              >
                {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {showPinSetup && (
          <>
            <View style={styles.pinSetupBackground} />
            <View style={styles.pinSetupOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Card style={styles.pinSetupCard}>
                  <Card.Content>
                    <TouchableOpacity
                      style={styles.pinCloseButton}
                      onPress={handleClosePinSetup}
                    >
                      <Text
                        style={[
                          styles.pinCloseButtonText,
                          { color: theme.colors.text },
                        ]}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>

                    <Title
                      style={[
                        styles.pinSetupTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      {pinStep === "pin" ? "Set Your PIN" : "Confirm Your PIN"}
                    </Title>
                    <Text
                      style={[
                        styles.pinSetupSubtitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {pinStep === "pin"
                        ? "Choose a 4-6 digit PIN to secure your app"
                        : "Re-enter your PIN to confirm"}
                    </Text>

                    <TextInput
                      label={pinStep === "pin" ? "Enter PIN" : "Confirm PIN"}
                      value={pinStep === "pin" ? pin : confirmPin}
                      onChangeText={pinStep === "pin" ? setPin : setConfirmPin}
                      keyboardType="numeric"
                      mode="outlined"
                      style={styles.pinInput}
                      placeholder="PIN"
                      maxLength={6}
                      secureTextEntry
                      textColor={theme.colors.text}
                      placeholderTextColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                      activeOutlineColor={theme.colors.primary}
                    />

                    <View style={styles.pinSetupButtons}>
                      <Button
                        mode="outlined"
                        onPress={handleSkipPin}
                        style={styles.pinSetupButton}
                        textColor={theme.colors.textSecondary}
                        outlineColor={theme.colors.border}
                      >
                        Skip PIN
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handlePinSetup}
                        disabled={
                          (pinStep === "pin" && pin.length < 4) ||
                          (pinStep === "confirm" && confirmPin.length < 4)
                        }
                        style={styles.pinSetupButton}
                        buttonColor={theme.colors.primary}
                        textColor={theme.colors.onPrimary}
                      >
                        {pinStep === "pin" ? "Continue" : "Set PIN"}
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableWithoutFeedback>
            </View>
          </>
        )}

        <View style={styles.formContainer}>
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
                    <Text
                      style={[
                        styles.closeButtonText,
                        { color: theme.colors.text },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={[styles.securityText, { color: theme.colors.text }]}
                >
                  Welcome to ExpenseTracker! Your financial data is currently
                  unprotected. To secure your app, go to Settings → Security and
                  enable PIN or biometric authentication.
                </Text>
                <Text
                  style={[
                    styles.securityNote,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  💡 You can disable this message from Settings → Security
                </Text>
              </Card.Content>
            </Card>
          )}

          <Card
            style={[
              styles.setupCard,
              {
                backgroundColor: theme.colors.surface,
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
                  Income & Tithing Setup
                </Title>
                <Text
                  style={[
                    styles.setupSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Set up your income tracking and tithing preferences
                </Text>

                <View style={styles.infoCard}>
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    📊{" "}
                    <Text style={{ fontWeight: "bold" }}>Income Tracking:</Text>{" "}
                    Record how much you earn for personal reference
                  </Text>
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    ✝️ <Text style={{ fontWeight: "bold" }}>Tithing:</Text>{" "}
                    Calculate religious giving (typically 10% of income)
                  </Text>
                </View>
                <View style={styles.frequencyContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    How often do you receive income?
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
                            ? theme.colors.onPrimary
                            : theme.colors.primary
                        }
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Button>
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    styles.addExpensesContainer,
                    {
                      borderTopColor: theme.colors.border,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.addExpensesText,
                      { color: theme.colors.textSecondary },
                    ]}
                  ></Text>
                </View>

                <TextInput
                  label="Income Amount"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Enter your income amount"
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
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        placeholder="Enter percentage"
                        right={<TextInput.Affix text="%" />}
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
                        backgroundColor: theme.colors.surface,
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
                          Total Income:
                        </Text>
                        <Text
                          style={[
                            styles.summaryValue,
                            { color: theme.colors.income },
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
                          Available After Tithing:
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
                  textColor={theme.colors.onPrimary}
                >
                  {userSettings
                    ? "Update Income Settings"
                    : "Complete Income Setup"}
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

  backgroundGradient: {
    flex: 1,
  },
  header: {
    height: height * 0.15,
    justifyContent: "space-between",
    alignItems: "stretch",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerBrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  headerLeft: {
    alignItems: "flex-start",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerLogoCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerBrandAcronym: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  headerBrandText: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.9,
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.9,
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
    letterSpacing: 0.5,
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  setupCard: {
    flex: 1.5,
    elevation: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    marginBottom: 20,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
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
    borderBottomWidth: 1,
  },

  input: {
    marginBottom: 20,
    borderRadius: 12,
  },
  incomeNote: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: -15,
    marginBottom: 20,
    lineHeight: 16,
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

  securityCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
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
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  securityText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  securityNote: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  pinSetupBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
  pinSetupOverlay: {
    position: "absolute",
    top: 120, // Position below header
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  pinSetupCard: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
  },
  pinCloseButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1001,
  },
  pinCloseButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pinSetupTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    marginTop: 8,
  },
  pinSetupSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  pinInput: {
    marginBottom: 20,
    borderRadius: 12,
  },
  pinSetupButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
  },
  pinSetupButton: {
    flex: 1,
    borderRadius: 12,
  },
  Ionicons: {
    color: "white",
  },
});

export default OnboardingScreen;
