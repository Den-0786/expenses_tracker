const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
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
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user profile",
    });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({
        error: "Missing fields",
        message: "At least one field (username or email) is required",
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : []),
          ],
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({
          error: "Update failed",
          message: "Username or email already taken",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update profile",
    });
  }
});

// Update profile image
router.put("/profile-image", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileImage } = req.body;

    if (!profileImage) {
      return res.status(400).json({
        error: "Missing profile image",
        message: "Profile image data is required",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile image updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update profile image",
    });
  }
});

// Get profile image
router.get("/profile-image", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profileImage: true,
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
      profileImage: user.profileImage,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get profile image",
    });
  }
});

// Remove profile image
router.delete("/profile-image", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile image removed successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to remove profile image",
    });
  }
});

module.exports = router;
