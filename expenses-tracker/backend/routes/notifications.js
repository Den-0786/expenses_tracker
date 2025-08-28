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

module.exports = router;
