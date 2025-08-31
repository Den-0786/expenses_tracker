const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get notifications",
    });
  }
});

router.post("/mark-read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        error: "Invalid notification IDs",
        message: "Notification IDs array is required",
      });
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to mark notifications as read",
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.notification.delete({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete notification",
    });
  }
});

// Notification Settings
router.get("/settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await prisma.userPreference.findMany({
      where: {
        userId,
        key: {
          in: ["dailyReminders", "weeklySummaries", "monthlySummaries"]
        }
      }
    });

    const settings = {
      daily: preferences.find(p => p.key === "dailyReminders")?.value === "true" || false,
      weekly: preferences.find(p => p.key === "weeklySummaries")?.value === "true" || false,
      monthly: preferences.find(p => p.key === "monthlySummaries")?.value === "true" || false
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get notification settings"
    });
  }
});

router.put("/settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, enabled } = req.body;

    if (!type || typeof enabled !== "boolean") {
      return res.status(400).json({
        error: "Invalid request",
        message: "Type and enabled are required"
      });
    }

    const key = type === "daily" ? "dailyReminders" : 
                type === "weekly" ? "weeklySummaries" : 
                type === "monthly" ? "monthlySummaries" : null;

    if (!key) {
      return res.status(400).json({
        error: "Invalid notification type",
        message: "Type must be daily, weekly, or monthly"
      });
    }

    await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key
        }
      },
      update: {
        value: enabled.toString()
      },
      create: {
        userId,
        key,
        value: enabled.toString()
      }
    });

    res.json({
      success: true,
      message: "Notification setting updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update notification setting"
    });
  }
});

module.exports = router;
