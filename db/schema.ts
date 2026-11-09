import { pgTable, serial, text, timestamp, integer, numeric, date, index } from "drizzle-orm/pg-core";

/** Spending categories (Food, Transport, ...) with an optional monthly budget. */
export const categories = pgTable("categories", {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  color: text().notNull().default("#64748b"),
  monthlyBudget: numeric("monthly_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Individual expense entries. Each belongs to one category. */
export const expenses = pgTable(
  "expenses",
  {
    id: serial().primaryKey(),
    title: text().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    spentOn: date("spent_on").notNull(),
    note: text().notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("expenses_spent_on_idx").on(t.spentOn), index("expenses_category_id_idx").on(t.categoryId)]
);

export type Category = typeof categories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
