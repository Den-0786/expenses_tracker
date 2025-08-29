import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Snackbar,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { PieChart, BarChart } from "react-native-chart-kit";
import { useDatabase } from "../context/DatabaseContext";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const {
    getUserSettings,
    getExpensesByDate,
    getExpensesByDateRange,
    getAllBudgets,
  } = useDatabase();
  const { sendImmediateNotification } = useNotifications();
  const { theme, isDarkMode } = useTheme();

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

  const [userSettings, setUserSettings] = useState(null);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [weeklyExpenses, setWeeklyExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [yearlyExpenses, setYearlyExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [activeTab, setActiveTab] = useState("daily");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);

      const savedBudgets = await getAllBudgets();
      setBudgets(savedBudgets);

      const today = format(new Date(), "yyyy-MM-dd");
      const todayExp = await getExpensesByDate(today);
      setTodayExpenses(todayExp);

      const weekStart = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      const weekEnd = format(
        endOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );

      await calculateCurrentSpending();
      const weekExp = await getExpensesByDateRange(weekStart, weekEnd);
      setWeeklyExpenses(weekExp);

      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const monthExp = await getExpensesByDateRange(monthStart, monthEnd);
      setMonthlyExpenses(monthExp);

      const yearStart = format(
        new Date(new Date().getFullYear(), 0, 1),
        "yyyy-MM-dd"
      );
      const yearEnd = format(
        new Date(new Date().getFullYear(), 11, 0),
        "yyyy-MM-dd"
      );
      const yearExp = await getExpensesByDateRange(yearStart, yearEnd);
      setYearlyExpenses(yearExp);
    } catch (error) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + (7 - now.getDay()));
      const weekEndStr = weekEnd.toISOString().split("T")[0];
      const weekExpenses = await getExpensesByDateRange(
        weekStartStr,
        weekEndStr
      );
      const weeklyTotal = weekExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(weekStart.getDate() - 7);
      const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];
      const prevWeekEnd = new Date(weekEnd);
      prevWeekEnd.setDate(weekEnd.getDate() - 7);
      const prevWeekEndStr = prevWeekEnd.toISOString().split("T")[0];
      const prevWeekExpenses = await getExpensesByDateRange(
        prevWeekStartStr,
        prevWeekEndStr
      );
      const previousWeeklyTotal = prevWeekExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split("T")[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthEndStr = monthEnd.toISOString().split("T")[0];
      const monthExpenses = await getExpensesByDateRange(
        monthStartStr,
        monthEndStr
      );
      const monthlyTotal = monthExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthStartStr = prevMonthStart.toISOString().split("T")[0];
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthEndStr = prevMonthEnd.toISOString().split("T")[0];
      const prevMonthExpenses = await getExpensesByDateRange(
        prevMonthStartStr,
        prevMonthEndStr
      );
      const previousMonthlyTotal = prevMonthExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearStartStr = yearStart.toISOString().split("T")[0];
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      const yearEndStr = yearEnd.toISOString().split("T")[0];
      const yearExpenses = await getExpensesByDateRange(
        yearStartStr,
        yearEndStr
      );
      const yearlyTotal = yearExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevYearStartStr = prevYearStart.toISOString().split("T")[0];
      const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      const prevYearEndStr = prevYearEnd.toISOString().split("T")[0];
      const prevYearExpenses = await getExpensesByDateRange(
        prevYearStartStr,
        prevYearEndStr
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
    } catch (error) {}
  };

  const calculateTotal = (expenses) => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const calculateRemaining = () => {
    if (!userSettings) return 0;
    const totalExpenses = calculateTotal(todayExpenses);
    const availableAmount =
      userSettings.payment_amount -
      (userSettings.payment_amount * userSettings.tithing_percentage) / 100;
    return availableAmount - totalExpenses;
  };

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Food: "restaurant",
      Transport: "directions-car",
      Shopping: "shopping-cart",
      Bills: "receipt",
      Entertainment: "movie",
      Health: "local-hospital",
      General: "attach-money",
    };
    return icons[category] || "attach-money";
  };

  const getCurrentExpenses = () => {
    switch (activeTab) {
      case "daily":
        return todayExpenses;
      case "weekly":
        return weeklyExpenses;
      case "monthly":
        return monthlyExpenses;
      case "yearly":
        return yearlyExpenses;
      default:
        return todayExpenses;
    }
  };

  const getCurrentExpensesTotal = () => {
    return calculateTotal(getCurrentExpenses());
  };

  const getCurrentBudgetProgress = () => {
    return getBudgetProgress(activeTab);
  };

  const getCurrentBudgetStatus = () => {
    return getBudgetStatus(activeTab);
  };

  const getCurrentBudgetRemaining = () => {
    return getRemainingBudget(activeTab);
  };

  const getCurrentPeriodLabel = () => {
    switch (activeTab) {
      case "daily":
        return "Today";
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      case "yearly":
        return "This Year";
      default:
        return "Today";
    }
  };

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getCurrentPeriodDays = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    switch (activeTab) {
      case "daily":
        return 1;
      case "weekly":
        return 7;
      case "monthly":
        return new Date(currentYear, currentMonth + 1, 0).getDate();
      case "yearly":
        return isLeapYear(currentYear) ? 366 : 365;
      default:
        return 1;
    }
  };

  const getBudgetProgress = (period) => {
    const budget = budgets[period];
    const spending = getCurrentExpensesTotal();

    if (budget === 0) return 0;
    return Math.min(spending / budget, 1);
  };

  const getBudgetStatus = (period) => {
    const progress = getBudgetProgress(period);

    if (progress >= 0.95) return "critical";
    if (progress >= 0.8) return "warning";
    return "normal";
  };

  const getRemainingBudget = (period) => {
    return Math.max(budgets[period] - getCurrentExpensesTotal(), 0);
  };

  const preparePieChartData = (expenses) => {
    const categoryTotals = {};

    expenses.forEach((expense) => {
      const category = expense.category || "General";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + expense.amount;
    });

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];

    return Object.keys(categoryTotals).map((category, index) => ({
      name: category,
      amount: categoryTotals[category],
      color: colors[index % colors.length],
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));
  };

  const prepareBarChartData = (expenses) => {
    const dailyTotals = {};

    expenses.forEach((expense) => {
      const date = expense.date;
      dailyTotals[date] = (dailyTotals[date] || 0) + expense.amount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    const last7Days = sortedDates.slice(-7);

    return {
      labels: last7Days.map((date) => format(new Date(date), "MMM dd")),
      datasets: [
        {
          data: last7Days.map((date) => dailyTotals[date] || 0),
        },
      ],
    };
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {[
              { key: "daily", label: "Daily", icon: "today" },
              { key: "weekly", label: "Weekly", icon: "view-week" },
              { key: "monthly", label: "Monthly", icon: "calendar-month" },
              { key: "yearly", label: "Yearly", icon: "calendar-month" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={20}
                  color={
                    activeTab === tab.key
                      ? "#ffffff"
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.activeTabLabel,
                    {
                      color:
                        activeTab === tab.key ? "#ffffff" : theme.colors.text,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsContainer}>
            <Card
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content>
                <Title style={[styles.statTitle, { color: theme.colors.text }]}>
                  {getCurrentPeriodLabel()} Expenses
                </Title>
                <Text
                  style={[styles.statAmount, { color: theme.colors.primary }]}
                >
                  ${getCurrentExpensesTotal().toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.statSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {getCurrentExpenses().length} items
                </Text>
              </Card.Content>
            </Card>

            <Card
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content>
                <Title style={[styles.statTitle, { color: theme.colors.text }]}>
                  Remaining
                </Title>
                <Text
                  style={[
                    styles.statAmount,
                    {
                      color:
                        getCurrentBudgetRemaining() >= 0
                          ? "#4CAF50"
                          : "#F44336",
                    },
                  ]}
                >
                  ${getCurrentBudgetRemaining().toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.statSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Available{" "}
                  {activeTab === "daily"
                    ? "today"
                    : `this ${activeTab.slice(0, -2)}`}
                </Text>
              </Card.Content>
            </Card>
          </View>

          <Card
            style={[
              styles.budgetCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Title style={[styles.budgetTitle, { color: theme.colors.text }]}>
                {getCurrentPeriodLabel()} Budget Progress
              </Title>

              <View style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                  <Text
                    style={[
                      styles.budgetLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {getCurrentPeriodLabel()} Budget
                  </Text>
                  <Text
                    style={[
                      styles.budgetProgress,
                      { color: theme.colors.text },
                    ]}
                  >
                    {Math.round(getCurrentBudgetProgress() * 100)}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBarContainer,
                    { backgroundColor: theme.colors.border || "#e0e0e0" },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(getCurrentBudgetProgress() * 100, 100)}%`,
                        backgroundColor:
                          getCurrentBudgetStatus() === "critical"
                            ? "#F44336"
                            : getCurrentBudgetStatus() === "warning"
                              ? "#FF9800"
                              : "#4CAF50",
                      },
                    ]}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.summaryCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Title
                style={[styles.summaryTitle, { color: theme.colors.text }]}
              >
                📊 Budget Performance Summary
              </Title>
              <Text
                style={[
                  styles.summarySubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                How you're doing compared to previous periods
              </Text>

              <View style={styles.summaryGrid}>
                <View
                  style={[
                    styles.summaryItem,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryItemTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Daily Trend
                  </Text>
                  <Text
                    style={[
                      styles.summaryItemValue,
                      {
                        color:
                          previousSpending.daily > 0
                            ? currentSpending.daily > previousSpending.daily
                              ? theme.colors.error
                              : theme.colors.success
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {previousSpending.daily > 0
                      ? currentSpending.daily > previousSpending.daily
                        ? "↗️ Spending Up"
                        : "↘️ Spending Down"
                      : "No previous data"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryItem,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryItemTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Weekly Trend
                  </Text>
                  <Text
                    style={[
                      styles.summaryItemValue,
                      {
                        color:
                          previousSpending.weekly > 0
                            ? currentSpending.weekly > previousSpending.weekly
                              ? theme.colors.error
                              : theme.colors.success
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {previousSpending.weekly > 0
                      ? currentSpending.weekly > previousSpending.weekly
                        ? "↗️ Spending Up"
                        : "↘️ Spending Down"
                      : "No previous data"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryItem,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryItemTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Monthly Trend
                  </Text>
                  <Text
                    style={[
                      styles.summaryItemValue,
                      {
                        color:
                          previousSpending.monthly > 0
                            ? currentSpending.monthly > previousSpending.monthly
                              ? theme.colors.error
                              : theme.colors.success
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {previousSpending.monthly > 0
                      ? currentSpending.monthly > previousSpending.monthly
                        ? "↗️ Spending Up"
                        : "↘️ Spending Down"
                      : "No previous data"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryItem,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryItemTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Yearly Trend
                  </Text>
                  <Text
                    style={[
                      styles.summaryItemValue,
                      {
                        color:
                          previousSpending.yearly > 0
                            ? currentSpending.yearly > previousSpending.yearly
                              ? theme.colors.error
                              : theme.colors.success
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {previousSpending.yearly > 0
                      ? currentSpending.yearly > previousSpending.yearly
                        ? "↗️ Spending Up"
                        : "↘️ Spending Down"
                      : "No previous data"}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.analyticsCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Title
                style={[styles.analyticsTitle, { color: theme.colors.text }]}
              >
                📊 Analytics & Insights
              </Title>

              {getCurrentExpenses().length > 0 && (
                <View style={styles.chartContainer}>
                  <Text
                    style={[
                      styles.chartLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {getCurrentPeriodLabel()} Expenses by Category
                  </Text>
                  <PieChart
                    data={preparePieChartData(getCurrentExpenses())}
                    width={width - 80}
                    height={200}
                    chartConfig={{
                      backgroundColor: theme.colors.surface,
                      backgroundGradientFrom: theme.colors.surface,
                      backgroundGradientTo: theme.colors.surface,
                      color: (opacity = 1) => `rgba(0, 137, 123, ${opacity})`,
                      labelColor: (opacity = 1) =>
                        `rgba(44, 62, 80, ${opacity})`,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              )}

              {getCurrentExpenses().length > 0 && (
                <View style={styles.chartContainer}>
                  <Text
                    style={[
                      styles.chartLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {getCurrentPeriodLabel()} Spending Trends
                  </Text>
                  <BarChart
                    data={prepareBarChartData(getCurrentExpenses())}
                    width={width - 80}
                    height={200}
                    chartConfig={{
                      backgroundColor: theme.colors.surface,
                      backgroundGradientFrom: theme.colors.surface,
                      backgroundGradientTo: theme.colors.surface,
                      decimalPlaces: 2,
                      color: (opacity = 1) => `rgba(67, 160, 71, ${opacity})`,
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                </View>
              )}

              <View
                style={[
                  styles.insightsContainer,
                  { borderTopColor: theme.colors.border || "#e0e0e0" },
                ]}
              >
                <Text
                  style={[styles.insightsTitle, { color: theme.colors.text }]}
                >
                  💡 Quick Insights
                </Text>
                <View style={styles.insightItem}>
                  <MaterialIcons
                    name="trending-up"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.insightText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Top category:{" "}
                    {getCurrentExpenses().length > 0
                      ? Object.entries(
                          getCurrentExpenses().reduce((acc, exp) => {
                            acc[exp.category || "General"] =
                              (acc[exp.category || "General"] || 0) +
                              exp.amount;
                            return acc;
                          }, {})
                        ).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
                      : "None"}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <MaterialIcons
                    name="calendar-today"
                    size={20}
                    color={theme.colors.secondary}
                  />
                  <Text
                    style={[
                      styles.insightText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Average{" "}
                    {activeTab === "daily"
                      ? "hourly"
                      : activeTab === "weekly"
                        ? "daily"
                        : activeTab === "monthly"
                          ? "daily"
                          : "daily"}{" "}
                    spending: $
                    {getCurrentExpenses().length > 0
                      ? (
                          calculateTotal(getCurrentExpenses()) /
                          getCurrentPeriodDays()
                        ).toFixed(2)
                      : "0.00"}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.expensesCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                {getCurrentPeriodLabel()} Expenses
              </Title>
              {getCurrentExpenses().length === 0 ? (
                <Text
                  style={[
                    styles.noExpenses,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No expenses logged{" "}
                  {activeTab === "daily"
                    ? "today"
                    : `this ${activeTab.slice(0, -2)}`}
                </Text>
              ) : (
                getCurrentExpenses().map((expense) => (
                  <View
                    key={expense.id}
                    style={[
                      styles.expenseItem,
                      { borderBottomColor: theme.colors.border || "#f0f0f0" },
                    ]}
                  >
                    <View style={styles.expenseLeft}>
                      <MaterialIcons
                        name={getCategoryIcon(expense.category)}
                        size={24}
                        color="#2196F3"
                        style={styles.expenseIcon}
                      />
                      <View>
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
                    </View>
                    <Text
                      style={[
                        styles.expenseAmount,
                        { color: theme.colors.primary },
                      ]}
                    >
                      ${expense.amount.toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.summaryCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.text }]}>
                {getCurrentPeriodLabel()} Summary
              </Title>
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Total Expenses:
                </Text>
                <Text
                  style={[styles.summaryValue, { color: theme.colors.text }]}
                >
                  ${getCurrentExpensesTotal().toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Days Tracked:
                </Text>
                <Text
                  style={[styles.summaryValue, { color: theme.colors.text }]}
                >
                  {new Set(getCurrentExpenses().map((e) => e.date)).size}/
                  {getCurrentPeriodDays()}
                </Text>
              </View>
              <Text
                style={[
                  styles.summaryNote,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {activeTab === "monthly"
                  ? `📅 ${getCurrentPeriodDays()} days in ${format(new Date(), "MMMM")}`
                  : activeTab === "yearly"
                    ? `📅 ${getCurrentPeriodDays()} days in ${new Date().getFullYear()}${isLeapYear(new Date().getFullYear()) ? " (Leap Year)" : ""}`
                    : ""}
              </Text>
            </Card.Content>
          </Card>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 18,
    color: "#ffffff",
    opacity: 0.9,
    textAlign: "right",
    top:7
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
  guideCard: {
    marginTop: 5,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  guideContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  guideText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  guideHighlight: {
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: "#00897B",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  activeTabLabel: {},
  statsContainer: {
    flexDirection: "row",
    padding: 10,
    gap: 15,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    elevation: 4,
    borderRadius: 12,
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  expensesCard: {
    marginTop: 5,
    marginHorizontal: 20,
    marginBottom: -4,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  noExpenses: {
    textAlign: "center",
    fontStyle: "italic",
    padding: 20,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expenseIcon: {
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryCard: {
    marginTop: 5,
    marginHorizontal: 20,
    marginBottom: 10,
    elevation: 4,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryNote: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },

  budgetCard: {
    marginHorizontal: 20,
    marginBottom: -5,
    elevation: 4,
    borderRadius: 12,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  budgetItem: {
    marginBottom: 20,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  budgetProgress: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },

  analyticsCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    elevation: 4,
    borderRadius: 12,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  chartContainer: {
    marginBottom: 25,
    alignItems: "center",
  },
  chartLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  insightsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  summaryCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 4,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  summaryItem: {
    width: "48%",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  summaryItemTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  summaryItemValue: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default HomeScreen;
