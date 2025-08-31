const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    res.json({
      success: true,
      settings: {
        profile: {
          username: user.username,
          email: user.email,
          memberSince: user.createdAt,
          lastUpdated: user.updatedAt,
        },
        preferences: {
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user settings",
    });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : []),
          ],
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({
          error: "Update failed",
          message: "Username or email already taken",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update profile",
    });
  }
});

router.put("/change-pin", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Current PIN and new PIN are required",
      });
    }

    if (newPin.length < 4) {
      return res.status(400).json({
        error: "Invalid PIN",
        message: "PIN must be at least 4 characters long",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    const isValidPin = await bcrypt.compare(currentPin, user.pin);
    if (!isValidPin) {
      return res.status(401).json({
        error: "Invalid PIN",
        message: "Current PIN is incorrect",
      });
    }

    const hashedNewPin = await bcrypt.hash(newPin, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { pin: hashedNewPin },
    });

    res.json({
      success: true,
      message: "PIN changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to change PIN",
    });
  }
});

router.get("/statistics", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalExpenses = await prisma.expense.count({
      where: { userId },
    });

    const totalIncome = await prisma.income.count({
      where: { userId },
    });

    const totalBudgets = await prisma.budget.count({
      where: { userId },
    });

    const totalNotes = await prisma.note.count({
      where: { userId },
    });

    const totalCategories = await prisma.category.count({
      where: { userId },
    });

    const expenses = await prisma.expense.findMany({
      where: { userId },
      select: { amount: true },
    });

    const income = await prisma.income.findMany({
      where: { userId },
      select: { amount: true },
    });

    const totalExpenseAmount = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const totalIncomeAmount = income.reduce((sum, inc) => sum + inc.amount, 0);

    const firstExpense = await prisma.expense.findFirst({
      where: { userId },
      orderBy: { date: "asc" },
      select: { date: true },
    });

    const lastExpense = await prisma.expense.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    res.json({
      success: true,
      statistics: {
        counts: {
          expenses: totalExpenses,
          income: totalIncome,
          budgets: totalBudgets,
          notes: totalNotes,
          categories: totalCategories,
        },
        amounts: {
          totalExpenses: totalExpenseAmount,
          totalIncome: totalIncomeAmount,
          netAmount: totalIncomeAmount - totalExpenseAmount,
        },
        dates: {
          firstTransaction: firstExpense?.date || null,
          lastTransaction: lastExpense?.date || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get statistics",
    });
  }
});

router.get("/export", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: { category: true },
    });

    const income = await prisma.income.findMany({
      where: { userId },
      include: { category: true },
    });

    const budgets = await prisma.budget.findMany({
      where: { userId },
    });

    const notes = await prisma.note.findMany({
      where: { userId },
    });

    const categories = await prisma.category.findMany({
      where: { userId },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        ...user,
        id: undefined,
      },
      data: {
        expenses,
        income,
        budgets,
        notes,
        categories,
      },
    };

    res.json({
      success: true,
      message: "Data exported successfully",
      exportData,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to export data",
    });
  }
});

router.delete("/account", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        error: "Missing confirmation",
        message: "Password confirmation is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    const isValidPassword = await bcrypt.compare(confirmPassword, user.pin);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid password",
        message: "Password confirmation is incorrect",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete account",
    });
  }
});

// Data Management Endpoints
router.get("/data-usage", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [expenses, income, notes, categories, paymentMethods] = await Promise.all([
      prisma.expense.count({ where: { userId } }),
      prisma.income.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.category.count({ where: { userId } }),
      prisma.paymentMethod.count({ where: { userId } })
    ]);

    const totalRecords = expenses + income + notes + categories + paymentMethods;
    const databaseSize = `${totalRecords} records`;

    res.json({
      success: true,
      dataUsage: {
        totalRecords,
        databaseSize,
        expenses,
        income,
        notes,
        categories,
        paymentMethods
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get data usage"
    });
  }
});

router.post("/backup", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [expenses, income, notes, categories, paymentMethods, preferences] = await Promise.all([
      prisma.expense.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId } }),
      prisma.note.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } }),
      prisma.paymentMethod.count({ where: { userId } }),
      prisma.userPreference.findMany({ where: { userId } })
    ]);

    const backupData = {
      backupDate: new Date().toISOString(),
      userId,
      data: {
        expenses,
        income,
        notes,
        categories,
        paymentMethods,
        preferences
      }
    };

    res.json({
      success: true,
      message: "Backup created successfully",
      backupData
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create backup"
    });
  }
});

router.post("/clear-old-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days } = req.body;

    if (!days || typeof days !== "number") {
      return res.status(400).json({
        error: "Invalid password",
        message: "Days must be a number"
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [deletedExpenses, deletedIncome, deletedNotes] = await Promise.all([
      prisma.expense.deleteMany({
        where: {
          userId,
          date: { lt: cutoffDate }
        }
      }),
      prisma.income.deleteMany({
        where: {
          userId,
          date: { lt: cutoffDate }
        }
      }),
      prisma.note.deleteMany({
        where: {
          userId,
          createdAt: { lt: cutoffDate }
        }
      })
    ]);

    res.json({
      success: true,
      message: "Old data cleared successfully",
      deleted: {
        expenses: deletedExpenses.count,
        income: deletedIncome.count,
        notes: deletedNotes.count
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to clear old data"
    });
  }
});

module.exports = router;
