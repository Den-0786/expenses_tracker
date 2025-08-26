const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const router = express.Router();
const prisma = new PrismaClient();

// Get user settings
router.get("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

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
    console.error("Get user settings error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user settings",
    });
  }
});

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { username, email } = req.body;

    // Check if username or email already exists
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
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update profile",
    });
  }
});

// Change PIN
router.put("/change-pin", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
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

    // Get current user to verify current PIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, user.pin);
    if (!isValidPin) {
      return res.status(401).json({
        error: "Invalid PIN",
        message: "Current PIN is incorrect",
      });
    }

    // Hash new PIN
    const hashedNewPin = await bcrypt.hash(newPin, 10);

    // Update PIN
    await prisma.user.update({
      where: { id: userId },
      data: { pin: hashedNewPin },
    });

    res.json({
      success: true,
      message: "PIN changed successfully",
    });
  } catch (error) {
    console.error("Change PIN error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to change PIN",
    });
  }
});

// Get app statistics
router.get("/statistics", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    // Get counts
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

    // Get total amounts
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

    // Get first and last transaction dates
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
    console.error("Get statistics error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get statistics",
    });
  }
});

// Export user data
router.get("/export", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    // Get all user data
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
        id: undefined, // Remove sensitive ID
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
    console.error("Export data error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to export data",
    });
  }
});

// Delete account
router.delete("/account", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        error: "Missing confirmation",
        message: "Password confirmation is required",
      });
    }

    // Get user to verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(confirmPassword, user.pin);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid password",
        message: "Password confirmation is incorrect",
      });
    }

    // Delete user (this will cascade delete all related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete account",
    });
  }
});

module.exports = router;
