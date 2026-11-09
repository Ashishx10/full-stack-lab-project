import type { Config } from "@netlify/functions";
import { asc, count, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, expenses } from "../../db/schema.js";
import { handle, HttpError, json, methodNotAllowed, noContent, readJson } from "../lib/http.js";
import { parseCategory } from "../lib/validate.js";

// Postgres error code 23505 = unique_violation (Drizzle wraps the driver error in `cause`).
const isUniqueViolation = (e: unknown) => {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
};

export default handle(async (req, id) => {
  // Collection routes: /api/categories
  if (id === null) {
    if (req.method === "GET") {
      return json(await db.select().from(categories).orderBy(asc(categories.name)));
    }
    if (req.method === "POST") {
      const data = parseCategory(await readJson(req));
      try {
        const [row] = await db.insert(categories).values(data as { name: string }).returning();
        return json(row, 201);
      } catch (e) {
        if (isUniqueViolation(e)) throw new HttpError(409, "A category with this name already exists");
        throw e;
      }
    }
    throw methodNotAllowed();
  }

  // Item routes: /api/categories/:id
  if (req.method === "GET") {
    const [row] = await db.select().from(categories).where(eq(categories.id, id));
    if (!row) throw new HttpError(404, "Category not found");
    return json(row);
  }
  if (req.method === "PUT" || req.method === "PATCH") {
    const data = parseCategory(await readJson(req), true);
    if (!Object.keys(data).length) throw new HttpError(400, "No fields to update");
    try {
      const [row] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
      if (!row) throw new HttpError(404, "Category not found");
      return json(row);
    } catch (e) {
      if (isUniqueViolation(e)) throw new HttpError(409, "A category with this name already exists");
      throw e;
    }
  }
  if (req.method === "DELETE") {
    const [{ n }] = await db.select({ n: count() }).from(expenses).where(eq(expenses.categoryId, id));
    if (n > 0) throw new HttpError(409, `Category has ${n} expense(s); move or delete them first`);
    const [row] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!row) throw new HttpError(404, "Category not found");
    return noContent();
  }
  throw methodNotAllowed();
});

export const config: Config = {
  path: ["/api/categories", "/api/categories/:id"],
};
