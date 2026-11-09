# API Reference

The backend is a JSON REST API served from the same origin as the frontend under `/api`. Each resource is a separate Netlify Function.

- **Base URL (local):** `http://localhost:8889/api`
- **Base URL (deployed):** `https://<your-site>.netlify.app/api`
- **Content type:** send `Content-Type: application/json` with every request body. All responses are JSON, except `204 No Content`.
- **Money:** amounts are returned as **strings** with 2 decimal places (for example `"249.50"`) so no precision is lost. You can send them as numbers or strings.
- **Dates:** `spentOn` uses `YYYY-MM-DD`. Month filters use `YYYY-MM`.

## Error format

Every error response has the same shape:

```json
{ "error": "Validation failed", "details": { "amount": "Amount must be a positive number" } }
```

`details` only appears on validation errors and maps each field to its message.

| Status | Meaning |
| ------ | ------- |
| `200 OK` | Request succeeded |
| `201 Created` | Resource created; the new resource is in the body |
| `204 No Content` | Deleted successfully |
| `400 Bad Request` | Malformed JSON, bad id, or bad query parameter |
| `404 Not Found` | No resource with that id |
| `405 Method Not Allowed` | HTTP method not supported on this route |
| `409 Conflict` | Duplicate category name, or deleting a category that still has expenses |
| `422 Unprocessable Entity` | Validation failed (see `details`) |
| `500 Internal Server Error` | Unexpected server/database error |

## Endpoint summary

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/expenses` | List expenses (with filters) |
| POST | `/api/expenses` | Create an expense |
| GET | `/api/expenses/:id` | Get one expense |
| PUT / PATCH | `/api/expenses/:id` | Update an expense (partial updates allowed) |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create a category |
| GET | `/api/categories/:id` | Get one category |
| PUT / PATCH | `/api/categories/:id` | Update a category (partial updates allowed) |
| DELETE | `/api/categories/:id` | Delete a category (only if it has no expenses) |
| GET | `/api/summary` | Monthly totals by category and by day |

---

## Expenses

### Expense object

```json
{
  "id": 12,
  "title": "Lunch at canteen",
  "amount": "120.00",
  "categoryId": 1,
  "categoryName": "Food & Dining",
  "categoryColor": "#e76f51",
  "spentOn": "2026-11-09",
  "note": "with lab partners",
  "createdAt": "2026-11-09T07:41:12.512Z"
}
```

`categoryName` and `categoryColor` are read-only. They come from a join with the `categories` table.

### Validation rules

| Field | Type | Required | Rules |
| ----- | ---- | -------- | ----- |
| `title` | string | yes | 1–120 characters, trimmed |
| `amount` | number or string | yes | > 0, rounded to 2 decimals |
| `categoryId` | integer | yes | must refer to an existing category |
| `spentOn` | string | yes | `YYYY-MM-DD` |
| `note` | string | no | up to 500 characters (default `""`) |

### `GET /api/expenses`

Lists expenses, newest first (by `spentOn`, then `id`).

| Query parameter | Example | Description |
| --------------- | ------- | ----------- |
| `month` | `2026-11` | Only expenses in this calendar month |
| `categoryId` | `3` | Only expenses in this category |
| `q` | `coffee` | Case-insensitive search in title and note |
| `limit` | `50` | Maximum number of rows (1–500, default 200) |

```bash
curl "http://localhost:8889/api/expenses?month=2026-11&q=lunch"
```

**200 OK**

```json
[
  { "id": 12, "title": "Lunch at canteen", "amount": "120.00", "categoryId": 1, "categoryName": "Food & Dining", "categoryColor": "#e76f51", "spentOn": "2026-11-09", "note": "", "createdAt": "2026-11-09T07:41:12.512Z" }
]
```

### `POST /api/expenses`

```bash
curl -X POST http://localhost:8889/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Metro card recharge","amount":500,"categoryId":2,"spentOn":"2026-11-08","note":"monthly"}'
```

**201 Created**: returns the new expense object.

**422 Unprocessable Entity** (example)

```json
{
  "error": "Validation failed",
  "details": {
    "title": "Title is required",
    "amount": "Amount must be a positive number",
    "spentOn": "Date must be in YYYY-MM-DD format"
  }
}
```

### `GET /api/expenses/:id`

```bash
curl http://localhost:8889/api/expenses/12
```

**200 OK**: the expense object. **404**: `{ "error": "Expense not found" }`.

### `PUT /api/expenses/:id` (or `PATCH`)

Send only the fields you want to change.

```bash
curl -X PUT http://localhost:8889/api/expenses/12 \
  -H "Content-Type: application/json" \
  -d '{"amount":"135.50","note":"added dessert"}'
```

**200 OK**: the updated expense object. **400**: `{ "error": "No fields to update" }` if the body is empty.

### `DELETE /api/expenses/:id`

```bash
curl -X DELETE http://localhost:8889/api/expenses/12
```

**204 No Content** (empty body). **404** if it does not exist.

---

## Categories

### Category object

```json
{
  "id": 1,
  "name": "Food & Dining",
  "color": "#e76f51",
  "monthlyBudget": "6000.00",
  "createdAt": "2026-11-09T07:00:00.000Z"
}
```

### Validation rules

| Field | Type | Required | Rules |
| ----- | ---- | -------- | ----- |
| `name` | string | yes (on create) | 1–40 characters, must be unique |
| `color` | string | no | hex colour `#rrggbb` (default `#64748b`) |
| `monthlyBudget` | number or string | no | ≥ 0 (default `0` = no budget) |

### `GET /api/categories`

Returns all categories sorted by name.

```bash
curl http://localhost:8889/api/categories
```

### `POST /api/categories`

```bash
curl -X POST http://localhost:8889/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Travel","color":"#3a7d5c","monthlyBudget":5000}'
```

**201 Created**: the new category. **409**: `{ "error": "A category with this name already exists" }`.

### `GET /api/categories/:id`

**200 OK**: the category. **404**: `{ "error": "Category not found" }`.

### `PUT /api/categories/:id` (or `PATCH`)

```bash
curl -X PUT http://localhost:8889/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"monthlyBudget":7000}'
```

**200 OK**: the updated category.

### `DELETE /api/categories/:id`

```bash
curl -X DELETE http://localhost:8889/api/categories/9
```

**204 No Content** if deleted.
**409 Conflict** if expenses still use this category: `{ "error": "Category has 3 expense(s); move or delete them first" }`. The database foreign key (`ON DELETE RESTRICT`) enforces this too.

---

## Summary

### `GET /api/summary`

Aggregated statistics for one month. Defaults to the current month (UTC) when `month` is omitted.

| Query parameter | Example | Description |
| --------------- | ------- | ----------- |
| `month` | `2026-11` | Month to summarise (`YYYY-MM`) |

```bash
curl "http://localhost:8889/api/summary?month=2026-11"
```

**200 OK**

```json
{
  "month": "2026-11",
  "total": "3245.50",
  "budget": "21000.00",
  "remaining": "17754.50",
  "count": 14,
  "byCategory": [
    { "categoryId": 1, "name": "Food & Dining", "color": "#e76f51", "budget": "6000.00", "total": "1840.00", "count": 9 },
    { "categoryId": 2, "name": "Transport", "color": "#2a9d8f", "budget": "2000.00", "total": "500.00", "count": 1 },
    { "categoryId": 5, "name": "Entertainment", "color": "#9b5de5", "budget": "1500.00", "total": "0.00", "count": 0 }
  ],
  "byDay": [
    { "day": "2026-11-01", "total": "320.00" },
    { "day": "2026-11-08", "total": "500.00" }
  ]
}
```

- `byCategory` lists **every** category, including ones with no spending (total `0.00`), sorted by amount spent.
- `byDay` only lists days that have expenses.
- `remaining` is negative when total spending is over budget.

**400**: `{ "error": "month must be in YYYY-MM format" }`.
