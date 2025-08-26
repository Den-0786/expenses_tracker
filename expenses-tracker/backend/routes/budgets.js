const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get all budgets for a user
router.get("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: {
        startDate: "desc",
      },
    });

    res.json({
      success: true,
      budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get budgets",
    });
  }
});

// Create new budget
router.post("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { amount, period, startDate, endDate } = req.body;

    if (!amount || !period || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Amount, period, start date, and end date are required",
      });
    }

    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create budget",
    });
  }
});

// Update budget
router.put("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;
    const { amount, period, startDate, endDate } = req.body;

    const budget = await prisma.budget.update({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this budget
      },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        period: period || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    res.json({
      success: true,
      message: "Budget updated successfully",
      budget,
    });
  } catch (error) {
    console.error("Update budget error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update budget",
    });
  }
});

// Delete budget
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;

    await prisma.budget.delete({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this budget
      },
    });

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete budget",
    });
  }
});

module.exports = router;
