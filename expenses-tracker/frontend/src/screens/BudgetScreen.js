import React, { useState, useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useDatabase } from "../context/DatabaseContext";

const BudgetScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { getAllBudgets, saveBudget, getExpensesByDateRange } = useDatabase();

  const [budgets, setBudgets] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [currentSpending, setCurrentSpending] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [previousSpending, setPreviousSpending] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [budgetInsights, setBudgetInsights] = useState({});

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

  useEffect(() => {
    loadBudgets();
    calculateCurrentSpending();
  }, []);

  useEffect(() => {
    if (budgets && Object.values(budgets).some((budget) => budget > 0)) {
      generateBudgetInsights();
    }
  }, [budgets, currentSpending, previousSpending]);

  const loadBudgets = async () => {
    try {
      const savedBudgets = await getAllBudgets();
      setBudgets(savedBudgets);
    } catch (error) {}
  };

  const calculateCurrentSpending = async () => {
    try {
      const now = new Date();

      const today = now.toISOString().split("T")[0];
      const todayExpenses = await getExpensesByDateRange(today, today);
      const dailyTotal = todayExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const yesterdayExpenses = await getExpensesByDateRange(
        yesterdayStr,
        yesterdayStr
      );
      const previousDailyTotal = yesterdayExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekExpenses = await getExpensesByDateRange(
        weekStart.toISOString().split("T")[0],
        now.toISOString().split("T")[0]
      );
      const weeklyTotal = weekExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(weekStart.getDate() - 7);
      const prevWeekEnd = new Date(weekStart);
      prevWeekEnd.setDate(weekStart.getDate() - 1);
      const prevWeekExpenses = await getExpensesByDateRange(
        prevWeekStart.toISOString().split("T")[0],
        prevWeekEnd.toISOString().split("T")[0]
      );
      const previousWeeklyTotal = prevWeekExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthExpenses = await getExpensesByDateRange(
        monthStart.toISOString().split("T")[0],
        now.toISOString().split("T")[0]
      );
      const monthlyTotal = monthExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthExpenses = await getExpensesByDateRange(
        prevMonthStart.toISOString().split("T")[0],
        prevMonthEnd.toISOString().split("T")[0]
      );
      const previousMonthlyTotal = prevMonthExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearExpenses = await getExpensesByDateRange(
        yearStart.toISOString().split("T")[0],
        now.toISOString().split("T")[0]
      );
      const yearlyTotal = yearExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      const prevYearExpenses = await getExpensesByDateRange(
        prevYearStart.toISOString().split("T")[0],
        prevYearEnd.toISOString().split("T")[0]
      );
      const previousYearlyTotal = prevYearExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      setCurrentSpending({
        daily: dailyTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
        yearly: yearlyTotal,
      });

      setPreviousSpending({
        daily: previousDailyTotal,
        weekly: previousWeeklyTotal,
        monthly: previousMonthlyTotal,
        yearly: previousYearlyTotal,
      });

      generateBudgetInsights();
    } catch (error) {}
  };

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const generateBudgetInsights = () => {
    if (!budgets || !currentSpending || !previousSpending) {
      return;
    }

    const insights = {};

    const dailyBudget = budgets.daily || 0;
    const dailySpent = currentSpending.daily || 0;
    const dailyPrevious = previousSpending.daily || 0;

    if (dailyBudget > 0) {
      const dailyProgress = dailySpent / dailyBudget;
      const dailyComparison = dailySpent - dailyPrevious;

      if (dailyProgress >= 1) {
        insights.daily = {
          status: "critical",
          message: `You've exceeded your daily budget by $${(dailySpent - dailyBudget).toFixed(2)}`,
          recommendation:
            dailyComparison > 0
              ? "You're spending more than yesterday. Consider reducing non-essential expenses."
              : "Try to stay within budget tomorrow.",
        };
      } else if (dailyProgress >= 0.8) {
        insights.daily = {
          status: "warning",
          message: `You're at ${Math.round(dailyProgress * 100)}% of your daily budget`,
          recommendation:
            dailyComparison > 0
              ? "You're spending more than yesterday. Slow down on expenses."
              : "You're doing better than yesterday. Keep it up!",
        };
      } else {
        insights.daily = {
          status: "normal",
          message: `You're at ${Math.round(dailyProgress * 100)}% of your daily budget`,
          recommendation:
            dailyComparison > 0
              ? "You're spending more than yesterday but still within budget."
              : "Great job staying under budget!",
        };
      }
    }

    const weeklyBudget = budgets.weekly || 0;
    const weeklySpent = currentSpending.weekly || 0;
    const weeklyPrevious = previousSpending.weekly || 0;

    if (weeklyBudget > 0) {
      const weeklyProgress = weeklySpent / weeklyBudget;
      const weeklyComparison = weeklySpent - weeklyPrevious;

      if (weeklyProgress >= 1) {
        insights.weekly = {
          status: "critical",
          message: `You've exceeded your weekly budget by $${(weeklySpent - weeklyBudget).toFixed(2)}`,
          recommendation:
            weeklyComparison > 0
              ? "You're spending more than last week. Review your expenses."
              : "Try to stay within budget next week.",
        };
      } else if (weeklyProgress >= 0.8) {
        insights.weekly = {
          status: "warning",
          message: `You're at ${Math.round(weeklyProgress * 100)}% of your weekly budget`,
          recommendation:
            weeklyComparison > 0
              ? "You're spending more than last week. Be cautious."
              : "You're doing better than last week!",
        };
      } else {
        insights.weekly = {
          status: "normal",
          message: `You're at ${Math.round(weeklyProgress * 100)}% of your weekly budget`,
          recommendation:
            weeklyComparison > 0
              ? "You're spending more than last week but still within budget."
              : "Excellent budget management!",
        };
      }
    }

    const monthlyBudget = budgets.monthly || 0;
    const monthlySpent = currentSpending.monthly || 0;
    const monthlyPrevious = previousSpending.monthly || 0;

    if (monthlyBudget > 0) {
      const monthlyProgress = monthlySpent / monthlyBudget;
      const monthlyComparison = monthlySpent - monthlyPrevious;

      if (monthlyProgress >= 1) {
        insights.monthly = {
          status: "critical",
          message: `You've exceeded your monthly budget by $${(monthlySpent - monthlyBudget).toFixed(2)}`,
          recommendation:
            monthlyComparison > 0
              ? "You're spending more than last month. Time to review your budget strategy."
              : "Consider adjusting your monthly budget.",
        };
      } else if (monthlyProgress >= 0.8) {
        insights.monthly = {
          status: "warning",
          message: `You're at ${Math.round(monthlyProgress * 100)}% of your monthly budget`,
          recommendation:
            monthlyComparison > 0
              ? "You're spending more than last month. Monitor closely."
              : "You're doing better than last month!",
        };
      } else {
        insights.monthly = {
          status: "normal",
          message: `You're at ${Math.round(monthlyProgress * 100)}% of your monthly budget`,
          recommendation:
            monthlyComparison > 0
              ? "You're spending more than last month but still within budget."
              : "Outstanding monthly budget control!",
        };
      }
    }

    const yearlyBudget = budgets.yearly || 0;
    const yearlySpent = currentSpending.yearly || 0;
    const yearlyPrevious = previousSpending.yearly || 0;

    if (yearlyBudget > 0) {
      const yearlyProgress = yearlySpent / yearlyBudget;
      const yearlyComparison = yearlySpent - yearlyPrevious;

      if (yearlyProgress >= 1) {
        insights.yearly = {
          status: "critical",
          message: `You've exceeded your yearly budget by $${(yearlySpent - yearlyBudget).toFixed(2)}`,
          recommendation:
            yearlyComparison > 0
              ? "You're spending more than last year. Major budget review needed."
              : "Consider adjusting your yearly budget.",
        };
      } else if (yearlyProgress >= 0.8) {
        insights.yearly = {
          status: "warning",
          message: `You're at ${Math.round(yearlyProgress * 100)}% of your yearly budget`,
          recommendation:
            yearlyComparison > 0
              ? "You're spending more than last year. Monitor carefully."
              : "You're doing better than last year!",
        };
      } else {
        insights.yearly = {
          status: "normal",
          message: `You're at ${Math.round(yearlyProgress * 100)}% of your yearly budget`,
          recommendation:
            yearlyComparison > 0
              ? "You're spending more than last year but still within budget."
              : "Exceptional yearly budget management!",
        };
      }
    }

    setBudgetInsights(insights);
  };

  const handleSaveBudgets = async () => {
    try {
      const daily = parseFloat(editForm.daily) || 0;
      const weekly = parseFloat(editForm.weekly) || 0;
      const monthly = parseFloat(editForm.monthly) || 0;
      const yearly = parseFloat(editForm.yearly) || 0;

      await saveBudget("daily", daily);
      await saveBudget("weekly", weekly);
      await saveBudget("monthly", monthly);
      await saveBudget("yearly", yearly);

      setBudgets({ daily, weekly, monthly, yearly });
      setEditMode(false);
      showSnackbar("Budgets updated successfully!", "success");

      await calculateCurrentSpending();
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

  const getBudgetProgress = (period) => {
    const budget = budgets[period] || 0;
    const spending = currentSpending[period] || 0;

    if (budget === 0 || isNaN(budget) || isNaN(spending)) return 0;
    const progress = spending / budget;
    return isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 1);
  };

  const getBudgetStatus = (period) => {
    const progress = getBudgetProgress(period);
    const alerts = { warning: 0.8, critical: 0.95 };

    if (progress >= alerts.critical) return "critical";
    if (progress >= alerts.warning) return "warning";
    return "normal";
  };

  const getRemainingBudget = (period) => {
    const budget = budgets[period] || 0;
    const spending = currentSpending[period] || 0;

    if (isNaN(budget) || isNaN(spending)) return 0;
    const remaining = budget - spending;
    return isNaN(remaining) ? 0 : Math.max(remaining, 0);
  };

  const renderBudgetCard = (period, title, icon) => {
    const budget = budgets[period];
    const spending = currentSpending[period];
    const previousPeriodSpending = previousSpending[period];
    const progress = getBudgetProgress(period);
    const status = getBudgetStatus(period);
    const remaining = getRemainingBudget(period);
    const insights = budgetInsights[period];

    const spendingDifference = spending - previousPeriodSpending;
    let spendingChange = 0;

    if (
      previousPeriodSpending > 0 &&
      !isNaN(spending) &&
      !isNaN(previousPeriodSpending)
    ) {
      const change =
        ((spending - previousPeriodSpending) / previousPeriodSpending) * 100;
      spendingChange = isNaN(change) ? 0 : change;
    }

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
              ${isNaN(budget) ? "0.00" : budget.toFixed(2)}
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
                {isNaN(progress) ? "0%" : `${Math.round(progress * 100)}%`}
              </Text>
            </View>
            <ProgressBar
              progress={isNaN(progress) ? 0 : progress}
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

          {previousPeriodSpending > 0 && !isNaN(previousPeriodSpending) && (
            <View style={styles.comparisonSection}>
              <Text
                style={[
                  styles.comparisonTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                vs Previous Period
              </Text>
              <View style={styles.comparisonRow}>
                <Text
                  style={[
                    styles.comparisonLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Previous:
                </Text>
                <Text
                  style={[styles.comparisonValue, { color: theme.colors.text }]}
                >
                  $
                  {isNaN(previousPeriodSpending)
                    ? "0.00"
                    : previousPeriodSpending.toFixed(2)}
                </Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text
                  style={[
                    styles.comparisonLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Change:
                </Text>
                <Text
                  style={[
                    styles.comparisonValue,
                    {
                      color:
                        isNaN(spendingDifference) || spendingDifference === 0
                          ? theme.colors.textSecondary
                          : spendingDifference > 0
                            ? theme.colors.error
                            : theme.colors.success,
                    },
                  ]}
                >
                  {isNaN(spendingDifference)
                    ? "0"
                    : spendingDifference > 0
                      ? "+"
                      : ""}
                  $
                  {isNaN(spendingDifference)
                    ? "0.00"
                    : Math.abs(spendingDifference).toFixed(2)}{" "}
                  ({isNaN(spendingChange) ? "0" : spendingChange > 0 ? "+" : ""}
                  {isNaN(spendingChange)
                    ? "0.0"
                    : Math.abs(spendingChange).toFixed(1)}
                  %)
                </Text>
              </View>
            </View>
          )}

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
              <Text style={[styles.detailValue, { color: "#4CAF50" }]}>
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
                    color: (() => {
                      const oneThird = budget / 3;
                      if (remaining < oneThird) return "#E53935"; // Red if less than 1/3
                      return "#FBC02D"; // Gold (default)
                    })(),
                  },
                ]}
              >
                ${remaining.toFixed(2)}
              </Text>
              {(() => {
                const oneThird = budget / 3;
                if (remaining < oneThird) {
                  return (
                    <Text
                      style={[styles.statusIndicator, { color: "#E53935" }]}
                    >
                      🔴 Low Budget
                    </Text>
                  );
                }
                return null;
              })()}
            </View>
          </View>

          {insights && insights.status && !isNaN(insights.status) && (
            <View
              style={[
                styles.insightsSection,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.insightsTitle, { color: theme.colors.text }]}
              >
                💡 Smart Insights
              </Text>
              <Text
                style={[
                  styles.insightsMessage,
                  { color: getStatusColor(insights.status) },
                ]}
              >
                {insights.message}
              </Text>
              <Text
                style={[
                  styles.insightsRecommendation,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {insights.recommendation}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  try {
    return (
      <LinearGradient
        colors={["#4CAF50", "#2196F3"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 1]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budget Management</Text>
          <Text style={styles.headerSubtitle}>Track your spending limits</Text>
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
            contentContainerStyle={styles.scrollContent}
          >
            <View
              style={[
                styles.stickyOverviewContainer,
                {
                  backgroundColor: theme.colors.background,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <Card
                style={[
                  styles.overviewCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content>
                  <View style={styles.overviewHeader}>
                    <Title
                      style={[
                        styles.overviewTitle,
                        { color: theme.colors.text },
                      ]}
                    >
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
                        style={[
                          styles.input,
                          { backgroundColor: theme.colors.surface },
                        ]}
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
                        style={[
                          styles.input,
                          { backgroundColor: theme.colors.surface },
                        ]}
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
                        style={[
                          styles.input,
                          { backgroundColor: theme.colors.surface },
                        ]}
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
                        style={[
                          styles.input,
                          { backgroundColor: theme.colors.surface },
                        ]}
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
                      <View style={styles.statRow}>
                        <View
                          style={[
                            styles.statItem,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border || "#e0e0e0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statValue,
                              { color: theme.colors.primary },
                            ]}
                          >
                            $
                            {isNaN(budgets.daily)
                              ? "0.00"
                              : budgets.daily.toFixed(2)}
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
                        <View
                          style={[
                            styles.statItem,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border || "#e0e0e0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statValue,
                              { color: theme.colors.primary },
                            ]}
                          >
                            $
                            {isNaN(budgets.weekly)
                              ? "0.00"
                              : budgets.weekly.toFixed(2)}
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

                      <View style={styles.statRow}>
                        <View
                          style={[
                            styles.statItem,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border || "#e0e0e0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statValue,
                              { color: theme.colors.primary },
                            ]}
                          >
                            $
                            {isNaN(budgets.monthly)
                              ? "0.00"
                              : budgets.monthly.toFixed(2)}
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
                        <View
                          style={[
                            styles.statItem,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border || "#e0e0e0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statValue,
                              { color: theme.colors.primary },
                            ]}
                          >
                            $
                            {isNaN(budgets.yearly)
                              ? "0.00"
                              : budgets.yearly.toFixed(2)}
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

              {renderBudgetCard("daily", "Daily Budget", "today")}
              {renderBudgetCard("weekly", "Weekly Budget", "view-week")}
              {renderBudgetCard("monthly", "Monthly Budget", "calendar-month")}
              {renderBudgetCard("yearly", "Yearly Budget", "calendar-month")}

              <Card
                style={[
                  styles.tipsCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content>
                  <Title
                    style={[styles.tipsTitle, { color: theme.colors.text }]}
                  >
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
                    title="Review regularly"
                    description="Check your progress weekly and adjust as needed"
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="check-circle"
                        color={theme.colors.primary}
                      />
                    )}
                  />
                  <List.Item
                    title="Use categories"
                    description="Break down your budget by spending categories"
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="format-list-bulleted"
                        color={theme.colors.primary}
                      />
                    )}
                  />
                </Card.Content>
              </Card>
            </View>
          </ScrollView>
        </View>

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
      </LinearGradient>
    );
  } catch (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error loading budget screen. Please try again.
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  contentContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
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
  scrollContent: {
    paddingTop: 10,
  },
  stickyOverviewContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  overviewContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  overviewHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  overviewCard: {
    margin: 10,
    marginBottom: 15,
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
    paddingTop: 10,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginHorizontal: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  budgetCard: {
    margin: 10,
    marginBottom: 15,
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
  comparisonSection: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
    marginBottom: 15,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  comparisonLabel: {
    fontSize: 13,
  },
  comparisonValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  insightsSection: {
    borderTopWidth: 1,
    paddingTop: 15,
    marginTop: 15,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  insightsMessage: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 20,
  },
  insightsRecommendation: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
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
  statusIndicator: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  tipsCard: {
    margin: 10,
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  summarySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryItem: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryItemTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  summaryItemValue: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default BudgetScreen;
