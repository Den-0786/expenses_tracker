const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/spending-trends", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "month", months = 6 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

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
      orderBy: {
        date: "asc",
      },
    });

    const trends = {};
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const periodKey =
        period === "month"
          ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
          : period === "week"
            ? `${currentDate.getFullYear()}-W${Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}`
            : `${currentDate.getFullYear()}-${String(currentDate.getDate()).padStart(2, "0")}`;

      trends[periodKey] = {
        total: 0,
        count: 0,
        categories: {},
      };

      if (period === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (period === "week") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      let periodKey;

      if (period === "month") {
        periodKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "week") {
        const weekNumber = Math.ceil(
          (expenseDate.getDate() +
            new Date(
              expenseDate.getFullYear(),
              expenseDate.getMonth(),
              1
            ).getDay()) /
            7
        );
        periodKey = `${expenseDate.getFullYear()}-W${weekNumber}`;
      } else {
        periodKey = `${expenseDate.getFullYear()}-${String(expenseDate.getDate()).padStart(2, "0")}`;
      }

      if (trends[periodKey]) {
        trends[periodKey].total += expense.amount;
        trends[periodKey].count += 1;

        const categoryName = expense.category?.name || "Uncategorized";
        if (!trends[periodKey].categories[categoryName]) {
          trends[periodKey].categories[categoryName] = 0;
        }
        trends[periodKey].categories[categoryName] += expense.amount;
      }
    });

    res.json({
      success: true,
      period,
      months: parseInt(months),
      trends,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get spending trends",
    });
  }
});

router.get("/category-breakdown", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type = "expenses" } = req.query;

    let whereClause = { userId };
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    let data;
    if (type === "expenses") {
      data = await prisma.expense.findMany({
        where: whereClause,
        include: {
          category: true,
        },
      });
    } else if (type === "income") {
      data = await prisma.income.findMany({
        where: whereClause,
        include: {
          category: true,
        },
      });
    } else {
      return res.status(400).json({
        error: "Invalid type",
        message: "Type must be 'expenses' or 'income'",
      });
    }

    const breakdown = {};
    let total = 0;

    data.forEach((item) => {
      const categoryName = item.category?.name || "Uncategorized";
      if (!breakdown[categoryName]) {
        breakdown[categoryName] = {
          total: 0,
          count: 0,
          percentage: 0,
        };
      }
      breakdown[categoryName].total += item.amount;
      breakdown[categoryName].count += 1;
      total += item.amount;
    });

    Object.keys(breakdown).forEach((category) => {
      breakdown[category].percentage =
        total > 0 ? (breakdown[category].total / total) * 100 : 0;
    });

    const sortedBreakdown = Object.entries(breakdown)
      .sort(([, a], [, b]) => b.total - a.total)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    res.json({
      success: true,
      type,
      total,
      breakdown: sortedBreakdown,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get category breakdown",
    });
  }
});

router.get("/budget-progress", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "month" } = req.query;

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        period,
      },
    });

    const today = new Date();
    let startDate, endDate;

    if (period === "daily") {
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      endDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );
    } else if (period === "weekly") {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(today.getFullYear(), today.getMonth(), diff);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (period === "monthly") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === "yearly") {
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
    }

    const expenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    const totalSpent = expenses._sum.amount || 0;

    const budgetProgress = budgets.map((budget) => {
      const spent = totalSpent;
      const remaining = Math.max(0, budget.amount - spent);
      const percentageUsed =
        budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const status =
        percentageUsed >= 100
          ? "over"
          : percentageUsed >= 80
            ? "warning"
            : "good";

      return {
        id: budget.id,
        period: budget.period,
        budget: budget.amount,
        spent,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        status,
      };
    });

    res.json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      totalSpent,
      budgetProgress,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get budget progress",
    });
  }
});

module.exports = router;
