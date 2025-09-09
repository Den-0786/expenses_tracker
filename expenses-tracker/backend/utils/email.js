const nodemailer = require("nodemailer");
const { generateExpenseReport } = require("./reportGenerator");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(to) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "PIN Reset - Expenses Tracker",
    text: `To reset your PIN, open the Expenses Tracker app and go to Sign In screen. Tap "Forgot PIN?" and enter your email: ${to}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">PIN Reset Request</h2>
        <p>You have requested to reset your PIN for the Expenses Tracker app.</p>
        <p><strong>To reset your PIN:</strong></p>
        <ol>
          <li>Open the Expenses Tracker app</li>
          <li>Go to the Sign In screen</li>
          <li>Tap "Forgot PIN?"</li>
          <li>Enter your email: <strong>${to}</strong></li>
          <li>Follow the instructions in the app</li>
        </ol>
        <p style="color: #666; font-size: 12px;">This request was made from your registered account.</p>
      </div>
    `,
  });
}

async function sendExpenseReport(to, userId, type) {
  try {
    const reportData = await generateExpenseReport(userId, type);

    // Only send report if user has some data
    if (
      reportData.totalExpenses === 0 &&
      reportData.totalIncome === 0 &&
      reportData.budgetPerformance.length === 0
    ) {
      return; // Skip sending empty reports
    }

    const subject = `${reportData.period} - ${type.charAt(0).toUpperCase() + type.slice(1)} Expense Report`;

    const html = generateReportHTML(reportData, type);
    const text = generateReportText(reportData, type);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Error generating report:", error);
  }
}

function generateReportHTML(data, type) {
  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin: 0; font-size: 28px;">${data.period}</h1>
          <h2 style="color: #666; margin: 10px 0; font-size: 20px; font-weight: normal;">${type.charAt(0).toUpperCase() + type.slice(1)} Expense Report</h2>
        </div>

        <!-- Summary Cards -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap;">
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 5px; min-width: 150px;">
            <h3 style="margin: 0; color: #2e7d32; font-size: 14px;">TOTAL INCOME</h3>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #2e7d32;">${formatCurrency(data.totalIncome)}</p>
          </div>
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 5px; min-width: 150px;">
            <h3 style="margin: 0; color: #c62828; font-size: 14px;">TOTAL EXPENSES</h3>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #c62828;">${formatCurrency(data.totalExpenses)}</p>
          </div>
          <div style="background: ${data.netIncome >= 0 ? "#e8f5e8" : "#ffebee"}; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 5px; min-width: 150px;">
            <h3 style="margin: 0; color: ${data.netIncome >= 0 ? "#2e7d32" : "#c62828"}; font-size: 14px;">NET INCOME</h3>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: ${data.netIncome >= 0 ? "#2e7d32" : "#c62828"};">
              ${formatCurrency(data.netIncome)}
            </p>
          </div>
        </div>

        <!-- Income Breakdown -->
        ${
          Object.keys(data.incomeByCategory).length > 0
            ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Income Sources</h3>
          ${Object.entries(data.incomeByCategory)
            .map(
              ([category, info]) => `
            <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; color: #333;">${category}</h4>
                <span style="font-weight: bold; color: #2e7d32; font-size: 18px;">${formatCurrency(info.total)}</span>
              </div>
              ${info.items
                .map(
                  (item) => `
                <div style="margin: 5px 0; color: #666; font-size: 14px;">
                  • ${item.description} - ${formatCurrency(item.amount)} (${formatDate(item.date)})
                </div>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        <!-- Expense Breakdown -->
        ${
          Object.keys(data.expensesByCategory).length > 0
            ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #f44336; border-bottom: 2px solid #f44336; padding-bottom: 10px;">Expense Breakdown</h3>
          ${Object.entries(data.expensesByCategory)
            .map(
              ([category, info]) => `
            <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f44336;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; color: #333;">${category}</h4>
                <span style="font-weight: bold; color: #c62828; font-size: 18px;">${formatCurrency(info.total)}</span>
              </div>
              ${info.items
                .map(
                  (item) => `
                <div style="margin: 5px 0; color: #666; font-size: 14px;">
                  • ${item.description} - ${formatCurrency(item.amount)} (${formatDate(item.date)})
                </div>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        <!-- Budget Performance -->
        ${
          data.budgetPerformance.length > 0
            ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #ff9800; border-bottom: 2px solid #ff9800; padding-bottom: 10px;">Budget Performance</h3>
          ${data.budgetPerformance
            .map(
              (budget) => `
            <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid ${budget.status === "Over Budget" ? "#f44336" : "#4CAF50"};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #333;">${budget.category}</h4>
                <span style="font-weight: bold; color: ${budget.status === "Over Budget" ? "#c62828" : "#2e7d32"};">
                  ${budget.status}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Budget: ${formatCurrency(budget.budget)}</span>
                <span>Spent: ${formatCurrency(budget.spent)}</span>
                <span>Remaining: ${formatCurrency(budget.remaining)}</span>
              </div>
              <div style="background: #e0e0e0; border-radius: 10px; height: 8px; margin: 10px 0;">
                <div style="background: ${budget.percentage > 100 ? "#f44336" : budget.percentage > 80 ? "#ff9800" : "#4CAF50"}; height: 100%; width: ${Math.min(budget.percentage, 100)}%; border-radius: 10px;"></div>
              </div>
              <div style="text-align: center; color: #666; font-size: 12px;">${budget.percentage.toFixed(1)}% of budget used</div>
            </div>
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        <!-- Recent Transactions -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">Recent Transactions</h3>
          <div style="display: flex; gap: 20px;">
            ${
              data.expenses.length > 0
                ? `
            <div style="flex: 1;">
              <h4 style="color: #f44336; margin-bottom: 10px;">Recent Expenses</h4>
              ${data.expenses
                .slice(0, 5)
                .map(
                  (expense) => `
                <div style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                  <span style="color: #666;">${expense.description}</span>
                  <span style="color: #c62828; font-weight: bold;">${formatCurrency(expense.amount)}</span>
                </div>
              `
                )
                .join("")}
            </div>
            `
                : ""
            }
            ${
              data.income.length > 0
                ? `
            <div style="flex: 1;">
              <h4 style="color: #4CAF50; margin-bottom: 10px;">Recent Income</h4>
              ${data.income
                .slice(0, 5)
                .map(
                  (inc) => `
                <div style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                  <span style="color: #666;">${inc.description}</span>
                  <span style="color: #2e7d32; font-weight: bold;">${formatCurrency(inc.amount)}</span>
                </div>
              `
                )
                .join("")}
            </div>
            `
                : ""
            }
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Generated automatically by Expenses Tracker • ${new Date().toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </p>
        </div>
      </div>
    </div>
  `;
}

function generateReportText(data, type) {
  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  let text = `${data.period} - ${type.charAt(0).toUpperCase() + type.slice(1)} Expense Report\n\n`;
  text += `SUMMARY:\n`;
  text += `Total Income: ${formatCurrency(data.totalIncome)}\n`;
  text += `Total Expenses: ${formatCurrency(data.totalExpenses)}\n`;
  text += `Net Income: ${formatCurrency(data.netIncome)}\n\n`;

  if (Object.keys(data.incomeByCategory).length > 0) {
    text += `INCOME BREAKDOWN:\n`;
    Object.entries(data.incomeByCategory).forEach(([category, info]) => {
      text += `${category}: ${formatCurrency(info.total)}\n`;
    });
    text += `\n`;
  }

  if (Object.keys(data.expensesByCategory).length > 0) {
    text += `EXPENSE BREAKDOWN:\n`;
    Object.entries(data.expensesByCategory).forEach(([category, info]) => {
      text += `${category}: ${formatCurrency(info.total)}\n`;
    });
    text += `\n`;
  }

  if (data.budgetPerformance.length > 0) {
    text += `BUDGET PERFORMANCE:\n`;
    data.budgetPerformance.forEach((budget) => {
      text += `${budget.category}: ${budget.status} (${budget.percentage.toFixed(1)}% used)\n`;
    });
  }

  return text;
}

module.exports = { sendPasswordResetEmail, sendExpenseReport };
