import React, { createContext, useContext, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import { format } from "date-fns";

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      // Check if SQLite is available
      if (!SQLite || !SQLite.openDatabase) {
        console.log("SQLite is not available - using mock database");
        // Create a mock database for testing
        setDb({
          mock: true,
          // Add mock data storage
          mockData: {
            userSettings: null,
            expenses: [
              // Sample expenses for better chart visualization
              {
                id: 1,
                amount: 25.5,
                description: "Lunch at McDonald's",
                category: "Food",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "Card",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 2,
                amount: 15.0,
                description: "Coffee and snacks",
                category: "Food",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "Cash",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 3,
                amount: 45.0,
                description: "Gas for car",
                category: "Transport",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "Card",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 4,
                amount: 120.0,
                description: "Shopping at Walmart",
                category: "Shopping",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "Card",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 5,
                amount: 80.0,
                description: "Movie tickets",
                category: "Entertainment",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "Card",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              // Previous days for trends
              {
                id: 6,
                amount: 30.0,
                description: "Dinner yesterday",
                category: "Food",
                date: format(
                  new Date(Date.now() - 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                payment_method: "Cash",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 7,
                amount: 60.0,
                description: "Uber rides",
                category: "Transport",
                date: format(
                  new Date(Date.now() - 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                payment_method: "Card",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
            income: [],
            dailySummaries: {},
            weeklySummaries: {},
            monthlySummaries: {},
          },
        });
        setIsReady(true);
        return;
      }

      const database = SQLite.openDatabase("expenses.db");
      setDb(database);

      // Create tables
      await createTables(database);
      setIsReady(true);
    } catch (error) {
      console.error("Error initializing database:", error);
      // Fallback to mock database
      setDb({
        mock: true,
        mockData: {
          userSettings: null,
          expenses: [
            // Sample expenses for better chart visualization
            {
              id: 1,
              amount: 25.5,
              description: "Lunch at McDonald's",
              category: "Food",
              date: format(new Date(), "yyyy-MM-dd"),
              payment_method: "Card",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 2,
              amount: 15.0,
              description: "Coffee and snacks",
              category: "Food",
              date: format(new Date(), "yyyy-MM-dd"),
              payment_method: "Cash",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 3,
              amount: 45.0,
              description: "Gas for car",
              category: "Transport",
              date: format(new Date(), "yyyy-MM-dd"),
              payment_method: "Card",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 4,
              amount: 120.0,
              description: "Shopping at Walmart",
              category: "Shopping",
              date: format(new Date(), "yyyy-MM-dd"),
              payment_method: "Card",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 5,
              amount: 80.0,
              description: "Movie tickets",
              category: "Entertainment",
              date: format(new Date(), "yyyy-MM-dd"),
              payment_method: "Card",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            // Previous days for trends
            {
              id: 6,
              amount: 30.0,
              description: "Dinner yesterday",
              category: "Food",
              date: format(
                new Date(Date.now() - 24 * 60 * 60 * 1000),
                "yyyy-MM-dd"
              ),
              payment_method: "Cash",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 7,
              amount: 60.0,
              description: "Uber rides",
              category: "Transport",
              date: format(
                new Date(Date.now() - 24 * 60 * 60 * 1000),
                "yyyy-MM-dd"
              ),
              payment_method: "Card",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          income: [],
          dailySummaries: {},
          weeklySummaries: {},
          monthlySummaries: {},
        },
      });
      setIsReady(true);
    }
  };

  const createTables = (database) => {
    return new Promise((resolve, reject) => {
      database.transaction(
        (tx) => {
          // User settings table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_frequency TEXT NOT NULL,
            payment_amount REAL NOT NULL,
            tithing_percentage REAL DEFAULT 10.0,
            tithing_enabled BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );`
          );

          // Expenses table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            category TEXT,
            date TEXT NOT NULL,
            payment_method TEXT DEFAULT 'Cash',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );`
          );

          // Income table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS income (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            category TEXT,
            source TEXT,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );`
          );

          // Daily summaries table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS daily_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            total_expenses REAL DEFAULT 0,
            total_tithing REAL DEFAULT 0,
            remaining_balance REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );`
          );

          // Weekly summaries table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS weekly_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_start TEXT NOT NULL,
            week_end TEXT NOT NULL,
            total_expenses REAL DEFAULT 0,
            total_tithing REAL DEFAULT 0,
            remaining_balance REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );`
          );

          // Monthly summaries table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS monthly_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            total_expenses REAL DEFAULT 0,
            total_tithing REAL DEFAULT 0,
            remaining_balance REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );`
          );
        },
        reject,
        resolve
      );
    });
  };

  const saveUserSettings = (
    paymentFrequency,
    paymentAmount,
    tithingPercentage,
    tithingEnabled
  ) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Saving user settings", {
          paymentFrequency,
          paymentAmount,
          tithingPercentage,
          tithingEnabled,
        });
        // Store in mock data
        db.mockData.userSettings = {
          id: 1,
          payment_frequency: paymentFrequency,
          payment_amount: paymentAmount,
          tithing_percentage: tithingPercentage,
          tithing_enabled: tithingEnabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        resolve({ insertId: 1 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO user_settings 
           (id, payment_frequency, payment_amount, tithing_percentage, tithing_enabled, updated_at) 
           VALUES (1, ?, ?, ?, ?, datetime('now'))`,
          [
            paymentFrequency,
            paymentAmount,
            tithingPercentage,
            tithingEnabled ? 1 : 0,
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const getUserSettings = () => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Getting user settings");
        resolve(db.mockData.userSettings); // Return stored settings
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM user_settings WHERE id = 1",
          [],
          (_, { rows }) => resolve(rows._array[0] || null),
          (_, error) => reject(error)
        );
      });
    });
  };

  const addExpense = (
    amount,
    description,
    category,
    date,
    paymentMethod = "Cash"
  ) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Adding expense", {
          amount,
          description,
          category,
          date,
          paymentMethod,
        });
        // Store in mock data
        const newExpense = {
          id: Date.now(),
          amount,
          description,
          category,
          date,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.mockData.expenses.push(newExpense);
        resolve({ insertId: newExpense.id });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO expenses (amount, description, category, date, payment_method, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [amount, description, category, date, paymentMethod],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const addIncome = (amount, description, category, source, date) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Adding income", {
          amount,
          description,
          category,
          source,
          date,
        });
        // Store in mock data
        const newIncome = {
          id: Date.now(),
          amount,
          description,
          category,
          source,
          date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.mockData.income.push(newIncome);
        resolve({ insertId: newIncome.id });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO income (amount, description, category, source, date, created_at, updated_at) 
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [amount, description, category, source, date],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const getExpensesByDate = (date) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Getting expenses for date", date);
        // Filter expenses by date
        const expensesForDate = db.mockData.expenses.filter(
          (expense) => expense.date === date
        );
        resolve(expensesForDate);
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM expenses WHERE date = ? ORDER BY created_at DESC",
          [date],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  };

  const getExpensesByDateRange = (startDate, endDate) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Getting expenses for date range", {
          startDate,
          endDate,
        });
        // Filter expenses by date range
        const expensesInRange = db.mockData.expenses.filter(
          (expense) => expense.date >= startDate && expense.date <= endDate
        );
        resolve(expensesInRange);
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC, created_at DESC",
          [startDate, endDate],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  };

  const updateExpense = (id, amount, description, category) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Updating expense", {
          id,
          amount,
          description,
          category,
        });
        resolve({ rowsAffected: 1 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `UPDATE expenses 
           SET amount = ?, description = ?, category = ?, updated_at = datetime('now') 
           WHERE id = ?`,
          [amount, description, category, id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const deleteExpense = (id) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Deleting expense", { id });
        resolve({ rowsAffected: 1 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "DELETE FROM expenses WHERE id = ?",
          [id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const saveDailySummary = (
    date,
    totalExpenses,
    totalTithing,
    remainingBalance
  ) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Saving daily summary", {
          date,
          totalExpenses,
          totalTithing,
          remainingBalance,
        });
        resolve({ insertId: 1 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO daily_summaries 
           (date, total_expenses, total_tithing, remaining_balance, updated_at) 
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [date, totalExpenses, totalTithing, remainingBalance],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const saveWeeklySummary = (
    weekStart,
    weekEnd,
    totalExpenses,
    totalTithing,
    remainingBalance
  ) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Saving weekly summary", {
          weekStart,
          weekEnd,
          totalExpenses,
          totalTithing,
          remainingBalance,
        });
        resolve({ insertId: 1 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO weekly_summaries 
           (week_start, week_end, total_expenses, total_tithing, remaining_balance, updated_at) 
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [weekStart, weekEnd, totalExpenses, totalTithing, remainingBalance],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const saveMonthlySummary = (
    month,
    year,
    totalExpenses,
    totalTithing,
    remainingBalance
  ) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Saving monthly summary", {
          month,
          year,
          totalExpenses,
          totalTithing,
          remainingBalance,
        });
        resolve({ insertId: 1 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO monthly_summaries 
           (month, year, total_expenses, total_tithing, remaining_balance, updated_at) 
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [month, year, totalExpenses, totalTithing, remainingBalance],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const clearOldData = (daysToKeep) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Handle mock database
      if (db.mock) {
        console.log("Mock: Clearing old data", { daysToKeep });
        resolve({ rowsAffected: 0 });
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateString = cutoffDate.toISOString().split("T")[0];

      db.transaction((tx) => {
        tx.executeSql(
          "DELETE FROM expenses WHERE date < ?",
          [cutoffDateString],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const value = {
    isReady,
    db, // Expose db object for debugging
    saveUserSettings,
    getUserSettings,
    addExpense,
    addIncome,
    getExpensesByDate,
    getExpensesByDateRange,
    updateExpense,
    deleteExpense,
    saveDailySummary,
    saveWeeklySummary,
    saveMonthlySummary,
    clearOldData,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
