const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

// Get email preferences
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const preferences = await prisma.userPreference.findMany({
      where: {
        userId: userId,
        key: {
          in: ["weeklyEmailReports", "monthlyEmailReports"],
        },
      },
    });

    const emailPreferences = {
      weeklyReports: false,
      monthlyReports: false,
    };

    preferences.forEach((pref) => {
      if (pref.key === "weeklyEmailReports") {
        emailPreferences.weeklyReports = pref.value === "true";
      } else if (pref.key === "monthlyEmailReports") {
        emailPreferences.monthlyReports = pref.value === "true";
      }
    });

    res.json({ success: true, preferences: emailPreferences });
  } catch (error) {
    res.status(500).json({ error: "Failed to get email preferences" });
  }
});

// Update email preferences
router.put("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { weeklyReports, monthlyReports } = req.body;

    // Update or create weekly email reports preference
    await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId: userId,
          key: "weeklyEmailReports",
        },
      },
      update: {
        value: weeklyReports ? "true" : "false",
      },
      create: {
        userId: userId,
        key: "weeklyEmailReports",
        value: weeklyReports ? "true" : "false",
      },
    });

    // Update or create monthly email reports preference
    await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId: userId,
          key: "monthlyEmailReports",
        },
      },
      update: {
        value: monthlyReports ? "true" : "false",
      },
      create: {
        userId: userId,
        key: "monthlyEmailReports",
        value: monthlyReports ? "true" : "false",
      },
    });

    res.json({
      success: true,
      message: "Email preferences updated successfully",
      preferences: {
        weeklyReports,
        monthlyReports,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update email preferences" });
  }
});

module.exports = router;
