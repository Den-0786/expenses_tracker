const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, type, startDate, endDate } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Missing search query",
        message: "Search query is required",
      });
    }

    const searchQuery = query.trim().toLowerCase();
    const results = {};

    if (!type || type === "all" || type === "expenses") {
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { description: { contains: searchQuery, mode: "insensitive" } },
          ],
          ...(startDate &&
            endDate && {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
        },
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
      });
      results.expenses = expenses;
    }

    if (!type || type === "all" || type === "income") {
      const income = await prisma.income.findMany({
        where: {
          userId,
          OR: [
            { description: { contains: searchQuery, mode: "insensitive" } },
            { source: { contains: searchQuery, mode: "insensitive" } },
          ],
          ...(startDate &&
            endDate && {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
        },
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
      });
      results.income = income;
    }

    if (!type || type === "all" || type === "notes") {
      const notes = await prisma.note.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { content: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      results.notes = notes;
    }

    const totalResults = Object.values(results).reduce(
      (sum, items) => sum + items.length,
      0
    );

    res.json({
      success: true,
      query: searchQuery,
      totalResults,
      results,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to perform search",
    });
  }
});

module.exports = router;
