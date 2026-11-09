import type { Config } from "@netlify/functions";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, expenses } from "../../db/schema.js";
import { currentMonth, handle, json, methodNotAllowed, monthRange } from "../lib/http.js";

/** GET /api/summary?month=YYYY-MM — totals for a month, per category and per day. */
export default handle(async (req) => {
  if (req.method !== "GET") throw methodNotAllowed();
  const month = new URL(req.url).searchParams.get("month") || currentMonth();
  const { start, end } = monthRange(month);
  const inMonth = and(gte(expenses.spentOn, start), lt(expenses.spentOn, end));

  // LEFT JOIN so categories with no spending still appear (with total 0) next to their budget.
  const byCategory = await db
    .select({
      categoryId: categories.id,
      name: categories.name,
      color: categories.color,
      budget: sql<string>`${categories.monthlyBudget}`,
      total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      count: sql<number>`count(${expenses.id})::int`,
    })
    .from(categories)
    .leftJoin(expenses, and(eq(expenses.categoryId, categories.id), inMonth))
    .groupBy(categories.id)
    .orderBy(sql`coalesce(sum(${expenses.amount}), 0) desc`, asc(categories.name));

  const byDay = await db
    .select({
      day: expenses.spentOn,
      total: sql<string>`sum(${expenses.amount})`,
    })
    .from(expenses)
    .where(inMonth)
    .groupBy(expenses.spentOn)
    .orderBy(asc(expenses.spentOn));

  const total = byCategory.reduce((s, c) => s + Number(c.total), 0);
  const budget = byCategory.reduce((s, c) => s + Number(c.budget), 0);
  const count = byCategory.reduce((s, c) => s + c.count, 0);

  return json({
    month,
    total: total.toFixed(2),
    budget: budget.toFixed(2),
    remaining: (budget - total).toFixed(2),
    count,
    byCategory: byCategory.map((c) => ({ ...c, total: Number(c.total).toFixed(2), budget: Number(c.budget).toFixed(2) })),
    byDay: byDay.map((d) => ({ day: d.day, total: Number(d.total).toFixed(2) })),
  });
});

export const config: Config = {
  path: "/api/summary",
};
