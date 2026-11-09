import type { Summary } from "../api";
import { daysInMonth, money } from "../format";

export function StatTiles({ summary }: { summary: Summary | null }) {
  const total = Number(summary?.total ?? 0);
  const budget = Number(summary?.budget ?? 0);
  const remaining = budget - total;
  const used = budget > 0 ? Math.min(total / budget, 1) : 0;
  return (
    <section className="tiles" aria-label="Monthly totals">
      <div className="tile tile--main">
        <span className="tile__label">Spent this month</span>
        <span className="tile__value">{money(total)}</span>
        <div className="meter" role="meter" aria-valuenow={Math.round(used * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`meter__fill ${total > budget && budget > 0 ? "is-over" : ""}`} style={{ width: `${used * 100}%` }} />
        </div>
        <span className="tile__sub">{budget > 0 ? `${Math.round((total / budget) * 100)}% of ${money(budget)} budget` : "No budget set"}</span>
      </div>
      <div className="tile">
        <span className="tile__label">{remaining >= 0 ? "Remaining" : "Over budget"}</span>
        <span className={`tile__value ${remaining < 0 ? "is-neg" : ""}`}>{money(Math.abs(remaining))}</span>
      </div>
      <div className="tile">
        <span className="tile__label">Entries</span>
        <span className="tile__value">{summary?.count ?? 0}</span>
      </div>
    </section>
  );
}

export function CategoryBreakdown({ summary }: { summary: Summary | null }) {
  const rows = summary?.byCategory ?? [];
  return (
    <section className="card">
      <h2 className="card__title">By category</h2>
      {rows.length === 0 && <p className="muted">No categories yet.</p>}
      <ul className="breakdown">
        {rows.map((c) => {
          const total = Number(c.total);
          const budget = Number(c.budget);
          const pct = budget > 0 ? Math.min(total / budget, 1) * 100 : total > 0 ? 100 : 0;
          const over = budget > 0 && total > budget;
          return (
            <li key={c.categoryId} className="breakdown__row">
              <div className="breakdown__head">
                <span className="swatch" style={{ background: c.color }} />
                <span className="breakdown__name">{c.name}</span>
                <span className={`breakdown__amt ${over ? "is-neg" : ""}`}>
                  {money(total)}
                  {budget > 0 && <span className="muted"> / {money(budget)}</span>}
                </span>
              </div>
              <div className="bar">
                <div className="bar__fill" style={{ width: `${pct}%`, background: over ? "var(--danger)" : c.color }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DailyChart({ summary }: { summary: Summary | null }) {
  if (!summary) return null;
  const n = daysInMonth(summary.month);
  const totals = new Map(summary.byDay.map((d) => [Number(d.day.slice(8, 10)), Number(d.total)]));
  const max = Math.max(1, ...totals.values());
  const W = 620, H = 140, gap = 3;
  const bw = (W - gap * (n - 1)) / n;
  return (
    <section className="card">
      <h2 className="card__title">Daily spending</h2>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="chart" role="img" aria-label="Bar chart of spending per day">
        <line x1="0" x2={W} y1={H} y2={H} className="chart__axis" />
        {Array.from({ length: n }, (_, i) => {
          const day = i + 1;
          const v = totals.get(day) ?? 0;
          const h = v > 0 ? Math.max(2, (v / max) * (H - 8)) : 0;
          const x = i * (bw + gap);
          return (
            <g key={day}>
              <rect x={x} y={H - h} width={bw} height={h} rx="2" className="chart__bar">
                <title>{`Day ${day}: ${money(v)}`}</title>
              </rect>
              {(day === 1 || day % 5 === 0) && (
                <text x={x + bw / 2} y={H + 14} className="chart__tick" textAnchor="middle">{day}</text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="muted small">Highest day: {money(max === 1 && totals.size === 0 ? 0 : max)}</p>
    </section>
  );
}
