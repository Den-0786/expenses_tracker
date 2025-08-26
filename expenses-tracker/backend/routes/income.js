const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get all income for a user
router.get("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    const income = await prisma.income.findMany({
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
      income,
    });
  } catch (error) {
    console.error("Get income error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get income",
    });
  }
});

// Get income by date range
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

    const income = await prisma.income.findMany({
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
      income,
    });
  } catch (error) {
    console.error("Get income by date range error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get income by date range",
    });
  }
});

// Create new income
router.post("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { amount, description, source, date, categoryId } = req.body;

    if (!amount) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Amount is required",
      });
    }

    const income = await prisma.income.create({
      data: {
        amount: parseFloat(amount),
        description,
        source,
        date: date ? new Date(date) : new Date(),
        categoryId: categoryId ? parseInt(categoryId) : null,
        userId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Income created successfully",
      income,
    });
  } catch (error) {
    console.error("Create income error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create income",
    });
  }
});

// Update income
router.put("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;
    const { amount, description, source, date, categoryId } = req.body;

    const income = await prisma.income.update({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this income
      },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        description: description !== undefined ? description : undefined,
        source: source !== undefined ? source : undefined,
        date: date ? new Date(date) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      message: "Income updated successfully",
      income,
    });
  } catch (error) {
    console.error("Update income error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update income",
    });
  }
});

// Delete income
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;

    await prisma.income.delete({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this income
      },
    });

    res.json({
      success: true,
      message: "Income deleted successfully",
    });
  } catch (error) {
    console.error("Delete income error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete income",
    });
  }
});

module.exports = router;
