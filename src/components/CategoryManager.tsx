import { useState, type FormEvent } from "react";
import { ApiError, type Category, type CategoryInput } from "../api";
import { money } from "../format";

interface Props {
  categories: Category[];
  onCreate: (data: CategoryInput) => Promise<void>;
  onUpdate: (id: number, data: CategoryInput) => Promise<void>;
  onDelete: (c: Category) => Promise<void>;
}

export function CategoryManager({ categories, onCreate, onUpdate, onDelete }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3a7d5c");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBudget, setEditBudget] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await onCreate({ name, color, monthlyBudget: budget || 0 });
      setName("");
      setBudget("");
    } catch (err) {
      setError(err instanceof ApiError ? Object.values(err.details ?? {})[0] ?? err.message : "Could not add category");
    }
  }

  async function saveBudget(c: Category) {
    setError("");
    try {
      await onUpdate(c.id, { monthlyBudget: editBudget || 0 });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    }
  }

  return (
    <section className="card">
      <h2 className="card__title">Categories & budgets</h2>
      <ul className="cats">
        {categories.map((c) => (
          <li key={c.id} className="cats__row">
            <input
              type="color"
              value={c.color}
              onChange={(e) => onUpdate(c.id, { color: e.target.value }).catch(() => {})}
              aria-label={`Color for ${c.name}`}
              className="cats__color"
            />
            <span className="cats__name">{c.name}</span>
            {editingId === c.id ? (
              <span className="cats__edit">
                <input type="number" min="0" step="100" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className="mono" aria-label="Monthly budget" autoFocus />
                <button className="icon-btn" onClick={() => saveBudget(c)}>Save</button>
              </span>
            ) : (
              <button className="cats__budget mono" onClick={() => { setEditingId(c.id); setEditBudget(String(Number(c.monthlyBudget))); }} title="Click to edit budget">
                {money(c.monthlyBudget)}
              </button>
            )}
            <button
              className="icon-btn icon-btn--danger"
              onClick={() => onDelete(c).catch((err) => setError(err instanceof Error ? err.message : "Could not delete"))}
              aria-label={`Delete ${c.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="cats__add" onSubmit={add}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="New category color" className="cats__color" />
        <input placeholder="New category" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <input placeholder="Budget" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="mono cats__budget-in" />
        <button className="btn btn--small">Add</button>
      </form>
      {error && <p className="err">{error}</p>}
    </section>
  );
}
