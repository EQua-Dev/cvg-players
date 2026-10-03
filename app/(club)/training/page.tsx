"use client";

import { useEffect, useState } from "react";
import { api, type MyAttendance, type Session } from "@/lib/api";
import { clock, dayMonth, sessionDay } from "@/lib/format";
import { Rsvp } from "@/components/Rsvp";
import { TopBar } from "@/components/ui";

const MARK_TEXT = { PRESENT: "Present", LATE: "Late", ABSENT: "Absent", EXCUSED: "Excused" } as const;

export default function TrainingPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [mine, setMine] = useState<MyAttendance | null>(null);

  useEffect(() => {
    api<Session[]>("/training/sessions").then((l) => setSessions(l.filter((s) => s.status !== "CLOSED")));
    api<MyAttendance>("/training/me").then(setMine);
  }, []);

  const replace = (s: Session) => setSessions((list) => list?.map((x) => (x.id === s.id ? s : x)) ?? null);
  const st = mine?.stats;

  return (
    <>
      <TopBar />
      <main className="page">
        <h1 className="h1">Training</h1>

        {st && (
          <div className="row">
            <div className="card grow" style={{ padding: 12 }}>
              <div className="stat">{st.percent == null ? "–" : `${st.percent}%`}</div>
              <span className="label">Attendance</span>
            </div>
            <div className="card grow" style={{ padding: 12 }}>
              <div className="stat" style={{ color: "#46c08a" }}>{st.streak}</div>
              <span className="label">Streak</span>
            </div>
            <div className="card grow" style={{ padding: 12 }}>
              <div className="stat">{st.attended}/{st.counted}</div>
              <span className="label">Sessions</span>
            </div>
          </div>
        )}

        <span className="label">Coming up</span>
        {!sessions ? (
          <div className="empty"><span className="spinner" /></div>
        ) : sessions.length === 0 ? (
          <div className="card muted">No sessions planned yet.</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="card stack" style={{ gap: 10, opacity: s.status === "CANCELLED" ? 0.5 : 1 }}>
              <div className="spread">
                <span className="mono" style={{ fontWeight: 600, color: "var(--orange)" }}>{sessionDay(s.date)} · {clock(s.time)}</span>
                <span className={`kind kind-${s.kind}`}>{s.kind === "COMPULSORY" ? "Compulsory" : "Optional"}</span>
              </div>
              <span className="muted small">{[s.focus, s.venue].filter(Boolean).join(" · ")}</span>
              {s.status === "CANCELLED" ? <span className="small">Cancelled</span> : <Rsvp session={s} onChange={replace} />}
            </div>
          ))
        )}

        {mine && mine.recent.length > 0 && (
          <>
            <span className="label" style={{ marginTop: 8 }}>My record</span>
            <div className="list">
              {mine.recent.map((r) => (
                <div key={r.sessionId} className="list-row">
                  <span className={`dot dot-${r.mark}`} />
                  <span className="mono muted small" style={{ width: 64 }}>{dayMonth(r.date)}</span>
                  <span className="grow">{r.focus ?? r.venue}{r.kind === "OPTIONAL" && <span className="muted small"> · optional</span>}</span>
                  <span className="small">{MARK_TEXT[r.mark]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
