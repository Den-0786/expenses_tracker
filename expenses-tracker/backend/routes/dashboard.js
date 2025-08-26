const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview
router.get("/overview", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { period = "month" } = req.query;

    const now = new Date();
    let startDate, endDate;

    // Calculate date range based on period
    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "week":
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get expenses for the period
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get income for the period
    const income = await prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const netAmount = totalIncome - totalExpenses;

    // Get budget for the period
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        period,
        startDate: { lte: startDate },
        endDate: { gte: endDate }
      }
    });

    // Get recent transactions
    const recentTransactions = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        category: true
      }
    });

    // Get category breakdown
    const categoryBreakdown = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    // Get daily spending trend (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyTrend = await prisma.expense.groupBy({
      by: ["date"],
      where: {
        userId,
        date: {
          gte: sevenDaysAgo,
          lte: now
        }
      },
      _sum: {
        amount: true
      }
    });

    res.json({
      success: true,
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      overview: {
        totalExpenses,
        totalIncome,
        netAmount,
        budgetAmount: budget?.amount || 0,
        remainingBudget: budget ? budget.amount - totalExpenses : 0
      },
      recentTransactions,
      categoryBreakdown,
      dailyTrend,
      periodDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    console.error("Get dashboard overview error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get dashboard overview"
    });
  }
});

// Get spending analytics
router.get("/analytics", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { period = "month" } = req.query;

    const now = new Date();
    let startDate, endDate;

    // Calculate date range
    switch (period) {
      case "week":
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get expenses with categories
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      }
    });

    // Calculate analytics
    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageSpending = expenses.length > 0 ? totalSpending / expenses.length : 0;
    
    // Top spending categories
    const categorySpending = {};
    expenses.forEach(expense => {
      const categoryName = expense.category?.name || "Uncategorized";
      categorySpending[categoryName] = (categorySpending[categoryName] || 0) + expense.amount;
    });

    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    // Spending by day of week
    const dayOfWeekSpending = {};
    expenses.forEach(expense => {
      const day = new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekSpending[day] = (dayOfWeekSpending[day] || 0) + expense.amount;
    });

    res.json({
      success: true,
      period,
      analytics: {
        totalSpending,
        averageSpending,
        totalTransactions: expenses.length,
        topCategories,
        dayOfWeekSpending
      }
    });

  } catch (error) {
    console.error("Get spending analytics error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get spending analytics"
    });
  }
});

// Get budget vs actual comparison
router.get("/budget-comparison", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month budget
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        period: "monthly",
        startDate: { lte: currentMonth },
        endDate: { gte: nextMonth }
      }
    });

    // Get current month expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: currentMonth,
          lte: nextMonth
        }
      }
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const budgetAmount = budget?.amount || 0;
    const remainingBudget = budgetAmount - totalExpenses;
    const spendingPercentage = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

    res.json({
      success: true,
      period: "current_month",
      budget: {
        amount: budgetAmount,
        spent: totalExpenses,
        remaining: remainingBudget,
        percentage: Math.round(spendingPercentage * 100) / 100
      },
      status: remainingBudget >= 0 ? "under_budget" : "over_budget"
    });

  } catch (error) {
    console.error("Get budget comparison error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get budget comparison"
    });
  }
});

module.exports = router;
