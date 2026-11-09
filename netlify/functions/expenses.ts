import type { Config } from "@netlify/functions";
import { and, desc, eq, gte, ilike, lt, or, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, expenses } from "../../db/schema.js";
import { handle, HttpError, json, methodNotAllowed, monthRange, noContent, readJson } from "../lib/http.js";
import { parseExpense } from "../lib/validate.js";

// Expense rows are returned joined with their category's name and color.
const expenseColumns = {
  id: expenses.id,
  title: expenses.title,
  amount: expenses.amount,
  categoryId: expenses.categoryId,
  categoryName: categories.name,
  categoryColor: categories.color,
  spentOn: expenses.spentOn,
  note: expenses.note,
  createdAt: expenses.createdAt,
};

const selectExpenses = () =>
  db.select(expenseColumns).from(expenses).innerJoin(categories, eq(expenses.categoryId, categories.id));

async function findOne(id: number) {
  const [row] = await selectExpenses().where(eq(expenses.id, id));
  if (!row) throw new HttpError(404, "Expense not found");
  return row;
}

async function assertCategoryExists(categoryId: number | undefined) {
  if (categoryId === undefined) return;
  const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
  if (!cat) throw new HttpError(422, "Validation failed", { categoryId: "Category does not exist" });
}

export default handle(async (req, id) => {
  // Collection routes: /api/expenses
  if (id === null) {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const filters: SQL[] = [];

      const month = url.searchParams.get("month");
      if (month) {
        const { start, end } = monthRange(month);
        filters.push(gte(expenses.spentOn, start), lt(expenses.spentOn, end));
      }
      const category = url.searchParams.get("categoryId");
      if (category) {
        const c = Number(category);
        if (!Number.isInteger(c) || c <= 0) throw new HttpError(400, "categoryId must be a positive integer");
        filters.push(eq(expenses.categoryId, c));
      }
      const q = url.searchParams.get("q")?.trim();
      if (q) {
        const pattern = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
        filters.push(or(ilike(expenses.title, pattern), ilike(expenses.note, pattern))!);
      }
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 200, 1), 500);

      const rows = await selectExpenses()
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(expenses.spentOn), desc(expenses.id))
        .limit(limit);
      return json(rows);
    }
    if (req.method === "POST") {
      const data = parseExpense(await readJson(req));
      await assertCategoryExists(data.categoryId);
      const [row] = await db
        .insert(expenses)
        .values(data as Required<Omit<typeof data, "note">> & { note?: string })
        .returning({ id: expenses.id });
      return json(await findOne(row.id), 201);
    }
    throw methodNotAllowed();
  }

  // Item routes: /api/expenses/:id
  if (req.method === "GET") return json(await findOne(id));
  if (req.method === "PUT" || req.method === "PATCH") {
    const data = parseExpense(await readJson(req), true);
    if (!Object.keys(data).length) throw new HttpError(400, "No fields to update");
    await assertCategoryExists(data.categoryId);
    const [row] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning({ id: expenses.id });
    if (!row) throw new HttpError(404, "Expense not found");
    return json(await findOne(id));
  }
  if (req.method === "DELETE") {
    const [row] = await db.delete(expenses).where(eq(expenses.id, id)).returning({ id: expenses.id });
    if (!row) throw new HttpError(404, "Expense not found");
    return noContent();
  }
  throw methodNotAllowed();
});

export const config: Config = {
  path: ["/api/expenses", "/api/expenses/:id"],
};
