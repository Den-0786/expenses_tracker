const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();
const prisma = new PrismaClient();

router.post("/signup", async (req, res) => {
  try {
    const { username, email, pin } = req.body;

    if (!username || !email || !pin) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Username, email, and PIN are required",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
        message: "Username or email already taken",
      });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        pin: hashedPin,
        hasCompletedOnboarding: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create user",
    });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        error: "Missing PIN",
        message: "PIN is required",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: req.body.username || "default" },
          { email: req.body.email || "default@example.com" },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "User not found",
      });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin);
    if (!isValidPin) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Invalid PIN",
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Sign in successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to sign in",
    });
  }
});

// Verify Token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
        message: "Authorization token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        hasCompletedOnboarding: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid token",
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      error: "Invalid token",
      message: "Token verification failed",
    });
  }
});

// PIN Reset Request
router.post("/reset-pin-request", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Missing email",
        message: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No account found with this email",
      });
    }

    await sendPasswordResetEmail(email);

    res.json({
      success: true,
      message: "PIN reset email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to send reset email",
    });
  }
});

// PIN Reset Confirm
router.post("/reset-pin-confirm", async (req, res) => {
  try {
    const { email, newPin } = req.body;

    if (!email || !newPin) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Email and new PIN are required",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No account found with this email",
      });
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.user.update({
      where: { email },
      data: { pin: hashedPin },
    });

    res.json({
      success: true,
      message: "PIN reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to reset PIN",
    });
  }
});

// Change PIN
router.post("/change-pin", async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
        message: "Authorization token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User not found",
      });
    }

    const isValidPin = await bcrypt.compare(oldPin, user.pin);
    if (!isValidPin) {
      return res.status(400).json({
        error: "Invalid PIN",
        message: "Current PIN is incorrect",
      });
    }

    const hashedNewPin = await bcrypt.hash(newPin, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { pin: hashedNewPin },
    });

    res.json({
      success: true,
      message: "PIN changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to change PIN",
    });
  }
});

module.exports = router;
