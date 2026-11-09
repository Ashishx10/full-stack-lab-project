/** Typed client for the backend REST API (Netlify Functions under /api). */

export interface Category {
  id: number;
  name: string;
  color: string;
  monthlyBudget: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  spentOn: string;
  note: string;
  createdAt: string;
}

export interface Summary {
  month: string;
  total: string;
  budget: string;
  remaining: string;
  count: number;
  byCategory: { categoryId: number; name: string; color: string; budget: string; total: string; count: number }[];
  byDay: { day: string; total: string }[];
}

export interface ExpenseInput {
  title: string;
  amount: number | string;
  categoryId: number;
  spentOn: string;
  note?: string;
}

export interface CategoryInput {
  name?: string;
  color?: string;
  monthlyBudget?: number | string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error || `Request failed (${res.status})`, body.details);
  return body as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
};

export const api = {
  listCategories: () => request<Category[]>("/api/categories"),
  createCategory: (data: CategoryInput) =>
    request<Category>("/api/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: CategoryInput) =>
    request<Category>(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request<void>(`/api/categories/${id}`, { method: "DELETE" }),

  listExpenses: (filters: { month?: string; categoryId?: number; q?: string }) =>
    request<Expense[]>(`/api/expenses${qs(filters)}`),
  createExpense: (data: ExpenseInput) =>
    request<Expense>("/api/expenses", { method: "POST", body: JSON.stringify(data) }),
  updateExpense: (id: number, data: Partial<ExpenseInput>) =>
    request<Expense>(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExpense: (id: number) => request<void>(`/api/expenses/${id}`, { method: "DELETE" }),

  summary: (month: string) => request<Summary>(`/api/summary${qs({ month })}`),
};
