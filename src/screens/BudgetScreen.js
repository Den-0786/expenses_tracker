import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  Card,
  Title,
  Button,
  TextInput,
  ProgressBar,
  List,
  Switch,
  Snackbar,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useBudget } from "../context/BudgetContext";

const BudgetScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const {
    budgets,
    currentSpending,
    setBudget,
    getBudgetProgress,
    getBudgetStatus,
    getRemainingBudget,
  } = useBudget();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    daily: budgets.daily.toString(),
    weekly: budgets.weekly.toString(),
    monthly: budgets.monthly.toString(),
    yearly: budgets.yearly.toString(),
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const handleSaveBudgets = () => {
    try {
      const daily = parseFloat(editForm.daily) || 0;
      const weekly = parseFloat(editForm.weekly) || 0;
      const monthly = parseFloat(editForm.monthly) || 0;
      const yearly = parseFloat(editForm.yearly) || 0;

      setBudget("daily", daily);
      setBudget("weekly", weekly);
      setBudget("monthly", monthly);
      setBudget("yearly", yearly);

      setEditMode(false);
      showSnackbar("Budgets updated successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to update budgets. Please try again.", "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "#F44336";
      case "warning":
        return "#FF9800";
      default:
        return "#4CAF50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "critical":
        return "warning";
      case "warning":
        return "info";
      default:
        return "check-circle";
    }
  };

  const renderBudgetCard = (period, title, icon) => {
    const budget = budgets[period];
    const spending = currentSpending[period];
    const progress = getBudgetProgress(period);
    const status = getBudgetStatus(period);
    const remaining = getRemainingBudget(period);

    return (
      <Card
        key={period}
        style={[styles.budgetCard, { backgroundColor: theme.colors.surface }]}
      >
        <Card.Content>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetTitle}>
              <MaterialIcons
                name={icon}
                size={24}
                color={theme.colors.primary}
              />
              <Title
                style={[styles.budgetTitleText, { color: theme.colors.text }]}
              >
                {title}
              </Title>
            </View>
            <Text style={[styles.budgetAmount, { color: theme.colors.text }]}>
              ${budget.toFixed(2)}
            </Text>
          </View>

          <View style={styles.budgetProgress}>
            <View style={styles.progressHeader}>
              <Text
                style={[
                  styles.progressLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Progress
              </Text>
              <Text
                style={[styles.progressValue, { color: theme.colors.text }]}
              >
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              color={getStatusColor(status)}
              style={styles.progressBar}
            />
            <View style={styles.progressStatus}>
              <MaterialIcons
                name={getStatusIcon(status)}
                size={16}
                color={getStatusColor(status)}
              />
              <Text
                style={[styles.statusText, { color: getStatusColor(status) }]}
              >
                {status === "critical"
                  ? "Over Budget!"
                  : status === "warning"
                    ? "Near Limit"
                    : "On Track"}
              </Text>
            </View>
          </View>

          <View style={styles.budgetDetails}>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Spent:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                ${spending.toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Remaining:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      remaining > 0 ? theme.colors.success : theme.colors.error,
                  },
                ]}
              >
                ${remaining.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#2E7D32" }]}>
        <Text style={styles.headerTitle}>Budget Management</Text>
        <Text style={styles.headerSubtitle}>Track your spending limits</Text>
      </View>

      {/* Budget Overview */}
      <Card
        style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}
      >
        <Card.Content>
          <View style={styles.overviewHeader}>
            <Title style={[styles.overviewTitle, { color: theme.colors.text }]}>
              Budget Overview
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
              <TextInput
                label="Daily Budget"
                value={editForm.daily}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, daily: text })
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="0.00"
                left={<TextInput.Affix text="$" />}
              />
              <TextInput
                label="Weekly Budget"
                value={editForm.weekly}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, weekly: text })
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="0.00"
                left={<TextInput.Affix text="$" />}
              />
              <TextInput
                label="Monthly Budget"
                value={editForm.monthly}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, monthly: text })
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="0.00"
                left={<TextInput.Affix text="$" />}
              />
              <TextInput
                label="Yearly Budget"
                value={editForm.yearly}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, yearly: text })
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="0.00"
                left={<TextInput.Affix text="$" />}
              />
              <View style={styles.editButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditMode(false);
                    setEditForm({
                      daily: budgets.daily.toString(),
                      weekly: budgets.weekly.toString(),
                      monthly: budgets.monthly.toString(),
                      yearly: budgets.yearly.toString(),
                    });
                  }}
                  style={styles.editButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveBudgets}
                  style={styles.editButton}
                >
                  Save Changes
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.overviewStats}>
              {/* First Row: Daily and Weekly */}
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: theme.colors.primary }]}
                  >
                    ${budgets.daily.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Daily
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: theme.colors.primary }]}
                  >
                    ${budgets.weekly.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Weekly
                  </Text>
                </View>
              </View>

              {/* Second Row: Monthly and Yearly */}
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: theme.colors.primary }]}
                  >
                    ${budgets.monthly.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Monthly
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: theme.colors.primary }]}
                  >
                    ${budgets.yearly.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Yearly
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Individual Budget Cards */}
      {renderBudgetCard("daily", "Daily Budget", "today")}
      {renderBudgetCard("weekly", "Weekly Budget", "view-week")}
      {renderBudgetCard("monthly", "Monthly Budget", "calendar-month")}
      {renderBudgetCard("yearly", "Yearly Budget", "calendar")}

      {/* Budget Tips */}
      <Card
        style={[styles.tipsCard, { backgroundColor: theme.colors.surface }]}
      >
        <Card.Content>
          <Title style={[styles.tipsTitle, { color: theme.colors.text }]}>
            Budget Tips
          </Title>
          <List.Item
            title="Set realistic budgets"
            description="Start with your current spending and adjust gradually"
            left={(props) => (
              <List.Icon
                {...props}
                icon="lightbulb"
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Track regularly"
            description="Monitor your progress daily to stay on track"
            left={(props) => (
              <List.Icon
                {...props}
                icon="chart-line"
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Adjust as needed"
            description="Review and adjust budgets monthly based on your needs"
            left={(props) => (
              <List.Icon {...props} icon="tune" color={theme.colors.primary} />
            )}
          />
        </Card.Content>
      </Card>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
  },
  overviewCard: {
    margin: 20,
    marginBottom: 10,
    elevation: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#ffffff",
    borderRadius: 8,
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
  overviewStats: {
    flexDirection: "column",
    gap: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  budgetCard: {
    margin: 20,
    marginBottom: 10,
    elevation: 4,
    borderRadius: 12,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  budgetTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  budgetProgress: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  budgetDetails: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tipsCard: {
    margin: 20,
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
});

export default BudgetScreen;
