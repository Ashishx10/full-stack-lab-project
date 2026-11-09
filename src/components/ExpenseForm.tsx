import { useEffect, useState, type FormEvent } from "react";
import { ApiError, type Category, type Expense, type ExpenseInput } from "../api";
import { today } from "../format";

interface Props {
  categories: Category[];
  editing: Expense | null;
  onSubmit: (data: ExpenseInput) => Promise<void>;
  onCancel: () => void;
}

const empty = (categories: Category[]) => ({
  title: "",
  amount: "",
  categoryId: categories[0]?.id ?? 0,
  spentOn: today(),
  note: "",
});

export function ExpenseForm({ categories, editing, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState(() => empty(categories));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setErrors({});
    if (editing) {
      setForm({ title: editing.title, amount: editing.amount, categoryId: editing.categoryId, spentOn: editing.spentOn, note: editing.note });
    } else {
      setForm(empty(categories));
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick a default category once categories load.
  useEffect(() => {
    if (!form.categoryId && categories[0]) setForm((f) => ({ ...f, categoryId: categories[0].id }));
  }, [categories, form.categoryId]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: k === "categoryId" ? Number(e.target.value) : e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await onSubmit({ ...form, amount: form.amount });
      if (!editing) setForm((f) => ({ ...empty(categories), categoryId: f.categoryId, spentOn: f.spentOn }));
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit} noValidate>
      <h2 className="card__title">{editing ? "Edit expense" : "Add expense"}</h2>
      <label className="field">
        <span>Title</span>
        <input value={form.title} onChange={set("title")} placeholder="e.g. Lunch at canteen" maxLength={120} />
        {errors.title && <em className="err">{errors.title}</em>}
      </label>
      <div className="row">
        <label className="field">
          <span>Amount (₹)</span>
          <input type="number" inputMode="decimal" step="0.01" min="0" value={form.amount} onChange={set("amount")} placeholder="0.00" className="mono" />
          {errors.amount && <em className="err">{errors.amount}</em>}
        </label>
        <label className="field">
          <span>Date</span>
          <input type="date" value={form.spentOn} onChange={set("spentOn")} />
          {errors.spentOn && <em className="err">{errors.spentOn}</em>}
        </label>
      </div>
      <label className="field">
        <span>Category</span>
        <select value={form.categoryId} onChange={set("categoryId")}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.categoryId && <em className="err">{errors.categoryId}</em>}
      </label>
      <label className="field">
        <span>Note <small className="muted">(optional)</small></span>
        <textarea rows={2} value={form.note} onChange={set("note")} maxLength={500} />
        {errors.note && <em className="err">{errors.note}</em>}
      </label>
      {errors.form && <p className="err">{errors.form}</p>}
      <div className="actions">
        {editing && <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn--primary" disabled={busy || categories.length === 0}>
          {busy ? "Saving…" : editing ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}
