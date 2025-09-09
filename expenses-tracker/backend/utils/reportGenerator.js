const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function generateExpenseReport(userId, type) {
  const now = new Date();
  let startDate, endDate, periodLabel;

  if (type === "weekly") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    startDate = startOfWeek;
    endDate = endOfWeek;
    periodLabel = `Week of ${startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  } else {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    startDate = startOfMonth;
    endDate = endOfMonth;
    periodLabel = `${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }

  // Fetch expenses with categories
  const expenses = await prisma.expense.findMany({
    where: {
      userId: userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: { date: "desc" },
  });

  // Fetch income with categories
  const income = await prisma.income.findMany({
    where: {
      userId: userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: { date: "desc" },
  });

  // Fetch budgets
  const budgets = await prisma.budget.findMany({
    where: {
      userId: userId,
      startDate: {
        lte: endDate,
      },
      endDate: {
        gte: startDate,
      },
    },
    include: {
      category: true,
    },
  });

  // Calculate totals
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + parseFloat(expense.amount),
    0
  );
  const totalIncome = income.reduce(
    (sum, inc) => sum + parseFloat(inc.amount),
    0
  );
  const netIncome = totalIncome - totalExpenses;

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = { total: 0, items: [] };
    }
    acc[categoryName].total += parseFloat(expense.amount);
    acc[categoryName].items.push({
      description: expense.description,
      amount: parseFloat(expense.amount),
      date: expense.date,
    });
    return acc;
  }, {});

  // Group income by category
  const incomeByCategory = income.reduce((acc, inc) => {
    const categoryName = inc.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = { total: 0, items: [] };
    }
    acc[categoryName].total += parseFloat(inc.amount);
    acc[categoryName].items.push({
      description: inc.description,
      amount: parseFloat(inc.amount),
      date: inc.date,
    });
    return acc;
  }, {});

  // Calculate budget performance
  const budgetPerformance = budgets.map((budget) => {
    const categoryExpenses =
      expensesByCategory[budget.category?.name || "Uncategorized"]?.total || 0;
    const budgetAmount = parseFloat(budget.amount);
    const remaining = budgetAmount - categoryExpenses;
    const percentage =
      budgetAmount > 0 ? (categoryExpenses / budgetAmount) * 100 : 0;

    return {
      category: budget.category?.name || "Uncategorized",
      budget: budgetAmount,
      spent: categoryExpenses,
      remaining: remaining,
      percentage: percentage,
      status: remaining >= 0 ? "Under Budget" : "Over Budget",
    };
  });

  return {
    period: periodLabel,
    startDate,
    endDate,
    totalExpenses,
    totalIncome,
    netIncome,
    expensesByCategory,
    incomeByCategory,
    budgetPerformance,
    expenses: expenses.slice(0, 10), // Top 10 recent expenses
    income: income.slice(0, 10), // Top 10 recent income
  };
}

module.exports = { generateExpenseReport };
