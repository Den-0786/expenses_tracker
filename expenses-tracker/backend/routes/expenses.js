const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get all expenses for a user
router.get("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get expenses",
    });
  }
});

// Get expenses by date range
router.get("/by-date-range", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing date range",
        message: "Start date and end date are required",
      });
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Get expenses by date range error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get expenses by date range",
    });
  }
});

// Create new expense
router.post("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { title, amount, date, description, categoryId } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Title and amount are required",
      });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        userId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create expense",
    });
  }
});

// Update expense
router.put("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;
    const { title, amount, date, description, categoryId } = req.body;

    const expense = await prisma.expense.update({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this expense
      },
      data: {
        title: title || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        description: description !== undefined ? description : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update expense",
    });
  }
});

// Delete expense
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;

    await prisma.expense.delete({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this expense
      },
    });

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete expense",
    });
  }
});

module.exports = router;
