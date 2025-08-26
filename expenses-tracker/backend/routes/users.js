const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user profile",
    });
  }
});

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { username, email, hasCompletedOnboarding } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username || undefined,
        email: email || undefined,
        hasCompletedOnboarding:
          hasCompletedOnboarding !== undefined
            ? hasCompletedOnboarding
            : undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update user profile",
    });
  }
});

module.exports = router;
