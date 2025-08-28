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

const IncomeScreen = () => {
  const { addIncome, getIncomeByDateRange, getAllIncome, deleteIncome } =
    useDatabase();
  const { theme, isDarkMode } = useTheme();

  const [income, setIncome] = useState([]);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addIncomeModalVisible, setAddIncomeModalVisible] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: "",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [dateRange, setDateRange] = useState("month");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [editIncomeModalVisible, setEditIncomeModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    loadIncome();
  }, [dateRange]);

  useEffect(() => {
    filterIncome();
  }, [income, searchQuery, selectedFilter]);

  const loadIncome = async () => {
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
          startDate = "2020-01-01";
      }

      if (dateRange === "all") {
        const allIncome = await getAllIncome();
        setIncome(allIncome);
      } else {
        const incomeData = await getIncomeByDateRange(startDate, endDate);
        setIncome(incomeData);
      }
    } catch (error) {
      setIncome([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncome();
    setRefreshing(false);
  };

  const filterIncome = () => {
    let filtered = income;

    if (searchQuery) {
      filtered = filtered.filter(
        (income) =>
          income.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          income.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          income.source?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (income) => income.category === selectedFilter
      );
    }

    setFilteredIncome(filtered);
  };

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const handleEditIncome = (income) => {
    setEditingIncome({
      id: income.id,
      amount: income.amount.toString(),
      description: income.description,
      category: income.category || "General",
      source: income.source || income.description,
    });
    setEditIncomeModalVisible(true);
    setActionsModalVisible(false);
  };

  const handleDeleteIncome = async (income) => {
    setSelectedIncome(income);
    setDeleteConfirmVisible(true);
    setActionsModalVisible(false);
  };

  const confirmDeleteIncome = async () => {
    try {
      await deleteIncome(selectedIncome.id);
      await loadIncome();
      showSnackbar("Income deleted successfully!", "success");
      setDeleteConfirmVisible(false);
      setSelectedIncome(null);
    } catch (error) {
      showSnackbar("Failed to delete income. Please try again.", "error");
    }
  };

  const handleUpdateIncome = async () => {
    if (!editingIncome.amount || !editingIncome.description) {
      showSnackbar("Please fill in all required fields.", "error");
      return;
    }

    if (!/^\d*\.?\d{0,2}$/.test(editingIncome.amount)) {
      showSnackbar("Please enter a valid amount.", "error");
      return;
    }

    const amount = parseFloat(editingIncome.amount);
    if (isNaN(amount) || amount <= 0) {
      showSnackbar("Please enter a valid amount greater than 0.", "error");
      return;
    }

    try {
      setEditIncomeModalVisible(false);
      setEditingIncome(null);
      await loadIncome();
      showSnackbar("Income updated successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to update income. Please try again.", "error");
    }
  };

  const openActionsModal = (income) => {
    setSelectedIncome(income);
    setActionsModalVisible(true);
  };

  const handleAddIncome = async () => {
    if (!newIncome.amount || !newIncome.description) {
      showSnackbar("Please fill in all required fields.", "error");
      return;
    }

    if (!/^\d*\.?\d{0,2}$/.test(newIncome.amount)) {
      showSnackbar("Please enter a valid amount.", "error");
      return;
    }

    const amount = parseFloat(newIncome.amount);
    if (isNaN(amount) || amount <= 0) {
      showSnackbar("Please enter a valid amount greater than 0.", "error");
      return;
    }

    try {
      await addIncome(
        amount,
        newIncome.description,
        "General",
        newIncome.description,
        format(new Date(), "yyyy-MM-dd")
      );

      setNewIncome({ amount: "", description: "" });
      setAddIncomeModalVisible(false);

      await loadIncome();

      showSnackbar("Income added successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to add income. Please try again.", "error");
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Salary: "work",
      Freelance: "computer",
      Investment: "trending-up",
      Gift: "card-giftcard",
      Bonus: "stars",
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
    if (!filteredIncome || filteredIncome.length === 0) return 0;
    return filteredIncome.reduce(
      (total, income) => total + (income.amount || 0),
      0
    );
  };

  const getUniqueCategories = () => {
    if (!income || income.length === 0) return [];
    const categories = [
      ...new Set(income.map((income) => income.category || "General")),
    ];
    return categories.sort();
  };

  const groupIncomeByDate = () => {
    if (!filteredIncome || filteredIncome.length === 0) return {};
    const grouped = {};
    filteredIncome.forEach((income) => {
      const date = income.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(income);
    });
    return grouped;
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Income</Text>
        <Text style={styles.headerSubtitle}>
          Total: GHC {getTotalAmount().toFixed(2)}
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
            placeholder="Search income..."
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
          {filteredIncome.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="trending-up" size={64} color="#999" />
              <Text style={styles.emptyStateText}>No income found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Add your first income to get started"}
              </Text>
            </View>
          ) : (
            Object.entries(groupIncomeByDate()).map(([date, dateIncome]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{getDateLabel(date)}</Text>
                {dateIncome.map((income) => (
                  <Card
                    key={income.id}
                    style={[
                      styles.incomeCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <Card.Content>
                      <View style={styles.incomeHeader}>
                        <View style={styles.incomeLeft}>
                          <View style={styles.incomeInfo}>
                            <Text
                              style={[
                                styles.incomeDescription,
                                { color: theme.colors.text },
                              ]}
                            >
                              {income.description}
                            </Text>
                            <Text style={styles.incomeAmount}>
                              +GHC {income.amount.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.incomeRight}>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border || "#e0e0e0",
                              },
                            ]}
                            onPress={() => openActionsModal(income)}
                          >
                            <MaterialIcons
                              name="more-vert"
                              size={20}
                              color={theme.colors.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setAddIncomeModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={addIncomeModalVisible}
          onDismiss={() => setAddIncomeModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#90EE90",
              marginTop: -80,
            },
          ]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.text }]}>
            Add Income
          </Title>
          <Text
            style={[
              styles.modalSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Enter the amount and describe the income source
          </Text>

          <TextInput
            label="Amount"
            value={newIncome.amount}
            onChangeText={(text) => {
              const numericText = text.replace(/[^0-9.]/g, "");
              const parts = numericText.split(".");
              if (parts.length <= 2) {
                setNewIncome({ ...newIncome, amount: numericText });
              }
            }}
            keyboardType="numeric"
            mode="outlined"
            style={[
              styles.modalInput,
              { backgroundColor: theme.colors.surface },
              newIncome.amount &&
                !/^\d*\.?\d{0,2}$/.test(newIncome.amount) &&
                styles.errorInput,
            ]}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            left={<TextInput.Affix text="GHC" />}
            error={
              newIncome.amount && !/^\d*\.?\d{0,2}$/.test(newIncome.amount)
            }
            theme={{
              colors: {
                primary: theme.colors.primary,
                text: theme.colors.text,
                placeholder: theme.colors.textSecondary,
              },
            }}
          />

          {newIncome.amount && !/^\d*\.?\d{0,2}$/.test(newIncome.amount) && (
            <Text
              style={[styles.validationError, { color: theme.colors.error }]}
            >
              Please enter a valid amount (e.g., 100.50)
            </Text>
          )}

          <TextInput
            label="Description/Source"
            value={newIncome.description}
            onChangeText={(text) =>
              setNewIncome({ ...newIncome, description: text })
            }
            mode="outlined"
            style={[
              styles.modalInput,
              { backgroundColor: theme.colors.surface },
            ]}
            placeholder="Salary from Company, Freelance work, etc."
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
              onPress={() => setAddIncomeModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.text}
              buttonColor={theme.colors.surface}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddIncome}
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
            Income Actions
          </Title>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={[
                styles.actionItem,
                { borderBottomColor: theme.colors.border || "#e0e0e0" },
              ]}
              onPress={() => handleEditIncome(selectedIncome)}
            >
              <MaterialIcons name="edit" size={24} color="#2196F3" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Edit Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleDeleteIncome(selectedIncome)}
            >
              <MaterialIcons name="delete" size={24} color="#F44336" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Delete Income
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={editIncomeModalVisible}
          onDismiss={() => setEditIncomeModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#90EE90",
              marginTop: -80,
            },
          ]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.text }]}>
            Edit Income
          </Title>
          <Text
            style={[
              styles.modalSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Update the income details
          </Text>

          <TextInput
            label="Amount"
            value={editingIncome?.amount || ""}
            onChangeText={(text) => {
              const numericText = text.replace(/[^0-9.]/g, "");
              const parts = numericText.split(".");
              if (parts.length <= 2) {
                setEditingIncome({ ...editingIncome, amount: numericText });
              }
            }}
            keyboardType="numeric"
            mode="outlined"
            style={[
              styles.modalInput,
              { backgroundColor: theme.colors.surface },
              editingIncome?.amount &&
                !/^\d*\.?\d{0,2}$/.test(editingIncome.amount) &&
                styles.errorInput,
            ]}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            left={<TextInput.Affix text="GHC" />}
            error={
              editingIncome?.amount &&
              !/^\d*\.?\d{0,2}$/.test(editingIncome.amount)
            }
            theme={{
              colors: {
                primary: theme.colors.primary,
                text: theme.colors.text,
                placeholder: theme.colors.textSecondary,
              },
            }}
          />

          <TextInput
            label="Description/Source"
            value={editingIncome?.description || ""}
            onChangeText={(text) =>
              setEditingIncome({ ...editingIncome, description: text })
            }
            mode="outlined"
            style={[
              styles.modalInput,
              { backgroundColor: theme.colors.surface },
            ]}
            placeholder="Salary from Company, Freelance work, etc."
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
              onPress={() => setEditIncomeModalVisible(false)}
              style={styles.modalButton}
              textColor={theme.colors.text}
              buttonColor={theme.colors.surface}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateIncome}
              style={styles.modalButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.surface}
            >
              Update
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          contentContainerStyle={[
            styles.deleteConfirmModal,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: "#F44336",
            },
          ]}
        >
          <Title
            style={[styles.deleteConfirmTitle, { color: theme.colors.text }]}
          >
            Delete Income
          </Title>
          <Text
            style={[
              styles.deleteConfirmText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Are you sure you want to delete "{selectedIncome?.description}"?
          </Text>
          <Text style={[styles.deleteConfirmAmount, { color: "#F44335" }]}>
            GHC {selectedIncome?.amount?.toFixed(2)}
          </Text>
          <Text style={[styles.deleteConfirmWarning, { color: "#F44335" }]}>
            This action cannot be undone.
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <Button
              mode="outlined"
              onPress={() => setDeleteConfirmVisible(false)}
              style={styles.deleteConfirmButton}
              textColor={theme.colors.text}
              buttonColor={theme.colors.surface}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmDeleteIncome}
              style={styles.deleteConfirmButton}
              buttonColor="#F44335"
              textColor="#FFFFFF"
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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
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
  filtersContainer: {
    padding: 15,
    margin: 10,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  searchBar: {
    marginBottom: 15,
    elevation: 2,
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
  scrollView: {
    flex: 1,
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
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  incomeCard: {
    margin: 10,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 8,
  },
  incomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  incomeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  incomeInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 10,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  incomeCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  incomeSource: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  incomeTime: {
    fontSize: 10,
    color: "#999",
  },
  incomeRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#4CAF50",
  },
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    marginBottom: 15,
  },
  errorInput: {
    borderColor: "#F44336",
  },
  validationError: {
    color: "#F44336",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 4,
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
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
  deleteConfirmModal: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxWidth: 350,
    alignSelf: "center",
  },
  deleteConfirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  deleteConfirmText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 22,
  },
  deleteConfirmAmount: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  deleteConfirmWarning: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  deleteConfirmButton: {
    flex: 1,
  },
});

export default IncomeScreen;
