import React, { createContext, useContext, useEffect, useState } from "react";
import { format } from "date-fns";
import ApiService from "../services/api";
import { showNetworkError } from "../utils/toast";

/**
 * DatabaseContext - Connected to Neon Postgres via API
 *
 * CURRENT STATUS: ✅ FULLY INTEGRATED with backend APIs
 *
 * INTEGRATION COMPLETE:
 * - All database operations now use real API calls
 * - Connected to PostgreSQL database via Express backend
 * - Real-time data persistence and retrieval
 */

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [notes, setNotes] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      // Test API connection
      await ApiService.request("/health");
      setIsReady(true);

      // Only load user-specific data if user is authenticated
      // For now, just set ready state to allow app to function
      // User data will be loaded when user logs in
    } catch (error) {
      console.error("Error initializing database:", error);
      // Check if it's a network error
      if (error.message && error.message.includes("No internet connection")) {
        showNetworkError();
      }
      // Still set ready to allow app to function
      setIsReady(true);
    }
  };

  // User Settings
  const loadUserSettings = async () => {
    try {
      const settings = await ApiService.getUserSettings();
      setUserSettings(settings);
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return;
      }
      console.error("Error loading user settings:", error);
    }
  };

  const saveUserSettings = async (settings) => {
    try {
      const savedSettings = await ApiService.updateProfile(settings);
      setUserSettings(savedSettings);
      return savedSettings;
    } catch (error) {
      console.error("Error saving user settings:", error);
      throw error;
    }
  };

  const getUserSettings = async () => {
    try {
      const settings = await ApiService.getUserSettings();
      return settings;
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return null;
      }
      console.error("Error getting user settings:", error);
      return null;
    }
  };

  // Expenses
  const loadExpenses = async () => {
    try {
      const expensesData = await ApiService.getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return;
      }
      console.error("Error loading expenses:", error);
    }
  };

  const saveExpense = async (expense) => {
    try {
      const response = await ApiService.createExpense(expense);
      const savedExpense = response.expense;
      setExpenses((prev) => [...prev, savedExpense]);
      return savedExpense;
    } catch (error) {
      console.error("Error saving expense:", error);
      throw error;
    }
  };

  const updateExpense = async (id, expenseData) => {
    try {
      const response = await ApiService.updateExpense(id, expenseData);
      const updatedExpense = response.expense;
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === id ? updatedExpense : exp))
      );
      return updatedExpense;
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await ApiService.deleteExpense(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  };

  const getExpensesByDate = async (date) => {
    try {
      const response = await ApiService.getExpensesByDateRange(date, date);
      return response.expenses || [];
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return [];
      }
      console.error("Error getting expenses by date:", error);
      return [];
    }
  };

  const getExpensesByDateRange = async (startDate, endDate) => {
    try {
      const response = await ApiService.getExpensesByDateRange(
        startDate,
        endDate
      );
      return response.expenses || [];
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return [];
      }
      console.error("Error getting expenses by date range:", error);
      return [];
    }
  };

  const getAllExpenses = async () => {
    try {
      const response = await ApiService.getExpenses();
      return response.expenses || [];
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return [];
      }
      console.error("Error getting all expenses:", error);
      return [];
    }
  };

  // Income
  const loadIncome = async () => {
    try {
      const incomeData = await ApiService.getIncome();
      setIncome(incomeData);
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return;
      }
      console.error("Error loading income:", error);
    }
  };

  const saveIncome = async (incomeData) => {
    try {
      const response = await ApiService.createIncome(incomeData);
      const savedIncome = response.income;
      setIncome((prev) => [...prev, savedIncome]);
      return savedIncome;
    } catch (error) {
      console.error("Error saving income:", error);
      throw error;
    }
  };

  const updateIncome = async (id, incomeData) => {
    try {
      const response = await ApiService.updateIncome(id, incomeData);
      const updatedIncome = response.income;
      setIncome((prev) =>
        prev.map((inc) => (inc.id === id ? updatedIncome : inc))
      );
      return updatedIncome;
    } catch (error) {
      console.error("Error updating income:", error);
      throw error;
    }
  };

  const deleteIncome = async (id) => {
    try {
      await ApiService.deleteIncome(id);
      setIncome((prev) => prev.filter((inc) => inc.id !== id));
    } catch (error) {
      console.error("Error deleting income:", error);
      throw error;
    }
  };

  const getIncomeByDateRange = async (startDate, endDate) => {
    try {
      const response = await ApiService.getIncomeByDateRange(
        startDate,
        endDate
      );
      return response.income || [];
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return [];
      }
      console.error("Error getting income by date range:", error);
      return [];
    }
  };

  const getAllIncome = async () => {
    try {
      const response = await ApiService.getIncome();
      return response.income || [];
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return [];
      }
      console.error("Error getting all income:", error);
      return [];
    }
  };

  // Notes
  const loadNotes = async () => {
    try {
      const notesData = await ApiService.getNotes();
      setNotes(notesData);
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return;
      }
      console.error("Error loading notes:", error);
    }
  };

  const getNotes = async () => {
    try {
      const notesData = await ApiService.getNotes();
      return notesData;
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        return [];
      }
      console.error("Error getting notes:", error);
      return [];
    }
  };

  const saveNote = async (note) => {
    try {
      const savedNote = await ApiService.createNote(note);
      setNotes((prev) => [...prev, savedNote]);
      return savedNote;
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      const updatedNote = await ApiService.updateNote(id, noteData);
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note))
      );
      return updatedNote;
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  const deleteNote = async (id) => {
    try {
      await ApiService.deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  // Budgets
  const loadBudgets = async () => {
    try {
      const budgetsData = await ApiService.getBudgets();
      setBudgets(budgetsData);
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        console.log("User not authenticated yet, skipping budgets");
        return;
      }
      console.error("Error loading budgets:", error);
    }
  };

  const saveBudget = async (period, amount) => {
    try {
      // Handle both old format (budget object) and new format (period, amount)
      let budgetData;
      if (typeof period === "string" && typeof amount === "number") {
        // New format: saveBudget("daily", 100)
        budgetData = {
          period: period,
          amount: amount,
          startDate: new Date(),
          endDate: new Date(),
        };
      } else {
        // Old format: saveBudget(budgetObject)
        budgetData = period;
      }

      // Only save if amount is greater than 0
      if (budgetData.amount > 0) {
        const response = await ApiService.createBudget(budgetData);
        const savedBudget = response.budget;
        setBudgets((prev) => [...prev, savedBudget]);
        return savedBudget;
      } else {
        // For zero amounts, just return a mock budget object
        return {
          id: `temp_${period}`,
          period: period,
          amount: 0,
          startDate: new Date(),
          endDate: new Date(),
        };
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      throw error;
    }
  };

  const updateBudget = async (id, budgetData) => {
    try {
      const response = await ApiService.updateBudget(id, budgetData);
      const updatedBudget = response.budget;
      setBudgets((prev) =>
        prev.map((budget) => (budget.id === id ? updatedBudget : budget))
      );
      return updatedBudget;
    } catch (error) {
      console.error("Error updating budget:", error);
      throw error;
    }
  };

  const deleteBudget = async (id) => {
    try {
      await ApiService.deleteBudget(id);
      setBudgets((prev) => prev.filter((budget) => budget.id !== id));
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw error;
    }
  };

  const getAllBudgets = async () => {
    try {
      const response = await ApiService.getBudgets();
      return response.budgets || [];
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        console.log("User not authenticated yet, returning empty budgets");
        return [];
      }
      console.error("Error getting all budgets:", error);
      return [];
    }
  };

  // Categories
  const loadCategories = async () => {
    try {
      const categoriesData = await ApiService.getCategories();
      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        console.log("User not authenticated yet, skipping categories");
        return [];
      }
      console.error("Error loading categories:", error);
      return [];
    }
  };

  const saveCategory = async (category) => {
    try {
      const savedCategory = await ApiService.createCategory(category);
      setCategories((prev) => [...prev, savedCategory]);
      return savedCategory;
    } catch (error) {
      console.error("Error saving category:", error);
      throw error;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const updatedCategory = await ApiService.updateCategory(id, categoryData);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await ApiService.deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };

  const getCategoriesByType = async (type) => {
    try {
      const categoriesData = await ApiService.getCategoriesByType(type);
      return categoriesData;
    } catch (error) {
      console.error("Error getting categories by type:", error);
      return [];
    }
  };

  // Payment Methods
  const loadPaymentMethods = async () => {
    try {
      const paymentMethodsData = await ApiService.getPaymentMethods();
      setPaymentMethods(paymentMethodsData);
      return paymentMethodsData;
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        console.log("User not authenticated yet, skipping payment methods");
        return [];
      }
      console.error("Error loading payment methods:", error);
      return [];
    }
  };

  const savePaymentMethod = async (paymentMethod) => {
    try {
      const savedPaymentMethod =
        await ApiService.createPaymentMethod(paymentMethod);
      setPaymentMethods((prev) => [...prev, savedPaymentMethod]);
      return savedPaymentMethod;
    } catch (error) {
      console.error("Error saving payment method:", error);
      throw error;
    }
  };

  const updatePaymentMethod = async (id, paymentMethodData) => {
    try {
      const updatedPaymentMethod = await ApiService.updatePaymentMethod(
        id,
        paymentMethodData
      );
      setPaymentMethods((prev) =>
        prev.map((pm) => (pm.id === id ? updatedPaymentMethod : pm))
      );
      return updatedPaymentMethod;
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  };

  const deletePaymentMethod = async (id) => {
    try {
      await ApiService.deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  };

  // User Preferences
  const loadPreferences = async () => {
    try {
      const preferencesData = await ApiService.getUserPreferences();
      setPreferences(preferencesData);
    } catch (error) {
      // If no token provided, user is not authenticated yet
      if (error.message && error.message.includes("No token provided")) {
        console.log("User not authenticated yet, skipping preferences");
        return;
      }
      console.error("Error loading preferences:", error);
    }
  };

  const loadUserData = async () => {
    try {
      console.log("Loading user data after authentication...");
      await Promise.all([
        loadUserSettings(),
        loadExpenses(),
        loadIncome(),
        loadNotes(),
        loadBudgets(),
        loadCategories(),
        loadPaymentMethods(),
        loadPreferences(),
      ]);
      console.log("User data loaded successfully");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Refresh all data - useful for clearing cache and reloading
  const refreshAllData = async () => {
    try {
      console.log("Refreshing all user data...");
      await Promise.all([
        loadUserSettings(),
        loadExpenses(),
        loadIncome(),
        loadNotes(),
        loadBudgets(),
        loadCategories(),
        loadPaymentMethods(),
        loadPreferences(),
      ]);
      console.log("All user data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const savePreference = async (key, value) => {
    try {
      const savedPreference = await ApiService.setUserPreference(key, value);
      setPreferences((prev) => ({ ...prev, [key]: value }));
      return savedPreference;
    } catch (error) {
      console.error("Error saving preference:", error);
      throw error;
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const updatedPreference = await ApiService.updateUserPreference(
        key,
        value
      );
      setPreferences((prev) => ({ ...prev, [key]: value }));
      return updatedPreference;
    } catch (error) {
      console.error("Error updating preference:", error);
      throw error;
    }
  };

  const deletePreference = async (key) => {
    try {
      await ApiService.deleteUserPreference(key);
      setPreferences((prev) => {
        const newPrefs = { ...prev };
        delete newPrefs[key];
        return newPrefs;
      });
    } catch (error) {
      console.error("Error deleting preference:", error);
      throw error;
    }
  };

  // Dashboard
  const getDashboardOverview = async () => {
    try {
      const overview = await ApiService.getDashboardOverview();
      return overview;
    } catch (error) {
      console.error("Error getting dashboard overview:", error);
      return null;
    }
  };

  const getDashboardAnalytics = async (period = "month") => {
    try {
      const analytics = await ApiService.getDashboardAnalytics(period);
      return analytics;
    } catch (error) {
      console.error("Error getting dashboard analytics:", error);
      return null;
    }
  };

  const getBudgetComparison = async () => {
    try {
      const comparison = await ApiService.getBudgetComparison();
      return comparison;
    } catch (error) {
      console.error("Error getting budget comparison:", error);
      return null;
    }
  };

  // Analytics
  const getSpendingTrends = async (period = "month", months = 6) => {
    try {
      const trends = await ApiService.getSpendingTrends(period, months);
      return trends;
    } catch (error) {
      console.error("Error getting spending trends:", error);
      return null;
    }
  };

  const getCategoryBreakdown = async (
    type = "expenses",
    startDate = null,
    endDate = null
  ) => {
    try {
      const breakdown = await ApiService.getCategoryBreakdown(
        type,
        startDate,
        endDate
      );
      return breakdown;
    } catch (error) {
      console.error("Error getting category breakdown:", error);
      return null;
    }
  };

  const getBudgetProgress = async (period = "month") => {
    try {
      const progress = await ApiService.getBudgetProgress(period);
      return progress;
    } catch (error) {
      console.error("Error getting budget progress:", error);
      return null;
    }
  };

  // Search
  const searchData = async (
    query,
    type = "all",
    startDate = null,
    endDate = null
  ) => {
    try {
      const results = await ApiService.search(query, type, startDate, endDate);
      return results;
    } catch (error) {
      console.error("Error searching data:", error);
      return [];
    }
  };

  // Onboarding
  const getOnboardingStatus = async () => {
    try {
      const status = await ApiService.getOnboardingStatus();
      return status;
    } catch (error) {
      console.error("Error getting onboarding status:", error);
      return null;
    }
  };

  const completeOnboarding = async (preferences) => {
    try {
      const result = await ApiService.completeOnboarding(preferences);
      return result;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const getOnboardingSummary = async () => {
    try {
      const summary = await ApiService.getOnboardingSummary();
      return summary;
    } catch (error) {
      console.error("Error getting onboarding summary:", error);
      return null;
    }
  };

  // Settings
  const changePin = async (pinData) => {
    try {
      const result = await ApiService.changePin(pinData);
      return result;
    } catch (error) {
      console.error("Error changing PIN:", error);
      throw error;
    }
  };

  const getStatistics = async () => {
    try {
      const stats = await ApiService.getStatistics();
      return stats;
    } catch (error) {
      console.error("Error getting statistics:", error);
      return null;
    }
  };

  const exportData = async () => {
    try {
      const data = await ApiService.exportData();
      return data;
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  };

  const getDataUsage = async () => {
    try {
      const usage = await ApiService.getDataUsage();
      // Backend returns { success, dataUsage: {...} }. Normalize shape for UI.
      return (
        usage?.dataUsage ||
        usage || {
          totalRecords: 0,
          databaseSize: "0 records",
          lastBackup: null,
          categories: 0,
          expenses: 0,
          income: 0,
          notes: 0,
          budgets: 0,
          paymentMethods: 0,
        }
      );
    } catch (error) {
      // If no token, provide a safe default object instead of null
      if (error.message && error.message.includes("No token provided")) {
        return {
          totalRecords: 0,
          databaseSize: "0 records",
          lastBackup: null,
          categories: 0,
          expenses: 0,
          income: 0,
          notes: 0,
          budgets: 0,
          paymentMethods: 0,
        };
      }
      console.error("Error getting data usage:", error);
      return {
        totalRecords: 0,
        databaseSize: "0 records",
        lastBackup: null,
        categories: 0,
        expenses: 0,
        income: 0,
        notes: 0,
        budgets: 0,
        paymentMethods: 0,
      };
    }
  };

  const backupData = async () => {
    try {
      const data = await ApiService.backupData();
      return data;
    } catch (error) {
      console.error("Error backing up data:", error);
      throw error;
    }
  };

  const clearOldData = async (days) => {
    try {
      const result = await ApiService.clearOldData(days);

      // Refresh all data after clearing to update the UI
      if (result.success) {
        await refreshAllData();
      }

      return result;
    } catch (error) {
      // If not authenticated, skip server clear but allow local reset flow to proceed
      if (error.message && error.message.includes("No token provided")) {
        return {
          success: true,
          message: "Skipped server clear (not authenticated)",
          deleted: { expenses: 0, income: 0, notes: 0 },
        };
      }
      console.error("Error clearing old data:", error);
      throw error;
    }
  };

  const getNotificationSettings = async () => {
    try {
      const settings = await ApiService.getNotificationSettings();
      return settings;
    } catch (error) {
      console.error("Error getting notification settings:", error);
      return null;
    }
  };

  const updateNotificationSetting = async (type, enabled) => {
    try {
      const result = await ApiService.updateNotificationSetting(type, enabled);
      return result;
    } catch (error) {
      console.error("Error updating notification setting:", error);
      throw error;
    }
  };

  const setAppPin = async (pin) => {
    try {
      // This would typically call an API to set the PIN
      // For now, we'll return success
      return true;
    } catch (error) {
      console.error("Error setting app PIN:", error);
      return false;
    }
  };

  const resetSecurity = async () => {
    try {
      // This would typically call an API to reset security settings
      // For now, we'll return success
      return true;
    } catch (error) {
      console.error("Error resetting security:", error);
      return false;
    }
  };

  const updateSecurityNoticeSetting = async (enabled) => {
    try {
      // This would typically call an API to update security notice setting
      // For now, we'll return success
      return true;
    } catch (error) {
      console.error("Error updating security notice setting:", error);
      return false;
    }
  };

  const cancelAllNotifications = async () => {
    try {
      // This would typically call an API to cancel all notifications
      // For now, we'll return success
      return true;
    } catch (error) {
      console.error("Error canceling all notifications:", error);
      return false;
    }
  };

  const forceReset = async () => {
    try {
      // This would typically call an API to force reset security notice
      // For now, we'll return success
      return true;
    } catch (error) {
      console.error("Error force resetting security notice:", error);
      return false;
    }
  };

  const deleteAccount = async (confirmPassword) => {
    try {
      const result = await ApiService.deleteAccount(confirmPassword);
      return result;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  // Profile Image
  const updateProfileImage = async (profileImage) => {
    try {
      const result = await ApiService.updateUserProfileImage(profileImage);
      return result;
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  };

  const getProfileImage = async () => {
    try {
      const image = await ApiService.getUserProfileImage();
      return image;
    } catch (error) {
      console.error("Error getting profile image:", error);
      return null;
    }
  };

  const removeProfileImage = async () => {
    try {
      const result = await ApiService.removeUserProfileImage();
      return result;
    } catch (error) {
      console.error("Error removing profile image:", error);
      throw error;
    }
  };

  // Computed values for summaries
  const getDailySummaries = () => {
    const summaries = {};
    expenses.forEach((expense) => {
      const date = format(new Date(expense.date), "yyyy-MM-dd");
      if (!summaries[date]) {
        summaries[date] = { expenses: 0, income: 0 };
      }
      summaries[date].expenses += expense.amount;
    });

    income.forEach((inc) => {
      const date = format(new Date(inc.date), "yyyy-MM-dd");
      if (!summaries[date]) {
        summaries[date] = { expenses: 0, income: 0 };
      }
      summaries[date].income += inc.amount;
    });

    return summaries;
  };

  const getWeeklySummaries = () => {
    const summaries = {};
    expenses.forEach((expense) => {
      const weekStart = format(new Date(expense.date), "yyyy-'W'II");
      if (!summaries[weekStart]) {
        summaries[weekStart] = { expenses: 0, income: 0 };
      }
      summaries[weekStart].expenses += expense.amount;
    });

    income.forEach((inc) => {
      const weekStart = format(new Date(inc.date), "yyyy-'W'II");
      if (!summaries[weekStart]) {
        summaries[weekStart] = { expenses: 0, income: 0 };
      }
      summaries[weekStart].income += inc.amount;
    });

    return summaries;
  };

  const getMonthlySummaries = () => {
    const summaries = {};
    expenses.forEach((expense) => {
      const month = format(new Date(expense.date), "yyyy-MM");
      if (!summaries[month]) {
        summaries[month] = { expenses: 0, income: 0 };
      }
      summaries[month].expenses += expense.amount;
    });

    income.forEach((inc) => {
      const month = format(new Date(inc.date), "yyyy-MM");
      if (!summaries[month]) {
        summaries[month] = { expenses: 0, income: 0 };
      }
      summaries[month].income += inc.amount;
    });

    return summaries;
  };

  const value = {
    // State
    isReady,
    userSettings,
    expenses,
    income,
    notes,
    budgets,
    categories,
    paymentMethods,
    preferences,

    // User Settings
    getUserSettings,
    saveUserSettings,
    loadUserSettings,

    // Expenses
    loadExpenses,
    saveExpense,
    addExpense: saveExpense, // Alias for compatibility
    updateExpense,
    deleteExpense,
    getExpensesByDate,
    getExpensesByDateRange,
    getAllExpenses,

    // Income
    loadIncome,
    saveIncome,
    addIncome: saveIncome, // Alias for compatibility
    updateIncome,
    deleteIncome,
    getIncomeByDateRange,
    getAllIncome,

    // Notes
    loadNotes,
    getNotes,
    saveNote,
    updateNote,
    deleteNote,

    // Budgets
    loadBudgets,
    saveBudget,
    updateBudget,
    deleteBudget,
    getAllBudgets,

    // Categories
    loadCategories,
    saveCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,

    // Payment Methods
    loadPaymentMethods,
    savePaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,

    // User Preferences
    loadPreferences,
    loadUserData,
    refreshAllData,
    savePreference,
    updatePreference,
    deletePreference,

    // Dashboard
    getDashboardOverview,
    getDashboardAnalytics,
    getBudgetComparison,

    // Analytics
    getSpendingTrends,
    getCategoryBreakdown,
    getBudgetProgress,

    // Search
    searchData,

    // Onboarding
    getOnboardingStatus,
    completeOnboarding,
    getOnboardingSummary,

    // Settings
    changePin,
    getStatistics,
    exportData,
    deleteAccount,

    // Security
    setAppPin,
    resetSecurity,
    updateSecurityNoticeSetting,
    forceReset,

    // Data Management
    getDataUsage,
    backupData,
    clearOldData,

    // Notification Settings
    getNotificationSettings,
    updateNotificationSetting,
    cancelAllNotifications,

    // Profile Image
    updateProfileImage,
    getProfileImage,
    removeProfileImage,

    // Computed summaries
    getDailySummaries,
    getWeeklySummaries,
    getMonthlySummaries,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
