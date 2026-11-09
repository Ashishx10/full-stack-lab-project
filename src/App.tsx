import { useCallback, useEffect, useState } from "react";
import { api, type Category, type Expense, type ExpenseInput, type Summary } from "./api";
import { CategoryManager } from "./components/CategoryManager";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { CategoryBreakdown, DailyChart, StatTiles } from "./components/Summary";
import { monthLabel, shiftMonth, thisMonth } from "./format";

export default function App() {
  const [month, setMonth] = useState(thisMonth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const loadCategories = useCallback(() => api.listCategories().then(setCategories), []);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api.listExpenses({ month, q: debounced || undefined, categoryId: categoryFilter || undefined }),
        api.summary(month),
      ]);
      setExpenses(list);
      setSummary(sum);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data");
    } finally {
      setLoading(false);
    }
  }, [month, debounced, categoryFilter]);

  useEffect(() => {
    loadCategories().catch((e) => setError(e.message));
  }, [loadCategories]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  async function saveExpense(data: ExpenseInput) {
    if (editing) {
      await api.updateExpense(editing.id, data);
      setEditing(null);
      flash("Expense updated");
    } else {
      await api.createExpense(data);
      flash("Expense added");
    }
    // Jump to the month of the saved expense so the user sees it.
    const m = data.spentOn.slice(0, 7);
    if (m !== month) setMonth(m);
    else await loadMonth();
  }

  async function removeExpense(e: Expense) {
    if (!confirm(`Delete “${e.title}”?`)) return;
    await api.deleteExpense(e.id);
    if (editing?.id === e.id) setEditing(null);
    flash("Expense deleted");
    await loadMonth();
  }

  const refreshAll = async () => {
    await loadCategories();
    await loadMonth();
  };

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <span className="brand__mark">₹</span>
          <div>
            <h1>Ledgerly</h1>
            <p className="muted small">Personal expense tracker</p>
          </div>
        </div>
        <nav className="month" aria-label="Choose month">
          <button className="icon-btn" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">←</button>
          <span className="month__label">{monthLabel(month)}</span>
          <button className="icon-btn" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Next month">→</button>
          {month !== thisMonth() && (
            <button className="btn btn--small btn--ghost" onClick={() => setMonth(thisMonth())}>Today</button>
          )}
        </nav>
      </header>

      {error && <div className="banner">⚠ {error}</div>}

      <StatTiles summary={summary} />

      <main className="grid">
        <div className="col">
          <ExpenseForm categories={categories} editing={editing} onSubmit={saveExpense} onCancel={() => setEditing(null)} />
          <CategoryBreakdown summary={summary} />
          <CategoryManager
            categories={categories}
            onCreate={async (d) => { await api.createCategory(d); flash("Category added"); await refreshAll(); }}
            onUpdate={async (id, d) => { await api.updateCategory(id, d); await refreshAll(); }}
            onDelete={async (c) => {
              if (!confirm(`Delete category “${c.name}”?`)) return;
              await api.deleteCategory(c.id);
              if (categoryFilter === c.id) setCategoryFilter("");
              flash("Category deleted");
              await refreshAll();
            }}
          />
        </div>
        <div className="col">
          <DailyChart summary={summary} />
          <ExpenseList
            expenses={expenses}
            categories={categories}
            loading={loading}
            search={search}
            categoryFilter={categoryFilter}
            onSearch={setSearch}
            onCategoryFilter={setCategoryFilter}
            onEdit={(e) => { setEditing(e); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            onDelete={(e) => removeExpense(e).catch((err) => setError(err.message))}
          />
        </div>
      </main>

      <footer className="foot muted small">
        React · Netlify Functions · Netlify Database (Postgres) · Drizzle ORM
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
