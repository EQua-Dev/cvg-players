"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type MyStyle } from "@/lib/api";
import { TopBar } from "@/components/ui";

/** My football profile: how well I suit each game plan, and my role as I see it and as the squad sees it. */
export default function StylePage() {
  const [data, setData] = useState<MyStyle | null>(null);

  useEffect(() => {
    api<MyStyle>("/styles/me").then(setData);
  }, []);

  if (!data) return <><TopBar back="/" /><div className="empty"><span className="spinner" /></div></>;
  const s = data.style;
  const sources = [s.planFits.some((f) => f.self != null) && "your answers", s.planFits.some((f) => f.ratings != null) && "squad ratings", s.planFits.some((f) => f.matches != null) && "results"].filter(Boolean);

  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <span className="label">Your style</span>
        <h1 className="h1" style={{ fontSize: 30 }}>{s.label ?? "Not known yet"}</h1>

        {data.questionnaireDue && (
          <Link href="/profiling" className="card card-link card-accent">
            <span><strong>{s.answeredQuestionnaire ? "New season: answer again" : "How do you play?"}</strong><br /><span className="muted small">14 quick taps</span></span>
            <span aria-hidden>→</span>
          </Link>
        )}

        {s.planFits.length > 0 && (
          <div className="card stack" style={{ gap: 10 }}>
            <span className="label">Game plans</span>
            {s.planFits.map((f) => (
              <div key={f.code} className="row" style={{ gap: 10 }}>
                <span style={{ width: 110 }}>{f.name}</span>
                <span className="progress-bar grow"><span style={{ display: "block", height: "100%", width: `${f.fit}%`, background: f.code === s.topPlan ? "var(--orange)" : "var(--teal)" }} /></span>
                <strong className="mono" style={{ width: 30, textAlign: "right" }}>{f.fit}</strong>
              </div>
            ))}
            <span className="muted small">From {sources.join(" + ")}.</span>
          </div>
        )}

        <div className="card stack" style={{ gap: 8 }}>
          <span className="label">Your role</span>
          <strong style={{ fontSize: 20 }}>{s.role?.name ?? "—"}</strong>
          <div className="spread small"><span className="muted">You said</span><span>{s.selfRole?.name ?? "—"}</span></div>
          <div className="spread small"><span className="muted">The squad says</span><span>{s.peerRoles?.length ? s.peerRoles[0].name : "—"}</span></div>
          {s.coachRole && <div className="spread small"><span className="muted">Coach&apos;s call</span><span>{s.coachRole.name}</span></div>}
          {s.disagree && !s.coachRole && <span className="small" style={{ color: "var(--caution)" }}>You and the squad see it differently. The coach will decide.</span>}
        </div>
        <Link href="/profiling" className="btn btn-quiet">See or redo my answers</Link>
      </main>
    </>
  );
}
