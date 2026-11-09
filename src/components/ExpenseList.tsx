import type { Category, Expense } from "../api";
import { dayLabel, money } from "../format";

interface Props {
  expenses: Expense[];
  categories: Category[];
  loading: boolean;
  search: string;
  categoryFilter: number | "";
  onSearch: (q: string) => void;
  onCategoryFilter: (id: number | "") => void;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}

export function ExpenseList(p: Props) {
  // Group rows by date so the list reads like a ledger.
  const groups = new Map<string, Expense[]>();
  for (const e of p.expenses) groups.set(e.spentOn, [...(groups.get(e.spentOn) ?? []), e]);

  return (
    <section className="card ledger">
      <div className="ledger__top">
        <h2 className="card__title">Transactions</h2>
        <div className="filters">
          <input type="search" placeholder="Search title or note…" value={p.search} onChange={(e) => p.onSearch(e.target.value)} aria-label="Search expenses" />
          <select value={p.categoryFilter} onChange={(e) => p.onCategoryFilter(e.target.value ? Number(e.target.value) : "")} aria-label="Filter by category">
            <option value="">All categories</option>
            {p.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {p.loading && p.expenses.length === 0 && <p className="muted">Loading…</p>}
      {!p.loading && p.expenses.length === 0 && (
        <div className="empty">
          <p>No expenses for this view.</p>
          <p className="muted small">Add one with the form to get started.</p>
        </div>
      )}

      {[...groups].map(([date, rows]) => (
        <div key={date} className="ledger__group">
          <div className="ledger__date">
            <span>{dayLabel(date)}</span>
            <span className="mono">{money(rows.reduce((s, r) => s + Number(r.amount), 0))}</span>
          </div>
          <ul>
            {rows.map((e) => (
              <li key={e.id} className="ledger__row">
                <span className="swatch" style={{ background: e.categoryColor }} title={e.categoryName} />
                <div className="ledger__main">
                  <span className="ledger__title">{e.title}</span>
                  <span className="muted small">{e.categoryName}{e.note ? ` · ${e.note}` : ""}</span>
                </div>
                <span className="ledger__amt mono">{money(e.amount)}</span>
                <div className="ledger__btns">
                  <button className="icon-btn" onClick={() => p.onEdit(e)} aria-label={`Edit ${e.title}`}>Edit</button>
                  <button className="icon-btn icon-btn--danger" onClick={() => p.onDelete(e)} aria-label={`Delete ${e.title}`}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
