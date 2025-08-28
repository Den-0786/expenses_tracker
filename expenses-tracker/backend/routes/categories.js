const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get categories",
    });
  }
});

router.get("/by-type/:type", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    if (!type || !["expense", "income"].includes(type)) {
      return res.status(400).json({
        error: "Invalid category type",
        message: "Type must be 'expense' or 'income'",
      });
    }

    const categories = await prisma.category.findMany({
      where: {
        userId,
        type,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get categories by type",
    });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name and type are required",
      });
    }

    if (!["expense", "income"].includes(type)) {
      return res.status(400).json({
        error: "Invalid category type",
        message: "Type must be 'expense' or 'income'",
      });
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name,
        type,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        error: "Category already exists",
        message: "A category with this name and type already exists",
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        color,
        icon,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create category",
    });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, type, color, icon } = req.body;

    if (type && !["expense", "income"].includes(type)) {
      return res.status(400).json({
        error: "Invalid category type",
        message: "Type must be 'expense' or 'income'",
      });
    }

    const category = await prisma.category.update({
      where: {
        id: parseInt(id),
        userId,
      },
      data: {
        name: name || undefined,
        type: type || undefined,
        color: color !== undefined ? color : undefined,
        icon: icon !== undefined ? icon : undefined,
      },
    });

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update category",
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: {
        id: parseInt(id),
        userId,
      },
      include: {
        expenses: true,
        income: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
        message: "Category does not exist",
      });
    }

    if (category.expenses.length > 0 || category.income.length > 0) {
      return res.status(400).json({
        error: "Cannot delete category",
        message: "Category is being used by expenses or income",
      });
    }

    await prisma.category.delete({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete category",
    });
  }
});

module.exports = router;
