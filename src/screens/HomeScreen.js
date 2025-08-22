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
  FAB,
  Portal,
  Modal,
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
import { useBudget } from "../context/BudgetContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const navigation = useNavigation();
  const {
    getUserSettings,
    getExpensesByDate,
    getExpensesByDateRange,
    addExpense,
  } = useDatabase();
  const { sendImmediateNotification } = useNotifications();
  const { getBudgetProgress, getBudgetStatus, getRemainingBudget } =
    useBudget();
  const { theme, isDarkMode } = useTheme();

  const [userSettings, setUserSettings] = useState(null);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [weeklyExpenses, setWeeklyExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [yearlyExpenses, setYearlyExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    description: "",
    category: "",
    paymentMethod: "Cash",
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [activeTab, setActiveTab] = useState("daily"); // daily, weekly, monthly, yearly

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);

      const today = format(new Date(), "yyyy-MM-dd");
      const todayExp = await getExpensesByDate(today);
      setTodayExpenses(todayExp);

      // Weekly expenses
      const weekStart = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      const weekEnd = format(
        endOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      const weekExp = await getExpensesByDateRange(weekStart, weekEnd);
      setWeeklyExpenses(weekExp);

      // Monthly expenses
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const monthExp = await getExpensesByDateRange(monthStart, monthEnd);
      setMonthlyExpenses(monthExp);

      // Yearly expenses
      const yearStart = format(
        new Date(new Date().getFullYear(), 0, 1),
        "yyyy-MM-dd"
      );
      const yearEnd = format(
        new Date(new Date().getFullYear(), 11, 31),
        "yyyy-MM-dd"
      );
      const yearExp = await getExpensesByDateRange(yearStart, yearEnd);
      setYearlyExpenses(yearExp);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) {
      showSnackbar("Please fill in all required fields.", "error");
      return;
    }

    try {
      await addExpense(
        parseFloat(newExpense.amount),
        newExpense.description,
        newExpense.category || "General",
        format(new Date(), "yyyy-MM-dd"),
        newExpense.paymentMethod
      );

      setNewExpense({
        amount: "",
        description: "",
        category: "",
        paymentMethod: "Cash",
      });
      setAddExpenseVisible(false);
      await loadData();

      // Send notification
      await sendImmediateNotification(
        "Expense Added",
        `Added ${newExpense.description} for $${newExpense.amount}`
      );

      showSnackbar("Expense added successfully!", "success");
    } catch (error) {
      console.error("Error adding expense:", error);
      showSnackbar("Failed to add expense. Please try again.", "error");
    }
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

  // Helper functions to get current data based on active tab
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

  const getCurrentPeriodDays = () => {
    switch (activeTab) {
      case "daily":
        return 1;
      case "weekly":
        return 7;
      case "monthly":
        return new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
        ).getDate();
      case "yearly":
        return new Date(new Date().getFullYear(), 11, 31).getDate();
      default:
        return 1;
    }
  };

  // Chart data preparation functions
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
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </Text>
      </View>

      {/* Main Content Container - Gray Parent Card */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Setup Account Button */}
          <Card style={styles.setupCard}>
            <Card.Content>
              <View style={styles.setupHeader}>
                <View style={styles.setupInfo}>
                  <Title style={styles.setupTitle}>⚙️ Account Setup</Title>
                  <Text style={styles.setupSubtitle}>
                    Configure your payment frequency, amount, and tithing
                    preferences
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("Onboarding")}
                  icon="account-cog"
                  buttonColor={theme.colors.secondary}
                  textColor="#FFFFFF"
                  compact
                >
                  Setup
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* User Guide */}
          <Card style={styles.guideCard}>
            <Card.Content>
              <View style={styles.guideContainer}>
                <MaterialIcons
                  name="info"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.guideText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  💡 Click the{" "}
                  <Text
                    style={[
                      styles.guideHighlight,
                      { color: theme.colors.accent },
                    ]}
                  >
                    + button
                  </Text>{" "}
                  at the bottom right to add new expenses
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Time Period Tabs */}
          <View style={styles.tabContainer}>
            {[
              { key: "daily", label: "Daily", icon: "today" },
              { key: "weekly", label: "Weekly", icon: "view-week" },
              { key: "monthly", label: "Monthly", icon: "calendar-month" },
              { key: "yearly", label: "Yearly", icon: "calendar" },
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
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Title style={styles.statTitle}>
                  {getCurrentPeriodLabel()} Expenses
                </Title>
                <Text style={styles.statAmount}>
                  ${getCurrentExpensesTotal().toFixed(2)}
                </Text>
                <Text style={styles.statSubtitle}>
                  {getCurrentExpenses().length} items
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Title style={styles.statTitle}>Remaining</Title>
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
                <Text style={styles.statSubtitle}>
                  Available{" "}
                  {activeTab === "daily"
                    ? "today"
                    : `this ${activeTab.slice(0, -2)}`}
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Budget Progress */}
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

              {/* Current Period Budget */}
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
                <View style={styles.progressBarContainer}>
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

          {/* Analytics Section */}
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

              {/* Category Breakdown - Pie Chart */}
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

              {/* Spending Trends - Bar Chart */}
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

              {/* Quick Insights */}
              <View style={styles.insightsContainer}>
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

          {/* Current Period Expenses */}
          <Card style={styles.expensesCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>
                {getCurrentPeriodLabel()} Expenses
              </Title>
              {getCurrentExpenses().length === 0 ? (
                <Text style={styles.noExpenses}>
                  No expenses logged{" "}
                  {activeTab === "daily"
                    ? "today"
                    : `this ${activeTab.slice(0, -2)}`}
                </Text>
              ) : (
                getCurrentExpenses().map((expense) => (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseLeft}>
                      <MaterialIcons
                        name={getCategoryIcon(expense.category)}
                        size={24}
                        color="#2196F3"
                        style={styles.expenseIcon}
                      />
                      <View>
                        <Text style={styles.expenseDescription}>
                          {expense.description}
                        </Text>
                        <Text style={styles.expenseCategory}>
                          {expense.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.expenseAmount}>
                      ${expense.amount.toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          {/* Current Period Summary */}
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>
                {getCurrentPeriodLabel()} Summary
              </Title>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Expenses:</Text>
                <Text style={styles.summaryValue}>
                  ${getCurrentExpensesTotal().toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Days Tracked:</Text>
                <Text style={styles.summaryValue}>
                  {new Set(getCurrentExpenses().map((e) => e.date)).size}/
                  {getCurrentPeriodDays()}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>

      {/* Add Expense FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setAddExpenseVisible(true)}
      />

      {/* Add Expense Modal */}
      <Portal>
        <Modal
          visible={addExpenseVisible}
          onDismiss={() => setAddExpenseVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Add Expense</Title>

          <TextInput
            label="Amount"
            value={newExpense.amount}
            onChangeText={(text) =>
              setNewExpense({ ...newExpense, amount: text })
            }
            keyboardType="numeric"
            mode="outlined"
            style={styles.modalInput}
            placeholder="0.00"
          />

          <TextInput
            label="Description"
            value={newExpense.description}
            onChangeText={(text) =>
              setNewExpense({ ...newExpense, description: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="What did you spend on?"
          />

          <TextInput
            label="Category (Optional)"
            value={newExpense.category}
            onChangeText={(text) =>
              setNewExpense({ ...newExpense, category: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="Food, Transport, etc."
          />

          <TextInput
            label="Payment Method"
            value={newExpense.paymentMethod}
            onChangeText={(text) =>
              setNewExpense({ ...newExpense, paymentMethod: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="Cash, Credit Card, etc."
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setAddExpenseVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddExpense}
              style={styles.modalButton}
            >
              Add
            </Button>
          </View>
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
  guideCard: {
    margin: 10,
    marginTop: 5,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "#ffffff",
    marginHorizontal: 10,
    marginBottom: 10,
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
    color: "#6C757D", 
  },
  activeTabLabel: {
    color: "#ffffff",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 10,
    gap: 15,
  },
  statCard: {
    flex: 1,
    elevation: 4,
    borderRadius: 12,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  expensesCard: {
    margin: 20,
    marginTop: 5,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  noExpenses: {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    padding: 20,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    color: "#333",
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: "#666",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
  summaryCard: {
    margin: 20,
    marginTop: 5,
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
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    marginBottom: 15,
    backgroundColor: "#ffffff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  budgetCard: {
    margin: 20,
    marginBottom: 15,
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
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
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
  // Analytics styles
  analyticsCard: {
    margin: 20,
    marginBottom: 15,
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
    borderTopColor: "#e0e0e0",
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
});

export default HomeScreen;
