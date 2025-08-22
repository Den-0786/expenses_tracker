import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Card,
  Title,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
  Searchbar,
  Snackbar,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from "date-fns";
import { useDatabase } from "../context/DatabaseContext";

const ExpensesScreen = () => {
  const { getExpensesByDateRange, updateExpense, deleteExpense } =
    useDatabase();

  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    category: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [dateRange, setDateRange] = useState("month"); // week, month, all
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  useEffect(() => {
    loadExpenses();
  }, [dateRange]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchQuery, selectedFilter]);

  const loadExpenses = async () => {
    try {
      const endDate = format(new Date(), "yyyy-MM-dd");
      let startDate;

      switch (dateRange) {
        case "week":
          startDate = format(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            "yyyy-MM-dd"
          );
          break;
        case "month":
          startDate = format(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            "yyyy-MM-dd"
          );
          break;
        default:
          startDate = "2020-01-01"; // All time
      }

      const expensesData = await getExpensesByDateRange(startDate, endDate);
      setExpenses(
        expensesData.sort((a, b) => new Date(b.date) - new Date(a.date))
      );
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const filterExpenses = () => {
    let filtered = expenses;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (expense) =>
          expense.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          expense.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.category === selectedFilter
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setEditForm({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category || "",
    });
    setEditModalVisible(true);
  };

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const handleUpdateExpense = async () => {
    if (!editForm.amount || !editForm.description) {
      showSnackbar("Please fill in all required fields.", "error");
      return;
    }

    try {
      await updateExpense(
        selectedExpense.id,
        parseFloat(editForm.amount),
        editForm.description,
        editForm.category || "General"
      );

      setEditModalVisible(false);
      setSelectedExpense(null);
      setEditForm({ amount: "", description: "", category: "" });
      await loadExpenses();

      showSnackbar("Expense updated successfully!", "success");
    } catch (error) {
      console.error("Error updating expense:", error);
      showSnackbar("Failed to update expense. Please try again.", "error");
    }
  };

  const handleDeleteExpense = async (expense) => {
    try {
      await deleteExpense(expense.id);
      await loadExpenses();
      showSnackbar("Expense deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting expense:", error);
      showSnackbar("Failed to delete expense. Please try again.", "error");
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

  const getDateLabel = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    if (isThisMonth(date)) return format(date, "MMM d");
    return format(date, "MMM d, yyyy");
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
  };

  const getUniqueCategories = () => {
    const categories = [
      ...new Set(expenses.map((expense) => expense.category || "General")),
    ];
    return categories.sort();
  };

  const groupExpensesByDate = () => {
    const grouped = {};
    filteredExpenses.forEach((expense) => {
      const date = expense.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(expense);
    });
    return grouped;
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <Text style={styles.headerSubtitle}>
          Total: ${getTotalAmount().toFixed(2)}
        </Text>
      </View>

      {/* Main Content Container - Gray Parent Card */}
      <View style={styles.contentContainer}>
        {/* Sticky Filters */}
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search expenses..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <Chip
              selected={selectedFilter === "all"}
              onPress={() => setSelectedFilter("all")}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
            >
              All
            </Chip>
            {getUniqueCategories().map((category) => (
              <Chip
                key={category}
                selected={selectedFilter === category}
                onPress={() => setSelectedFilter(category)}
                style={styles.filterChip}
                textStyle={styles.filterChipText}
              >
                {category}
              </Chip>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateFilterScroll}
          >
            {[
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "all", label: "All Time" },
            ].map((filter) => (
              <Chip
                key={filter.key}
                selected={dateRange === filter.key}
                onPress={() => setDateRange(filter.key)}
                style={styles.dateFilterChip}
                textStyle={styles.dateFilterChipText}
              >
                {filter.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Scrollable Expenses List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No expenses found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Add your first expense to get started"}
              </Text>
            </View>
          ) : (
            Object.entries(groupExpensesByDate()).map(
              ([date, dateExpenses]) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>{getDateLabel(date)}</Text>
                  {dateExpenses.map((expense) => (
                    <Card key={expense.id} style={styles.expenseCard}>
                      <Card.Content>
                        <View style={styles.expenseHeader}>
                          <View style={styles.expenseLeft}>
                            <MaterialIcons
                              name={getCategoryIcon(expense.category)}
                              size={24}
                              color="#2196F3"
                              style={styles.expenseIcon}
                            />
                            <View style={styles.expenseInfo}>
                              <Text style={styles.expenseDescription}>
                                {expense.description}
                              </Text>
                              <Text style={styles.expenseCategory}>
                                {expense.category || "General"}
                              </Text>
                              <Text style={styles.expenseTime}>
                                {format(parseISO(expense.created_at), "h:mm a")}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.expenseRight}>
                            <Text style={styles.expenseAmount}>
                              ${expense.amount.toFixed(2)}
                            </Text>
                            <View style={styles.expenseActions}>
                              <TouchableOpacity
                                onPress={() => handleEditExpense(expense)}
                                style={styles.actionButton}
                              >
                                <MaterialIcons
                                  name="edit"
                                  size={20}
                                  color="#666"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteExpense(expense)}
                                style={styles.actionButton}
                              >
                                <MaterialIcons
                                  name="delete"
                                  size={20}
                                  color="#F44336"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )
            )
          )}
        </ScrollView>
      </View>

      {/* Edit Expense Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Edit Expense</Title>

          <TextInput
            label="Amount"
            value={editForm.amount}
            onChangeText={(text) => setEditForm({ ...editForm, amount: text })}
            keyboardType="numeric"
            mode="outlined"
            style={styles.modalInput}
            placeholder="0.00"
          />

          <TextInput
            label="Description"
            value={editForm.description}
            onChangeText={(text) =>
              setEditForm({ ...editForm, description: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="What did you spend on?"
          />

          <TextInput
            label="Category"
            value={editForm.category}
            onChangeText={(text) =>
              setEditForm({ ...editForm, category: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="Food, Transport, etc."
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateExpense}
              style={styles.modalButton}
            >
              Update
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
    marginBottom: 1,
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
  scrollView: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: "#ffffff",
    padding: 15,
    margin: 10,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  searchBar: {
    marginBottom: 15,
    elevation: 2,
    padding: 0,
  },
  filterScroll: {
    marginBottom: 15,
  },
  filterChip: {
    marginRight: 10,
  },
  filterChipText: {
    fontSize: 12,
  },
  dateFilterScroll: {
    marginBottom: 10,
  },
  dateFilterChip: {
    marginRight: 10,
  },
  dateFilterChipText: {
    fontSize: 12,
  },
  expensesList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 0,
    paddingHorizontal: 5,
  },
  expenseCard: {
    margin: 7,
    marginBottom: 10,
    elevation: 2,
    borderRadius: 8,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expenseIcon: {
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 17,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  expenseTime: {
    fontSize: 10,
    color: "#999",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 4,
  },
  expenseActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
});

export default ExpensesScreen;
