const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

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
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get income",
    });
  }
});

router.get("/by-date-range", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get income by date range",
    });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create income",
    });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, description, source, date, categoryId } = req.body;

    const income = await prisma.income.update({
      where: {
        id: parseInt(id),
        userId,
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
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update income",
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.income.delete({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    res.json({
      success: true,
      message: "Income deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete income",
    });
  }
});

module.exports = router;
