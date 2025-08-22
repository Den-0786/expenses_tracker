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
  const { addIncome, getExpensesByDateRange } = useDatabase();

  const [income, setIncome] = useState([]);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addIncomeModalVisible, setAddIncomeModalVisible] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: "",
    description: "",
    category: "",
    source: "",
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

      // For now, we'll use mock data since we don't have getIncomeByDateRange yet
      const mockIncome = [
        {
          id: 1,
          amount: 5000,
          description: "Monthly Salary",
          category: "Salary",
          source: "Company Inc.",
          date: "2024-01-15",
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: 2,
          amount: 500,
          description: "Freelance Project",
          category: "Freelance",
          source: "Client ABC",
          date: "2024-01-20",
          created_at: "2024-01-20T14:00:00Z",
        },
      ];

      setIncome(mockIncome.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Error loading income:", error);
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

    try {
      await addIncome(
        parseFloat(newIncome.amount),
        newIncome.description,
        newIncome.category || "General",
        newIncome.source || "Unknown",
        format(new Date(), "yyyy-MM-dd")
      );

      setNewIncome({ amount: "", description: "", category: "", source: "" });
      setAddIncomeModalVisible(false);
      await loadIncome();

      showSnackbar("Income added successfully!", "success");
    } catch (error) {
      console.error("Error adding income:", error);
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
    return filteredIncome.reduce((total, income) => total + income.amount, 0);
  };

  const getUniqueCategories = () => {
    const categories = [
      ...new Set(income.map((income) => income.category || "General")),
    ];
    return categories.sort();
  };

  const groupIncomeByDate = () => {
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

          <TextInput
            label="Amount"
            value={newIncome.amount}
            onChangeText={(text) =>
              setNewIncome({ ...newIncome, amount: text })
            }
            keyboardType="numeric"
            mode="outlined"
            style={styles.modalInput}
            placeholder="0.00"
          />

          <TextInput
            label="Description"
            value={newIncome.description}
            onChangeText={(text) =>
              setNewIncome({ ...newIncome, description: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="What is this income for?"
          />

          <TextInput
            label="Category (Optional)"
            value={newIncome.category}
            onChangeText={(text) =>
              setNewIncome({ ...newIncome, category: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="Salary, Freelance, etc."
          />

          <TextInput
            label="Source (Optional)"
            value={newIncome.source}
            onChangeText={(text) =>
              setNewIncome({ ...newIncome, source: text })
            }
            mode="outlined"
            style={styles.modalInput}
            placeholder="Company name, client, etc."
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

export default IncomeScreen;
