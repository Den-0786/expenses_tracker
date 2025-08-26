const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories for a user
router.get("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

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
    console.error("Get categories error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get categories",
    });
  }
});

// Get categories by type
router.get("/by-type/:type", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { type } = req.params;

    if (!["expense", "income"].includes(type)) {
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
    console.error("Get categories by type error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get categories by type",
    });
  }
});

// Create new category
router.post("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
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
    console.error("Create category error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create category",
    });
  }
});

// Update category
router.put("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;
    const { name, type, color, icon } = req.body;

    const category = await prisma.category.update({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this category
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
    console.error("Update category error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update category",
    });
  }
});

// Delete category
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;

    await prisma.category.delete({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this category
      },
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete category",
    });
  }
});

module.exports = router;
