const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all payment methods for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get payment methods",
    });
  }
});

// Create a new payment method
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name is required",
      });
    }

    // Check if payment method already exists for this user
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        name: {
          equals: name,
          mode: "insensitive", // Case-insensitive comparison
        },
      },
    });

    if (existingMethod) {
      return res.status(400).json({
        error: "Payment method already exists",
        message: "A payment method with this name already exists",
      });
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        name: name.trim(),
        icon: icon || "credit-card",
        color: color || "#" + Math.floor(Math.random() * 16777215).toString(16),
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment method created successfully",
      paymentMethod,
    });
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create payment method",
    });
  }
});

// Update a payment method
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name is required",
      });
    }

    // Check if name already exists for this user (excluding current method)
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: {
          not: parseInt(id),
        },
      },
    });

    if (existingMethod) {
      return res.status(400).json({
        error: "Payment method already exists",
        message: "A payment method with this name already exists",
      });
    }

    const paymentMethod = await prisma.paymentMethod.update({
      where: {
        id: parseInt(id),
        userId,
      },
      data: {
        name: name.trim(),
        icon: icon || undefined,
        color: color || undefined,
      },
    });

    res.json({
      success: true,
      message: "Payment method updated successfully",
      paymentMethod,
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update payment method",
    });
  }
});

// Delete a payment method
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if payment method is being used by any expenses
    const expensesUsingMethod = await prisma.expense.findFirst({
      where: {
        paymentMethodId: parseInt(id),
        userId,
      },
    });

    if (expensesUsingMethod) {
      return res.status(400).json({
        error: "Cannot delete payment method",
        message: "This payment method is being used by expenses",
      });
    }

    await prisma.paymentMethod.delete({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    res.json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete payment method",
    });
  }
});

module.exports = router;
