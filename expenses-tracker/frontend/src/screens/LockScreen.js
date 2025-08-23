import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Card,
  Title,
  Button,
  TextInput,
  Snackbar,
  ProgressBar,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSecurity } from "../context/SecurityContext";
import { useDatabase } from "../context/DatabaseContext";

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

const LockScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const {
    verifyPin,
    authenticateWithBiometric,
    isBiometricEnabled,
    isBiometricAvailable,
    isSecurityEnabled,
    failedAttempts,
    isLockedOut,
    lockoutTimeRemaining,
  } = useSecurity();
  const { getExpensesByDateRange, getIncomeByDateRange } = useDatabase();

  const [pin, setPin] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [summaryData, setSummaryData] = useState({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
  });

  const pinInputRef = useRef();

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  useEffect(() => {
    loadLimitedData();
  }, []);

  const loadLimitedData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const todayExpenses = await getExpensesByDateRange(today, today);
      const weekExpenses = await getExpensesByDateRange(weekStart, weekEnd);
      const monthExpenses = await getExpensesByDateRange(monthStart, monthEnd);

      const recent = todayExpenses.slice(0, 3).map((exp) => ({
        ...exp,
        description:
          exp.description.length > 20
            ? exp.description.substring(0, 20) + "..."
            : exp.description,
      }));

      setRecentExpenses(recent);
      setSummaryData({
        todayTotal: todayExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        weekTotal: weekExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        monthTotal: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        todayCount: todayExpenses.length,
        weekCount: weekExpenses.length,
        monthCount: monthExpenses.length,
      });
    } catch (error) {
      console.log("Error loading limited data:", error);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      showSnackbar("Please enter your PIN", "error");
      return;
    }

    try {
      const success = await verifyPin(pin);
      if (success) {
        showSnackbar("Welcome back!", "success");
        setPin("");
      } else {
        showSnackbar("Incorrect PIN", "error");
        setPin("");
      }
    } catch (error) {
      showSnackbar("Authentication failed", "error");
      setPin("");
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        showSnackbar("Welcome back!", "success");
      } else {
        showSnackbar("Biometric authentication failed", "error");
      }
    } catch (error) {
      showSnackbar("Biometric not available", "error");
    }
  };

  const handleForgotPin = () => {
    showSnackbar("Please restart the app to reset", "info");
  };

  if (!isSecurityEnabled) {
    useEffect(() => {
      navigation.replace("MainTabs");
    }, []);
    return null;
  }

  if (isLockedOut()) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.content}>
            <MaterialIcons
              name="lock-clock"
              size={80}
              color={theme.colors.error}
            />
            <Title style={[styles.title, { color: theme.colors.text }]}>
              Too Many Failed Attempts
            </Title>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              Please wait {lockoutTimeRemaining} seconds before trying again
            </Text>
            <View style={styles.lockoutTimer}>
              <ProgressBar
                progress={lockoutTimeRemaining / 1200}
                color={theme.colors.error}
                style={styles.timerBar}
              />
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <MaterialIcons name="lock" size={40} color="#FFFFFF" />
          <Text style={styles.headerTitle}>App Locked</Text>
          <Text style={styles.headerSubtitle}>
            Enter PIN or use biometric to unlock
          </Text>
        </View>

        {/* Limited Financial Overview */}
        <Card
          style={[
            styles.overviewCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
              Today's Summary
            </Title>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text
                  style={[styles.summaryValue, { color: theme.colors.expense }]}
                >
                  ${summaryData.todayTotal.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Spent Today
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text
                  style={[styles.summaryValue, { color: theme.colors.primary }]}
                >
                  {summaryData.todayCount}
                </Text>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Transactions
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Expenses (Limited) */}
        {recentExpenses.length > 0 && (
          <Card
            style={[
              styles.expensesCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                Recent Expenses
              </Title>
              <Text
                style={[
                  styles.limitedNote,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Showing limited data for privacy
              </Text>
              {recentExpenses.map((expense, index) => (
                <View key={index} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text
                      style={[
                        styles.expenseDescription,
                        { color: theme.colors.text },
                      ]}
                    >
                      {expense.description}
                    </Text>
                    <Text
                      style={[
                        styles.expenseCategory,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {expense.category}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.expenseAmount,
                      { color: theme.colors.expense },
                    ]}
                  >
                    ${expense.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Budget Progress (Limited) */}
        <Card
          style={[styles.budgetCard, { backgroundColor: theme.colors.surface }]}
        >
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
              Budget Status
            </Title>
            <View style={styles.budgetProgress}>
              <View style={styles.progressItem}>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Weekly Budget
                </Text>
                <ProgressBar
                  progress={0}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <Text
                  style={[styles.progressText, { color: theme.colors.text }]}
                >
                  0% used
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Authentication Section */}
        <Card
          style={[styles.authCard, { backgroundColor: theme.colors.surface }]}
        >
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
              Unlock App
            </Title>

            {/* PIN Input */}
            <View style={styles.pinContainer}>
              <Text style={[styles.pinLabel, { color: theme.colors.text }]}>
                Enter your PIN
              </Text>
              <TextInput
                ref={pinInputRef}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                mode="outlined"
                style={styles.pinInput}
                placeholder="PIN"
                maxLength={8}
                secureTextEntry
                autoFocus
                textColor={theme.colors.text}
                placeholderTextColor={theme.colors.textSecondary}
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
              />
              <Button
                mode="contained"
                onPress={handlePinSubmit}
                disabled={pin.length < 4}
                style={styles.unlockButton}
                buttonColor={theme.colors.primary}
                textColor="#FFFFFF"
              >
                Unlock
              </Button>
            </View>

            {/* Biometric Option */}
            {isBiometricAvailable && (
              <View style={styles.biometricContainer}>
                <Text
                  style={[
                    styles.biometricLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Or use biometric authentication
                </Text>
                <Button
                  mode="outlined"
                  onPress={handleBiometricAuth}
                  icon="fingerprint"
                  style={styles.biometricButton}
                  textColor={theme.colors.primary}
                  outlineColor={theme.colors.primary}
                >
                  Use Fingerprint
                </Button>
              </View>
            )}

            {/* Failed Attempts Warning */}
            {failedAttempts > 0 && (
              <View style={styles.warningContainer}>
                <MaterialIcons
                  name="warning"
                  size={20}
                  color={theme.colors.warning}
                />
                <Text
                  style={[styles.warningText, { color: theme.colors.warning }]}
                >
                  {3 - failedAttempts} attempts remaining
                </Text>
              </View>
            )}

            {/* Forgot PIN */}
            <Button
              mode="text"
              onPress={handleForgotPin}
              style={styles.forgotButton}
              textColor={theme.colors.textSecondary}
            >
              Forgot PIN?
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

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
                : theme.colors.info,
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
  },
  overviewCard: {
    margin: 20,
    marginBottom: 10,
    elevation: 4,
    borderRadius: 12,
  },
  expensesCard: {
    margin: 20,
    marginBottom: 10,
    elevation: 4,
    borderRadius: 12,
  },
  budgetCard: {
    margin: 20,
    marginBottom: 10,
    elevation: 4,
    borderRadius: 12,
  },
  authCard: {
    margin: 20,
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  limitedNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "500",
  },
  expenseCategory: {
    fontSize: 14,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  budgetProgress: {
    gap: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: "right",
  },
  pinContainer: {
    marginBottom: 24,
  },
  pinLabel: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  pinInput: {
    backgroundColor: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 16,
  },
  unlockButton: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  biometricContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  biometricLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  biometricButton: {
    borderRadius: 8,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  forgotButton: {
    marginTop: 8,
  },
  // Lockout styles
  card: {
    elevation: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  lockoutTimer: {
    width: "100%",
    marginTop: 16,
  },
  timerBar: {
    height: 8,
    borderRadius: 4,
  },
});

export default LockScreen;
