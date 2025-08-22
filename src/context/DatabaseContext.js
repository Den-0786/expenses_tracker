import React, { createContext, useContext, useEffect, useState } from "react";
import { format } from "date-fns";

/**
 * DatabaseContext - Prepared for Neon Postgres Integration
 *
 * CURRENT STATUS: Using mock database until Neon integration is complete
 *
 * NEON INTEGRATION PLAN:
 * 1. Install: npm install pg @types/pg
 * 2. Set environment variable: NEON_DATABASE_URL
 * 3. Replace mock database with Postgres pool connection
 * 4. Update all database operations to use Postgres queries
 * 5. Update table schemas to use Postgres data types
 *
 * KEY CHANGES NEEDED:
 * - Replace SQLite syntax with Postgres syntax
 * - Use connection pooling for better performance
 * - Implement proper error handling for network operations
 * - Add connection retry logic for production reliability
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
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [connectionString, setConnectionString] = useState(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      // For now, using mock database until Neon integration is complete
      // TODO: Replace with Neon Postgres connection
      console.log("Initializing database - Neon integration pending");
      setDb({
        mock: true,
        mockData: {
          userSettings: null,
          expenses: [],
          income: [],
          dailySummaries: {},
          weeklySummaries: {},
          monthlySummaries: {},
        },
      });
      setIsReady(true);

      // TODO: Neon integration code will go here:
      // const { Pool } = require('pg');
      // const pool = new Pool({
      //   connectionString: process.env.NEON_DATABASE_URL,
      //   ssl: { rejectUnauthorized: false }
      // });
      // setDb(pool);
      // await createTables(pool);
      // setIsReady(true);
    } catch (error) {
      console.error("Error initializing database:", error);
      setDb({
        mock: true,
        mockData: {
          userSettings: null,
          expenses: [],
          income: [],
          dailySummaries: {},
          weeklySummaries: {},
          monthlySummaries: {},
        },
      });
      setIsReady(true);
    }
  };

  const createTables = async (pool) => {
    try {
      // TODO: Replace with Neon Postgres table creation
      // These will be Postgres-compatible SQL statements
      const createUserSettingsTable = `
        CREATE TABLE IF NOT EXISTS user_settings (
          id SERIAL PRIMARY KEY,
          payment_frequency VARCHAR(20) NOT NULL,
          payment_amount DECIMAL(10,2) NOT NULL,
          tithing_percentage DECIMAL(5,2),
          tithing_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createExpensesTable = `
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          amount DECIMAL(10,2) NOT NULL,
          description VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          date DATE NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'Cash',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createIncomeTable = `
        CREATE TABLE IF NOT EXISTS income (
          id SERIAL PRIMARY KEY,
          amount DECIMAL(10,2) NOT NULL,
          description VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          source VARCHAR(100),
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createDailySummariesTable = `
        CREATE TABLE IF NOT EXISTS daily_summaries (
          id SERIAL PRIMARY KEY,
          date DATE UNIQUE NOT NULL,
          total_expenses DECIMAL(10,2) DEFAULT 0,
          total_tithing DECIMAL(10,2) DEFAULT 0,
          remaining_balance DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createWeeklySummariesTable = `
        CREATE TABLE IF NOT EXISTS weekly_summaries (
          id SERIAL PRIMARY KEY,
          week_start DATE NOT NULL,
          week_end DATE NOT NULL,
          total_expenses DECIMAL(10,2) DEFAULT 0,
          total_tithing DECIMAL(10,2) DEFAULT 0,
          remaining_balance DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createMonthlySummariesTable = `
        CREATE TABLE IF NOT EXISTS monthly_summaries (
          id SERIAL PRIMARY KEY,
          month VARCHAR(20) NOT NULL,
          year INTEGER NOT NULL,
          total_expenses DECIMAL(10,2) DEFAULT 0,
          total_tithing DECIMAL(10,2) DEFAULT 0,
          remaining_balance DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createBudgetsTable = `
        CREATE TABLE IF NOT EXISTS budgets (
          id SERIAL PRIMARY KEY,
          period VARCHAR(20) NOT NULL,
          amount DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // TODO: Execute these queries when Neon is connected
      // await pool.query(createUserSettingsTable);
      // await pool.query(createExpensesTable);
      // await pool.query(createIncomeTable);
      // await pool.query(createDailySummariesTable);
      // await pool.query(createWeeklySummariesTable);
      // await pool.query(createMonthlySummariesTable);
      // await pool.query(createBudgetsTable);

      console.log("Table schemas prepared for Neon Postgres");
      return true;
    } catch (error) {
      console.error("Error creating tables:", error);
      return false;
    }
  };

  // TODO: Neon connection setup function
  const setupNeonConnection = async () => {
    try {
      // This function will be implemented when Neon is ready
      // const { Pool } = require('pg');
      // const pool = new Pool({
      //   connectionString: process.env.NEON_DATABASE_URL,
      //   ssl: { rejectUnauthorized: false },
      //   max: 20, // Maximum number of connections
      //   idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      //   connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      // });

      // // Test the connection
      // const client = await pool.connect();
      // await client.query('SELECT NOW()');
      // client.release();

      // setDb(pool);
      // await createTables(pool);
      // setIsReady(true);

      console.log("Neon connection setup - ready to implement");
      return true;
    } catch (error) {
      console.error("Error setting up Neon connection:", error);
      return false;
    }
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

      if (db.mock) {
        console.log("Mock: Saving user settings", {
          paymentFrequency,
          paymentAmount,
          tithingPercentage,
          tithingEnabled,
        });
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

      if (db.mock) {
        console.log("Mock: Getting user settings");
        resolve(db.mockData.userSettings);
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

      if (db.mock) {
        console.log("Mock: Adding expense", {
          amount,
          description,
          category,
          date,
          paymentMethod,
        });
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

      if (db.mock) {
        console.log("Mock: Adding income", {
          amount,
          description,
          category,
          source,
          date,
        });
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
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
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

      if (db.mock) {
        console.log("Mock: Getting expenses for date", date);
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

      if (db.mock) {
        console.log("Mock: Getting expenses for date range", {
          startDate,
          endDate,
        });
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

  const saveBudget = (period, amount) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      if (db.mock) {
        console.log("Mock: Saving budget", { period, amount });
        resolve({ insertId: 1 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO budgets (period, amount, updated_at) 
           VALUES (?, ?, datetime('now'))`,
          [period, amount],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  };

  const getBudget = (period) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      if (db.mock) {
        console.log("Mock: Getting budget for period", period);
        resolve(0);
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "SELECT amount FROM budgets WHERE period = ?",
          [period],
          (_, { rows }) => resolve(rows._array[0]?.amount || 0),
          (_, error) => reject(error)
        );
      });
    });
  };

  const getAllBudgets = () => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      if (db.mock) {
        console.log("Mock: Getting all budgets");
        resolve({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "SELECT period, amount FROM budgets",
          [],
          (_, { rows }) => {
            const budgets = { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
            rows._array.forEach((row) => {
              budgets[row.period] = row.amount;
            });
            resolve(budgets);
          },
          (_, error) => reject(error)
        );
      });
    });
  };

  const exportData = () => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      if (db.mock) {
        console.log("Mock: Exporting data");
        resolve({
          expenses: [],
          income: [],
          userSettings: {},
          budgets: {},
        });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM expenses ORDER BY date DESC",
          [],
          (_, { rows: expenses }) => {
            tx.executeSql(
              "SELECT * FROM income ORDER BY date DESC",
              [],
              (_, { rows: income }) => {
                tx.executeSql(
                  "SELECT * FROM user_settings LIMIT 1",
                  [],
                  (_, { rows: userSettings }) => {
                    tx.executeSql(
                      "SELECT * FROM budgets",
                      [],
                      (_, { rows: budgets }) => {
                        const exportData = {
                          expenses: expenses._array,
                          income: income._array,
                          userSettings: userSettings._array[0] || {},
                          budgets: budgets._array.reduce((acc, row) => {
                            acc[row.period] = row.amount;
                            return acc;
                          }, {}),
                          exportDate: new Date().toISOString(),
                        };
                        resolve(exportData);
                      },
                      (_, error) => reject(error)
                    );
                  },
                  (_, error) => reject(error)
                );
              },
              (_, error) => reject(error)
            );
          },
          (_, error) => reject(error)
        );
      });
    });
  };

  const backupData = () => {
    return exportData();
  };

  const getDataUsage = () => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      if (db.mock) {
        console.log("Mock: Getting data usage");
        resolve({
          totalExpenses: 0,
          totalIncome: 0,
          totalRecords: 0,
          databaseSize: "0 KB",
        });
        return;
      }

      db.transaction((tx) => {
        tx.executeSql(
          "SELECT COUNT(*) as count FROM expenses",
          [],
          (_, { rows }) => {
            const expenseCount = rows._array[0].count;
            tx.executeSql(
              "SELECT COUNT(*) as count FROM income",
              [],
              (_, { rows: incomeRows }) => {
                const incomeCount = incomeRows._array[0].count;
                const totalRecords = expenseCount + incomeCount;

                resolve({
                  totalExpenses: expenseCount,
                  totalIncome: incomeCount,
                  totalRecords,
                  databaseSize: `${Math.round(totalRecords * 0.1)} KB`, // Rough estimate
                });
              },
              (_, error) => reject(error)
            );
          },
          (_, error) => reject(error)
        );
      });
    });
  };

  const value = {
    isReady,
    db,
    setupNeonConnection,
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
    saveBudget,
    getBudget,
    getAllBudgets,
    exportData,
    backupData,
    getDataUsage,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
