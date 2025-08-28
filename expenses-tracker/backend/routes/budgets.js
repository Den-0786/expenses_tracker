const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      budgets,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get budgets",
    });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, period, startDate, endDate } = req.body;

    if (!amount || !period) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Amount and period are required",
      });
    }

    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        period,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create budget",
    });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, period, startDate, endDate } = req.body;

    const budget = await prisma.budget.update({
      where: {
        id: parseInt(id),
        userId,
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
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update budget",
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.budget.delete({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete budget",
    });
  }
});

module.exports = router;
