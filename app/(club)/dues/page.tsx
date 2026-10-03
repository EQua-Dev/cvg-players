"use client";

import { useEffect, useState } from "react";
import { api, type MyDues } from "@/lib/api";
import { dayMonth, naira } from "@/lib/format";
import { TopBar } from "@/components/ui";

const STATE_LABEL = { PAID: "Paid", PARTIAL: "Part paid", UNPAID: "To pay" } as const;
const METHOD = { CASH: "Cash", TRANSFER: "Transfer", POS: "POS" } as const;

export default function DuesPage() {
  const [dues, setDues] = useState<MyDues | null>(null);

  useEffect(() => {
    api<MyDues>("/me/dues").then(setDues);
  }, []);

  if (!dues) return <><TopBar /><div className="empty"><span className="spinner" /></div></>;

  return (
    <>
      <TopBar />
      <main className="page">
        <h1 className="h1">My dues</h1>

        <div className="card stack" style={{ gap: 8, borderLeft: `3px solid ${dues.owedKobo > 0 ? "var(--orange)" : "#46c08a"}` }}>
          {dues.owedKobo > 0 ? (
            <>
              <span className="label">You owe</span>
              <span className="big-number" style={{ color: "var(--orange)" }}>{naira(dues.owedKobo)}</span>
              <span className="muted small">Pay the treasurer. It shows here once recorded.</span>
            </>
          ) : (
            <>
              <span className="label">All paid</span>
              <span className="big-number" style={{ color: "#46c08a" }}>✓</span>
              <span className="muted small">Nothing to pay right now.</span>
            </>
          )}
        </div>

        {dues.open.length > 0 && (
          <>
            <span className="label">Open</span>
            {dues.open.map((d) => (
              <div key={d.collectionId} className="card stack" style={{ gap: 10 }}>
                <div className="spread">
                  <strong>{d.title}</strong>
                  <span className={`pill pill-${d.state}`}>{d.overdue ? "Overdue" : STATE_LABEL[d.state]}</span>
                </div>
                <div className="progress-bar"><span style={{ width: `${Math.min(100, Math.round((d.paidKobo / d.amountKobo) * 100))}%` }} /></div>
                <div className="spread small">
                  <span className="muted">Due {dayMonth(d.dueDate)}</span>
                  <span className="mono">
                    {d.state === "PAID" ? naira(d.paidKobo) : `${naira(d.paidKobo)} / ${naira(d.amountKobo)}`}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        <span className="label" style={{ marginTop: 8 }}>My payments</span>
        {dues.history.length === 0 ? (
          <div className="card muted">No payments yet.</div>
        ) : (
          <div className="list">
            {dues.history.map((p) => (
              <div key={p.id} className="list-row">
                <span className={`grow ${p.reversed ? "struck" : ""}`}>
                  <span style={{ display: "block", fontWeight: 600 }}>{p.reversesId ? "Correction" : p.collection?.name ?? p.categoryLabel}</span>
                  <span className="muted small">{dayMonth(p.occurredOn)} · {METHOD[p.method]}</span>
                </span>
                <span className={`mono ${p.direction === "IN" ? "money-in" : "money-out"} ${p.reversed ? "struck" : ""}`} style={{ fontWeight: 600 }}>
                  {p.direction === "IN" ? "+" : "−"}{naira(p.amountKobo)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
