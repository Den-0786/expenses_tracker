const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get onboarding status
router.get("/status", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        hasCompletedOnboarding: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist"
      });
    }

    res.json({
      success: true,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error("Get onboarding status error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get onboarding status"
    });
  }
});

// Complete onboarding
router.post("/complete", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { hasCompletedOnboarding } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: hasCompletedOnboarding !== undefined ? hasCompletedOnboarding : true
      },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: "Onboarding completed successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Complete onboarding error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to complete onboarding"
    });
  }
});

// Get onboarding summary
router.get("/summary", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        hasCompletedOnboarding: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist"
      });
    }

    // Get basic stats for onboarding summary
    const totalExpenses = await prisma.expense.count({
      where: { userId }
    });

    const totalIncome = await prisma.income.count({
      where: { userId }
    });

    const totalBudgets = await prisma.budget.count({
      where: { userId }
    });

    res.json({
      success: true,
      user: {
        username: user.username,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        memberSince: user.createdAt
      },
      summary: {
        totalExpenses,
        totalIncome,
        totalBudgets
      }
    });

  } catch (error) {
    console.error("Get onboarding summary error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get onboarding summary"
    });
  }
});

module.exports = router;
