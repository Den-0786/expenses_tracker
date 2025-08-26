const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Expense Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});

// Database connection test
app.get("/db-test", async (req, res) => {
  try {
    await prisma.$connect();
    res.json({
      status: "OK",
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Basic API routes structure
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/income", require("./routes/income"));
app.use("/api/budgets", require("./routes/budgets"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/onboarding", require("./routes/onboarding"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/settings", require("./routes/settings"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Database test: http://localhost:${PORT}/db-test`);
});

module.exports = app;
