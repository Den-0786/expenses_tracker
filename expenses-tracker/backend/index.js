const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
// Report scheduler removed - only email functionality in settings
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const prisma = new PrismaClient();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Expense Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Expense Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});

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

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/income", require("./routes/income"));
app.use("/api/budgets", require("./routes/budgets"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/payment-methods", require("./routes/payment-methods"));
app.use("/api/preferences", require("./routes/preferences"));
app.use("/api/onboarding", require("./routes/onboarding"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/search", require("./routes/search"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/notifications", require("./routes/notifications"));
// Reports route removed - only email functionality in settings

app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

process.on("SIGINT", async () => {
  // Report scheduler removed
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  // Report scheduler removed
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Database test: http://localhost:${PORT}/db-test`);

  // Start report scheduler
  // Report scheduler removed
});

module.exports = app;
