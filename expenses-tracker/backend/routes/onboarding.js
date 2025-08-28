const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasCompletedOnboarding: true,
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
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get onboarding status",
    });
  }
});

router.post("/complete", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
      },
    });

    if (preferences && preferences.categories) {
      for (const category of preferences.categories) {
        await prisma.category.create({
          data: {
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            userId,
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Onboarding completed successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to complete onboarding",
    });
  }
});

router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [expenses, income, budgets, notes] = await Promise.all([
      prisma.expense.count({ where: { userId } }),
      prisma.income.count({ where: { userId } }),
      prisma.budget.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
    ]);

    const totalExpenses = await prisma.expense.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const totalIncome = await prisma.income.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    res.json({
      success: true,
      summary: {
        expenses: {
          count: expenses,
          total: totalExpenses._sum.amount || 0,
        },
        income: {
          count: income,
          total: totalIncome._sum.amount || 0,
        },
        budgets: {
          count: budgets,
        },
        notes: {
          count: notes,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get onboarding summary",
    });
  }
});

module.exports = router;
