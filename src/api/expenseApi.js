import { api } from "./api";

export async function saveExpense(expenseData) {
  try {
    const response = await api.post("/add-expense", expenseData);
    return response.data;
  } catch (error) {
    console.error("❌ Error saving expense:", error);
    if (error.response) {
      // Error from backend
      throw new Error(error.response.data?.detail || "Failed to save expense");
    } else {
      // Network or unexpected error
      throw new Error("Network error or server not reachable");
    }
  }
}

export const getExpenseSummary = async (period = "last_7_days") => {
  try {
    const res = await api.get(`/api/expenses/summary?period=${period}`);
    return res.data;
  } catch (err) {
    console.error("Expense summary API error:", err.response?.data || err.message);
    throw err;
  }
};


export const getMonthlySummary = async (year = new Date().getFullYear()) => {
  try {
    const res = await api.get(`/api/expenses/monthly-summary?year=${year}`);
    return res.data;
  } catch (err) {
    console.error("Monthly summary API error:", err.response?.data || err.message);
    throw err;
  }
};


export const getExpenseFeed = async (page = 1, limit = 10, month = null) => {
  try {
    const query = month
      ? `/api/expenses/feed?page=${page}&limit=${limit}&month=${month}`
      : `/api/expenses/feed?page=${page}&limit=${limit}`;

    const res = await api.get(query);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
};
