import { HttpError } from "./http.js";

type Errors = Record<string, string>;

const isDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

const toAmount = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};

/** Validates an expense payload. With `partial`, only provided fields are checked (for PUT/PATCH). */
export function parseExpense(body: Record<string, unknown>, partial = false) {
  const errors: Errors = {};
  const out: { title?: string; amount?: string; categoryId?: number; spentOn?: string; note?: string } = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) errors.title = "Title is required";
    else if (body.title.trim().length > 120) errors.title = "Title must be 120 characters or less";
    else out.title = body.title.trim();
  }
  if (!partial || body.amount !== undefined) {
    const a = toAmount(body.amount);
    if (a === null || a <= 0) errors.amount = "Amount must be a positive number";
    else if (a > 9_999_999_999) errors.amount = "Amount is too large";
    else out.amount = a.toFixed(2);
  }
  if (!partial || body.categoryId !== undefined) {
    const c = Number(body.categoryId);
    if (!Number.isInteger(c) || c <= 0) errors.categoryId = "A valid category is required";
    else out.categoryId = c;
  }
  if (!partial || body.spentOn !== undefined) {
    if (!isDate(body.spentOn)) errors.spentOn = "Date must be in YYYY-MM-DD format";
    else out.spentOn = body.spentOn;
  }
  if (body.note !== undefined) {
    if (typeof body.note !== "string") errors.note = "Note must be text";
    else if (body.note.length > 500) errors.note = "Note must be 500 characters or less";
    else out.note = body.note.trim();
  }

  if (Object.keys(errors).length) throw new HttpError(422, "Validation failed", errors);
  return out;
}

/** Validates a category payload. */
export function parseCategory(body: Record<string, unknown>, partial = false) {
  const errors: Errors = {};
  const out: { name?: string; color?: string; monthlyBudget?: string } = {};

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) errors.name = "Name is required";
    else if (body.name.trim().length > 40) errors.name = "Name must be 40 characters or less";
    else out.name = body.name.trim();
  }
  if (body.color !== undefined) {
    if (typeof body.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.color))
      errors.color = "Color must be a hex value like #1a2b3c";
    else out.color = body.color.toLowerCase();
  }
  if (body.monthlyBudget !== undefined) {
    const b = toAmount(body.monthlyBudget);
    if (b === null || b < 0) errors.monthlyBudget = "Budget must be zero or a positive number";
    else out.monthlyBudget = b.toFixed(2);
  }

  if (Object.keys(errors).length) throw new HttpError(422, "Validation failed", errors);
  return out;
}
