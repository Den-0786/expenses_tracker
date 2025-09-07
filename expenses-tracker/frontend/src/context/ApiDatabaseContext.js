import React, { createContext, useContext, useEffect, useState } from "react";
import apiService from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ApiDatabaseContext = createContext();

export const useApiDatabase = () => {
  const context = useContext(ApiDatabaseContext);
  if (!context) {
    throw new Error("useApiDatabase must be used within a ApiDatabaseProvider");
  }
  return context;
};

export const ApiDatabaseProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeContext();
  }, []);

  const initializeContext = async () => {
    try {
      // Check if user is already authenticated
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        apiService.setToken(token);
        try {
          const userData = await apiService.verifyToken();
          setUser(userData.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, remove it
          await AsyncStorage.removeItem("authToken");
        }
      }
      setIsReady(true);
    } catch (error) {
      console.error("Error initializing API context:", error);
      setIsReady(true);
    }
  };

  // Authentication functions
  const signup = async (username, email, pin) => {
    try {
      const response = await apiService.signup({ username, email, pin });
      if (response.success) {
        apiService.setToken(response.token);
        await AsyncStorage.setItem("authToken", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signin = async (pin) => {
    try {
      const response = await apiService.signin({ pin });
      if (response.success) {
        apiService.setToken(response.token);
        await AsyncStorage.setItem("authToken", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      apiService.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  // User settings functions
  const saveUserSettings = async (settings) => {
    try {
      const response = await apiService.updateUserProfile(settings);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getUserSettings = async () => {
    try {
      const response = await apiService.getUserSettings();
      return response.settings;
    } catch (error) {
      throw error;
    }
  };

  // Expense functions
  const addExpense = async (title, amount, description, categoryId, date) => {
    try {
      const response = await apiService.createExpense({
        title,
        amount: parseFloat(amount),
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        date: date || new Date().toISOString(),
      });
      return response.expense;
    } catch (error) {
      throw error;
    }
  };

  const getExpensesByDateRange = async (startDate, endDate) => {
    try {
      const response = await apiService.getExpensesByDateRange(
        startDate,
        endDate
      );
      return response.expenses;
    } catch (error) {
      throw error;
    }
  };

  const updateExpense = async (id, title, amount, description, categoryId) => {
    try {
      const response = await apiService.updateExpense(id, {
        title,
        amount: amount ? parseFloat(amount) : undefined,
        description,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      });
      return response.expense;
    } catch (error) {
      throw error;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await apiService.deleteExpense(id);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Income functions
  const addIncome = async (amount, description, source, categoryId, date) => {
    try {
      const response = await apiService.createIncome({
        amount: parseFloat(amount),
        description,
        source,
        categoryId: categoryId ? parseInt(categoryId) : null,
        date: date || new Date().toISOString(),
      });
      return response.income;
    } catch (error) {
      throw error;
    }
  };

  const getIncomeByDateRange = async (startDate, endDate) => {
    try {
      const response = await apiService.getIncomeByDateRange(
        startDate,
        endDate
      );
      return response.income;
    } catch (error) {
      throw error;
    }
  };

  const getAllIncome = async () => {
    try {
      const response = await apiService.getIncome();
      return response.income;
    } catch (error) {
      throw error;
    }
  };

  const updateIncome = async (id, amount, description, source, categoryId) => {
    try {
      const response = await apiService.updateIncome(id, {
        amount: amount ? parseFloat(amount) : undefined,
        description,
        source,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      });
      return response.income;
    } catch (error) {
      throw error;
    }
  };

  const deleteIncome = async (id) => {
    try {
      await apiService.deleteIncome(id);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Note functions
  const getNotes = async () => {
    try {
      const response = await apiService.getNotes();
      return response.notes;
    } catch (error) {
      throw error;
    }
  };

  const saveNote = async (title, content) => {
    try {
      const response = await apiService.createNote({ title, content });
      return response.note;
    } catch (error) {
      throw error;
    }
  };

  const updateNote = async (note) => {
    try {
      const response = await apiService.updateNote(note.id, {
        title: note.title,
        content: note.content,
      });
      return response.note;
    } catch (error) {
      throw error;
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await apiService.deleteNote(noteId);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Budget functions
  const saveBudget = async (period, amount) => {
    try {
      const response = await apiService.createBudget({
        period,
        amount: parseFloat(amount),
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      });
      return response.budget;
    } catch (error) {
      throw error;
    }
  };

  const getBudget = async (period) => {
    try {
      const budgets = await apiService.getBudgets();
      return budgets.find((budget) => budget.period === period);
    } catch (error) {
      throw error;
    }
  };

  const getAllBudgets = async () => {
    try {
      const response = await apiService.getBudgets();
      return response.budgets;
    } catch (error) {
      throw error;
    }
  };

  // Data management functions
  const exportData = async () => {
    try {
      const response = await apiService.exportData();
      return response.exportData;
    } catch (error) {
      throw error;
    }
  };

  const backupData = async () => {
    try {
      return await exportData();
    } catch (error) {
      throw error;
    }
  };

  const getDataUsage = async () => {
    try {
      const response = await apiService.getStatistics();
      return response.statistics;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    isReady,
    isAuthenticated,
    user,
    signup,
    signin,
    signout,
    saveUserSettings,
    getUserSettings,
    addExpense,
    getExpensesByDateRange,
    updateExpense,
    deleteExpense,
    addIncome,
    getIncomeByDateRange,
    getAllIncome,
    updateIncome,
    deleteIncome,
    getNotes,
    saveNote,
    updateNote,
    deleteNote,
    saveBudget,
    getBudget,
    getAllBudgets,
    exportData,
    backupData,
    getDataUsage,
  };

  return (
    <ApiDatabaseContext.Provider value={value}>
      {children}
    </ApiDatabaseContext.Provider>
  );
};









