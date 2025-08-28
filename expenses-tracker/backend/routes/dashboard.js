const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/overview", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [monthlyExpenses, monthlyIncome, totalExpenses, totalIncome] =
      await Promise.all([
        prisma.expense.aggregate({
          where: {
            userId,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        }),
        prisma.income.aggregate({
          where: {
            userId,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
        prisma.income.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
      ]);

    const monthlyExpenseTotal = monthlyExpenses._sum.amount || 0;
    const monthlyIncomeTotal = monthlyIncome._sum.amount || 0;
    const totalExpenseAmount = totalExpenses._sum.amount || 0;
    const totalIncomeAmount = totalIncome._sum.amount || 0;

    const balance = monthlyIncomeTotal - monthlyExpenseTotal;
    const totalBalance = totalIncomeAmount - totalExpenseAmount;

    const recentExpenses = await prisma.expense.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    });

    const recentIncome = await prisma.income.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    });

    res.json({
      success: true,
      overview: {
        monthly: {
          expenses: monthlyExpenseTotal,
          income: monthlyIncomeTotal,
          balance,
        },
        total: {
          expenses: totalExpenseAmount,
          income: totalIncomeAmount,
          balance: totalBalance,
        },
        recent: {
          expenses: recentExpenses,
          income: recentIncome,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get dashboard overview",
    });
  }
});

router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "month" } = req.query;

    let startDate, endDate;
    const today = new Date();

    switch (period) {
      case "week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startDate = startOfWeek;
        endDate = today;
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = today;
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const income = await prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const expenseByCategory = {};
    const incomeByCategory = {};

    expenses.forEach((expense) => {
      const categoryName = expense.category?.name || "Uncategorized";
      expenseByCategory[categoryName] =
        (expenseByCategory[categoryName] || 0) + expense.amount;
    });

    income.forEach((inc) => {
      const categoryName = inc.category?.name || "Uncategorized";
      incomeByCategory[categoryName] =
        (incomeByCategory[categoryName] || 0) + inc.amount;
    });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

    res.json({
      success: true,
      analytics: {
        period,
        startDate,
        endDate,
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses,
        expenseByCategory,
        incomeByCategory,
        expenseCount: expenses.length,
        incomeCount: income.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get spending analytics",
    });
  }
});

router.get("/budget-comparison", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const budgets = await prisma.budget.findMany({
      where: { userId },
    });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    const monthlyExpenseTotal = monthlyExpenses._sum.amount || 0;

    const budgetComparison = budgets.map((budget) => {
      let spent = 0;
      let remaining = budget.amount;

      if (budget.period === "monthly") {
        spent = monthlyExpenseTotal;
        remaining = Math.max(0, budget.amount - spent);
      }

      return {
        id: budget.id,
        period: budget.period,
        budget: budget.amount,
        spent,
        remaining,
        percentageUsed: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      };
    });

    res.json({
      success: true,
      budgetComparison,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get budget comparison",
    });
  }
});

module.exports = router;
