const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all preferences for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: {
        key: "asc",
      },
    });

    // Convert array to object for easier frontend consumption
    const preferencesObject = preferences.reduce((acc, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {});

    res.json({
      success: true,
      preferences: preferencesObject,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get preferences",
    });
  }
});

// Get a specific preference by key
router.get("/:key", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { key } = req.params;

    const preference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    if (!preference) {
      return res.status(404).json({
        error: "Preference not found",
        message: "Preference does not exist",
      });
    }

    res.json({
      success: true,
      preference: {
        key: preference.key,
        value: preference.value,
      },
    });
  } catch (error) {
    console.error("Error fetching preference:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get preference",
    });
  }
});

// Set a preference (create or update)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Key and value are required",
      });
    }

    // Use upsert to create or update
    const preference = await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      update: {
        value: value.toString(),
        updatedAt: new Date(),
      },
      create: {
        key,
        value: value.toString(),
        userId,
      },
    });

    res.json({
      success: true,
      message: "Preference saved successfully",
      preference: {
        key: preference.key,
        value: preference.value,
      },
    });
  } catch (error) {
    console.error("Error saving preference:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to save preference",
    });
  }
});

// Update a specific preference
router.put("/:key", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Value is required",
      });
    }

    const preference = await prisma.userPreference.update({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      data: {
        value: value.toString(),
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Preference updated successfully",
      preference: {
        key: preference.key,
        value: preference.value,
      },
    });
  } catch (error) {
    console.error("Error updating preference:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update preference",
    });
  }
});

// Delete a preference
router.delete("/:key", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { key } = req.params;

    await prisma.userPreference.delete({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    res.json({
      success: true,
      message: "Preference deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting preference:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete preference",
    });
  }
});

module.exports = router;
