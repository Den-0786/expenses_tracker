const API_BASE_URL = "http://localhost:3000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
      const config = {
        headers: this.getHeaders(),
        ...options,
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
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
}

export default new ApiService();
