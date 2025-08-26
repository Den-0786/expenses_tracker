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

const IncomeScreen = () => {
  const { addIncome, getIncomeByDateRange, getAllIncome } = useDatabase();

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
  const [dateRange, setDateRange] = useState("month"); // week, month, all
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

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
          startDate = "2020-01-01"; // All time
      }

      // Load income data based on date range
      if (dateRange === "all") {
        const allIncome = await getAllIncome();
        setIncome(allIncome);
      } else {
        const incomeData = await getIncomeByDateRange(startDate, endDate);
        setIncome(incomeData);
      }
    } catch (error) {
      // Silently handle error
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

    // Apply search filter
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

    // Apply category filter
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

  const handleAddIncome = async () => {
    if (!newIncome.amount || !newIncome.description) {
      showSnackbar("Please fill in all required fields.", "error");
      return;
    }

    // Validate amount format
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
        "General", // Default category
        newIncome.description, // Use description as source
        format(new Date(), "yyyy-MM-dd")
      );

      setNewIncome({ amount: "", description: "" });
      setAddIncomeModalVisible(false);

      // Refresh income data to show the newly added income
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
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Income</Text>
        <Text style={styles.headerSubtitle}>
          Total: ${getTotalAmount().toFixed(2)}
        </Text>
      </View>

      {/* Main Content Container - Gray Parent Card */}
      <View style={styles.contentContainer}>
        {/* Sticky Filters */}
        <View style={styles.filtersContainer}>
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

        {/* Scrollable Income List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredIncome.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="trending-up" size={64} color="#ccc" />
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
                  <Card key={income.id} style={styles.incomeCard}>
                    <Card.Content>
                      <View style={styles.incomeHeader}>
                        <View style={styles.incomeLeft}>
                          <MaterialIcons
                            name={getCategoryIcon(income.category)}
                            size={24}
                            color="#4CAF50"
                            style={styles.incomeIcon}
                          />
                          <View style={styles.incomeInfo}>
                            <Text style={styles.incomeDescription}>
                              {income.description}
                            </Text>
                            <Text style={styles.incomeCategory}>
                              {income.category || "General"}
                            </Text>
                            <Text style={styles.incomeSource}>
                              {income.source || "Unknown"}
                            </Text>
                            <Text style={styles.incomeTime}>
                              {format(parseISO(income.created_at), "h:mm a")}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.incomeRight}>
                          <Text style={styles.incomeAmount}>
                            +${income.amount.toFixed(2)}
                          </Text>
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

      {/* Add Income FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setAddIncomeModalVisible(true)}
      />

      {/* Add Income Modal */}
      <Portal>
        <Modal
          visible={addIncomeModalVisible}
          onDismiss={() => setAddIncomeModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Add Income</Title>
          <Text style={styles.modalSubtitle}>
            Enter the amount and describe the income source
          </Text>

          <TextInput
            label="Amount"
            value={newIncome.amount}
            onChangeText={(text) => {
              // Real-time validation: only allow numbers, decimal point, and backspace
              const numericText = text.replace(/[^0-9.]/g, "");
              // Ensure only one decimal point
              const parts = numericText.split(".");
              if (parts.length <= 2) {
                setNewIncome({ ...newIncome, amount: numericText });
              }
            }}
            keyboardType="numeric"
            mode="outlined"
            style={[
              styles.modalInput,
              newIncome.amount &&
                !/^\d*\.?\d{0,2}$/.test(newIncome.amount) &&
                styles.errorInput,
            ]}
            placeholder="0.00"
            left={<TextInput.Affix text="$" />}
            error={
              newIncome.amount && !/^\d*\.?\d{0,2}$/.test(newIncome.amount)
            }
          />

          {newIncome.amount && !/^\d*\.?\d{0,2}$/.test(newIncome.amount) && (
            <Text style={styles.validationError}>
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
            style={styles.modalInput}
            placeholder="Salary from Company, Freelance work, etc."
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setAddIncomeModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddIncome}
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
  incomeIcon: {
    marginRight: 12,
  },
  incomeInfo: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
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
    alignItems: "flex-end",
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#4CAF50",
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
    backgroundColor: "#ffffff",
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
});

export default IncomeScreen;
