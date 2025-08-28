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
import { useTheme } from "../context/ThemeContext";

const ExpensesScreen = () => {
  const { getExpensesByDateRange, updateExpense, deleteExpense, addExpense } =
    useDatabase();
  const { theme, isDarkMode } = useTheme();

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
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    description: "",
    category: "",
    paymentMethod: "Cash",
  });
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

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
        case "day":
          startDate = format(new Date(), "yyyy-MM-dd");
          break;
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
    } catch (error) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchQuery) {
      filtered = filtered.filter(
        (expense) =>
          expense.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          expense.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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
    setActionsModalVisible(false);
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
      showSnackbar("Failed to update expense. Please try again.", "error");
    }
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
        "General",
        format(new Date(), "yyyy-MM-dd"),
        "Cash"
      );

      setNewExpense({
        amount: "",
        description: "",
        category: "",
        paymentMethod: "Cash",
      });
      setAddExpenseModalVisible(false);
      await loadExpenses();

      showSnackbar("Expense added successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to add expense. Please try again.", "error");
    }
  };

  const openActionsModal = (expense) => {
    setSelectedExpense(expense);
    setActionsModalVisible(true);
  };

  const openDeleteConfirmation = (expense) => {
    setSelectedExpense(expense);
    setDeleteConfirmVisible(true);
    setActionsModalVisible(false);
  };

  const confirmDeleteExpense = async () => {
    try {
      if (!selectedExpense || !selectedExpense.id) {
        showSnackbar("Invalid expense data", "error");
        return;
      }

      await deleteExpense(selectedExpense.id);
      await loadExpenses();
      setDeleteConfirmVisible(false);
      setSelectedExpense(null);
      showSnackbar("Expense deleted successfully!", "success");
    } catch (error) {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <Text style={styles.headerSubtitle}>
          Total: ${getTotalAmount().toFixed(2)}
        </Text>
      </View>

      <View
        style={[
          styles.contentContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View
          style={[
            styles.filtersContainer,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#90EE90",
            },
          ]}
        >
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
              { key: "day", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
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

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={64} color="#ccc" />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No expenses found
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Add your first expense to get started"}
              </Text>
            </View>
          ) : (
            Object.entries(groupExpensesByDate()).map(
              ([date, dateExpenses]) => (
                <View key={date} style={styles.dateGroup}>
                  <Text
                    style={[
                      styles.dateHeader,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {getDateLabel(date)}
                  </Text>
                  {dateExpenses.map((expense) => (
                    <Card
                      key={expense.id}
                      style={[
                        styles.expenseCard,
                        { backgroundColor: theme.colors.surface },
                      ]}
                    >
                      <Card.Content>
                        <View style={styles.expenseHeader}>
                          <Text
                            style={[
                              styles.expenseDescription,
                              { color: theme.colors.text },
                            ]}
                          >
                            {expense.description}
                          </Text>
                          <Text style={styles.expenseAmount}>
                            ${expense.amount.toFixed(2)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => openActionsModal(expense)}
                            style={styles.actionButton}
                          >
                            <View style={styles.actionButtonBorder}>
                              <MaterialIcons
                                name="more-vert"
                                size={24}
                                color={theme.colors.textSecondary}
                              />
                            </View>
                          </TouchableOpacity>
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

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setAddExpenseModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#90EE90",
            },
          ]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.text }]}>
            Edit Expense
          </Title>

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

      <Portal>
        <Modal
          visible={addExpenseModalVisible}
          onDismiss={() => setAddExpenseModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#90EE90",
              marginTop: -120,
            },
          ]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.text }]}>
            Add Expense
          </Title>

          <TextInput
            label="Amount"
            value={newExpense.amount}
            onChangeText={(text) =>
              setNewExpense({ ...newExpense, amount: text })
            }
            keyboardType="numeric"
            mode="outlined"
            style={[
              styles.modalInput,
              { backgroundColor: theme.colors.surface },
            ]}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            theme={{
              colors: {
                primary: theme.colors.primary,
                text: theme.colors.text,
                placeholder: theme.colors.textSecondary,
              },
            }}
          />

          <TextInput
            label="Description"
            value={newExpense.description}
            onChangeText={(text) =>
              setNewExpense({ ...newExpense, description: text })
            }
            mode="outlined"
            style={[
              styles.modalInput,
              { backgroundColor: theme.colors.surface },
            ]}
            placeholder="What did you spend on?"
            placeholderTextColor={theme.colors.textSecondary}
            theme={{
              colors: {
                primary: theme.colors.primary,
                text: theme.colors.text,
                placeholder: theme.colors.textSecondary,
              },
            }}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setAddExpenseModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.text}
              buttonColor={theme.colors.surface}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddExpense}
              style={styles.modalButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.surface}
            >
              Add
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={actionsModalVisible}
          onDismiss={() => setActionsModalVisible(false)}
          contentContainerStyle={[
            styles.actionsModal,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#90EE90",
            },
          ]}
        >
          <Title
            style={[styles.actionsModalTitle, { color: theme.colors.text }]}
          >
            Expense Actions
          </Title>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={[
                styles.actionItem,
                { borderBottomColor: theme.colors.border || "#e0e0e0" },
              ]}
              onPress={() => handleEditExpense(selectedExpense)}
            >
              <MaterialIcons name="edit" size={24} color="#2196F3" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Edit Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => openDeleteConfirmation(selectedExpense)}
            >
              <MaterialIcons name="delete" size={24} color="#F44336" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Delete Expense
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#F44336",
            },
          ]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.text }]}>
            Delete Expense
          </Title>

          <Text style={[styles.confirmText, { color: theme.colors.text }]}>
            Are you sure you want to delete "{selectedExpense?.description}"?
          </Text>

          <Text style={[styles.confirmAmount, { color: theme.colors.text }]}>
            Amount: ${selectedExpense?.amount?.toFixed(2)}
          </Text>

          <Text style={[styles.confirmWarning, { color: "#F44336" }]}>
            This action cannot be undone.
          </Text>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setDeleteConfirmVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.text}
              buttonColor={theme.colors.surface}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmDeleteExpense}
              style={styles.modalButton}
              buttonColor="#F44336"
              textColor={theme.colors.surface}
            >
              Delete
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
    paddingVertical: 8,
  },
  expenseDescription: {
    fontSize: 17,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    marginRight: 15,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2196F3",
    marginRight: 15,
  },
  actionButton: {
    padding: 4,
  },
  actionButtonBorder: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderRadius: 20,
    padding: 4,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
  },
  actionsModal: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxWidth: 300,
    alignSelf: "center",
  },
  actionsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  actionsList: {
    gap: 0,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    gap: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  confirmAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  confirmWarning: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default ExpensesScreen;
