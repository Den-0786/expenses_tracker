import React, { createContext, useContext, useState, useEffect } from "react";
import { useDatabase } from "./DatabaseContext";

const BudgetContext = createContext();

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};

export const BudgetProvider = ({ children }) => {
  const { getExpensesByDateRange } = useDatabase();
  const [budgets, setBudgets] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [budgetAlerts, setBudgetAlerts] = useState({
    daily: { warning: 0.8, critical: 0.95 }, // 80% and 95% thresholds
    weekly: { warning: 0.8, critical: 0.95 },
    monthly: { warning: 0.8, critical: 0.95 },
    yearly: { warning: 0.8, critical: 0.95 },
  });

  const [currentSpending, setCurrentSpending] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  useEffect(() => {
    loadBudgets();
    calculateCurrentSpending();
  }, []);

  const loadBudgets = async () => {
    // Load from storage - for now using mock data
    const savedBudgets = {
      daily: 100,
      weekly: 500,
      monthly: 2000,
      yearly: 24000,
    };
    setBudgets(savedBudgets);
  };

  const calculateCurrentSpending = async () => {
    try {
      const now = new Date();

      // Daily spending
      const today = now.toISOString().split("T")[0];
      const todayExpenses = await getExpensesByDateRange(today, today);
      const dailyTotal = todayExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      // Weekly spending
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      const weekExpenses = await getExpensesByDateRange(
        weekStart.toISOString().split("T")[0],
        now.toISOString().split("T")[0]
      );
      const weeklyTotal = weekExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      // Monthly spending
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthExpenses = await getExpensesByDateRange(
        monthStart.toISOString().split("T")[0],
        now.toISOString().split("T")[0]
      );
      const monthlyTotal = monthExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      // Yearly spending
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearExpenses = await getExpensesByDateRange(
        yearStart.toISOString().split("T")[0],
        now.toISOString().split("T")[0]
      );
      const yearlyTotal = yearExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      setCurrentSpending({
        daily: dailyTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
        yearly: yearlyTotal,
      });
    } catch (error) {
      console.error("Error calculating current spending:", error);
    }
  };

  const setBudget = (period, amount) => {
    setBudgets((prev) => ({
      ...prev,
      [period]: amount,
    }));
    // Save to storage
  };

  const getBudgetProgress = (period) => {
    const budget = budgets[period];
    const spending = currentSpending[period];

    if (budget === 0) return 0;
    return Math.min(spending / budget, 1);
  };

  const getBudgetStatus = (period) => {
    const progress = getBudgetProgress(period);
    const alerts = budgetAlerts[period];

    if (progress >= alerts.critical) return "critical";
    if (progress >= alerts.warning) return "warning";
    return "normal";
  };

  const getRemainingBudget = (period) => {
    return Math.max(budgets[period] - currentSpending[period], 0);
  };

  const refreshBudgets = () => {
    calculateCurrentSpending();
  };

  const value = {
    budgets,
    currentSpending,
    budgetAlerts,
    setBudget,
    getBudgetProgress,
    getBudgetStatus,
    getRemainingBudget,
    refreshBudgets,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};
