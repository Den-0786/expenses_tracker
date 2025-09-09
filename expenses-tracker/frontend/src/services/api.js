import { API_CONFIG } from "../config/api";
import { showNetworkError } from "../utils/toast";

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const config = {
        method: options.method || "GET",
        headers: { Accept: "application/json", ...this.getHeaders() },
        signal: controller.signal,
        ...options,
      };

      const response = await fetch(url, config).finally(() =>
        clearTimeout(timeoutId)
      );

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && (errorData.message || errorData.error)) {
            message = errorData.message || errorData.error;
          }
        } catch (_) {
          try {
            const text = await response.text();
            if (text) message = text;
          } catch (_) {}
        }
        throw new Error(message);
      }

      // Try JSON first, fallback to text
      try {
        return await response.json();
      } catch (_) {
        const text = await response.text();
        return text ? { success: true, data: text } : { success: true };
      }
    } catch (error) {
      if (error.name === "AbortError") {
        showNetworkError();
        throw new Error("Network timeout. Please try again.");
      }
      // React Native fetch throws TypeError on network failure
      if (
        error instanceof TypeError ||
        (typeof error.message === "string" &&
          (error.message.includes("Network request failed") ||
            error.message.includes("Failed to fetch")))
      ) {
        showNetworkError();
        throw new Error(
          "No internet connection. Please check your internet and try again."
        );
      }
      throw error;
    }
  }

  // Authentication
  async signup(userData) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async signin(credentials) {
    return this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async verifyToken() {
    return this.request("/auth/verify");
  }

  // User Management
  async getUserProfile() {
    return this.request("/users/profile");
  }

  async updateUserProfile(profileData) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async updateUserProfileImage(profileImage) {
    return this.request("/users/profile-image", {
      method: "PUT",
      body: JSON.stringify({ profileImage }),
    });
  }

  async getUserProfileImage() {
    return this.request("/users/profile-image");
  }

  async removeUserProfileImage() {
    return this.request("/users/profile-image", {
      method: "DELETE",
    });
  }

  // Expenses
  async getExpenses() {
    return this.request("/expenses");
  }

  async getExpensesByDateRange(startDate, endDate) {
    return this.request(
      `/expenses/by-date-range?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async createExpense(expenseData) {
    return this.request("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(id, expenseData) {
    return this.request(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, {
      method: "DELETE",
    });
  }

  // Income
  async getIncome() {
    return this.request("/income");
  }

  async getIncomeByDateRange(startDate, endDate) {
    return this.request(
      `/income/by-date-range?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async createIncome(incomeData) {
    return this.request("/income", {
      method: "POST",
      body: JSON.stringify(incomeData),
    });
  }

  async updateIncome(id, incomeData) {
    return this.request(`/income/${id}`, {
      method: "PUT",
      body: JSON.stringify(incomeData),
    });
  }

  async deleteIncome(id) {
    return this.request(`/income/${id}`, {
      method: "DELETE",
    });
  }

  // Notes
  async getNotes() {
    return this.request("/notes");
  }

  async createNote(noteData) {
    return this.request("/notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    });
  }

  async updateNote(id, noteData) {
    return this.request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(noteData),
    });
  }

  async deleteNote(id) {
    return this.request(`/notes/${id}`, {
      method: "DELETE",
    });
  }

  // Budgets
  async getBudgets() {
    return this.request("/budgets");
  }

  async createBudget(budgetData) {
    return this.request("/budgets", {
      method: "POST",
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudget(id, budgetData) {
    return this.request(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(id) {
    return this.request(`/budgets/${id}`, {
      method: "DELETE",
    });
  }

  // Categories
  async getCategories() {
    return this.request("/categories");
  }

  async getCategoriesByType(type) {
    return this.request(`/categories/by-type/${type}`);
  }

  async createCategory(categoryData) {
    return this.request("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Payment Methods
  async getPaymentMethods() {
    return this.request("/payment-methods");
  }

  async createPaymentMethod(paymentMethodData) {
    return this.request("/payment-methods", {
      method: "POST",
      body: JSON.stringify(paymentMethodData),
    });
  }

  async updatePaymentMethod(id, paymentMethodData) {
    return this.request(`/payment-methods/${id}`, {
      method: "PUT",
      body: JSON.stringify(paymentMethodData),
    });
  }

  async deletePaymentMethod(id) {
    return this.request(`/payment-methods/${id}`, {
      method: "DELETE",
    });
  }

  // User Preferences
  async getUserPreferences() {
    return this.request("/preferences");
  }

  async getUserPreference(key) {
    return this.request(`/preferences/${key}`);
  }

  async setUserPreference(key, value) {
    return this.request("/preferences", {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });
  }

  async updateUserPreference(key, value) {
    return this.request(`/preferences/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  }

  async deleteUserPreference(key) {
    return this.request(`/preferences/${key}`, {
      method: "DELETE",
    });
  }

  // Dashboard
  async getDashboardOverview() {
    return this.request("/dashboard/overview");
  }

  async getDashboardAnalytics(period = "month") {
    return this.request(`/dashboard/analytics?period=${period}`);
  }

  async getBudgetComparison() {
    return this.request("/dashboard/budget-comparison");
  }

  // Onboarding
  async getOnboardingStatus() {
    return this.request("/onboarding/status");
  }

  async completeOnboarding(preferences) {
    return this.request("/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({ preferences }),
    });
  }

  async getOnboardingSummary() {
    return this.request("/onboarding/summary");
  }

  // Settings
  async getUserSettings() {
    return this.request("/settings");
  }

  // Notification Settings
  async getNotificationSettings() {
    return this.request("/notifications/settings");
  }

  async updateNotificationSetting(type, enabled) {
    return this.request("/notifications/settings", {
      method: "PUT",
      body: JSON.stringify({ type, enabled }),
    });
  }

  async updateProfile(profileData) {
    return this.request("/settings/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async changePin(pinData) {
    return this.request("/settings/change-pin", {
      method: "PUT",
      body: JSON.stringify(pinData),
    });
  }

  async getStatistics() {
    return this.request("/settings/statistics");
  }

  async exportData() {
    return this.request("/settings/export");
  }

  async deleteAccount(confirmPassword) {
    return this.request("/settings/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmPassword }),
    });
  }

  // Data Management
  async getDataUsage() {
    return this.request("/settings/data-usage");
  }

  async exportData() {
    return this.request("/settings/export");
  }

  async backupData() {
    return this.request("/settings/backup");
  }

  async clearOldData(days) {
    return this.request("/settings/clear-old-data", {
      method: "POST",
      body: JSON.stringify({ days }),
    });
  }

  // Search
  async search(query, type = "all", startDate = null, endDate = null) {
    let url = `/search?query=${encodeURIComponent(query)}&type=${type}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request(url);
  }

  // Analytics
  async getSpendingTrends(period = "month", months = 6) {
    return this.request(
      `/analytics/spending-trends?period=${period}&months=${months}`
    );
  }

  async getCategoryBreakdown(
    type = "expenses",
    startDate = null,
    endDate = null
  ) {
    let url = `/analytics/category-breakdown?type=${type}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request(url);
  }

  async getBudgetProgress(period = "month") {
    return this.request(`/analytics/budget-progress?period=${period}`);
  }

  // Reports
  async getBudgetAggregation(period = "current") {
    return this.request(`/reports/budget-aggregation?period=${period}`);
  }

  async getWeeklyReport(weekStart = null) {
    const url = weekStart
      ? `/reports/weekly-report?weekStart=${weekStart}`
      : "/reports/weekly-report";
    return this.request(url);
  }

  async getMonthlyReport(month = null, year = null) {
    let url = "/reports/monthly-report";
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return this.request(url);
  }

  // Manual report generation
  async generateWeeklyReport() {
    return this.request("/reports/generate-weekly", {
      method: "POST",
    });
  }

  async generateMonthlyReport() {
    return this.request("/reports/generate-monthly", {
      method: "POST",
    });
  }
}

export default new ApiService();
