"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type MatchRecord, type MatchView } from "@/lib/api";
import { clock, sessionDay } from "@/lib/format";
import { Rsvp } from "@/components/Rsvp";
import { TopBar } from "@/components/ui";

export default function MatchesPage() {
  const [upcoming, setUpcoming] = useState<MatchView[] | null>(null);
  const [past, setPast] = useState<MatchView[]>([]);
  const [record, setRecord] = useState<MatchRecord | null>(null);

  useEffect(() => {
    api<MatchView[]>("/matches?when=upcoming").then((l) => setUpcoming(l.filter((m) => m.status !== "CANCELLED")));
    api<MatchView[]>("/matches?when=past").then((l) => setPast(l.filter((m) => m.status === "PLAYED")));
    api<MatchRecord>("/matches/me/record").then(setRecord);
  }, []);

  const replace = (m: MatchView) => setUpcoming((list) => list?.map((x) => (x.id === m.id ? m : x)) ?? null);

  return (
    <>
      <TopBar />
      <main className="page">
        <h1 className="h1">Matches</h1>

        {record && record.played > 0 && (
          <div className="row">
            {[["Played", record.played], ["Goals", record.goals], ["Assists", record.assists], ["POTM", record.potm]].map(([l, v]) => (
              <div key={l} className="card grow" style={{ padding: 12 }}>
                <div className="stat" style={l === "POTM" && Number(v) > 0 ? { color: "var(--orange)" } : undefined}>{v}</div>
                <span className="label">{l}</span>
              </div>
            ))}
          </div>
        )}

        <span className="label">Coming up</span>
        {!upcoming ? (
          <div className="empty"><span className="spinner" /></div>
        ) : upcoming.length === 0 ? (
          <div className="card muted">No matches arranged yet.</div>
        ) : (
          upcoming.map((m) => (
            <div key={m.id} className="card stack" style={{ gap: 10 }}>
              <Link href={`/matches/${m.id}`} className="stack" style={{ gap: 4 }}>
                <div className="spread">
                  <strong style={{ fontSize: 18 }}>vs {m.opponent}</strong>
                  <span className="muted">→</span>
                </div>
                <span className="mono small" style={{ color: "var(--orange)", fontWeight: 600 }}>{sessionDay(m.date)} · {clock(m.time)}</span>
                <span className="muted small">{m.venue}{m.meetTime ? ` · meet ${clock(m.meetTime)}` : ""}</span>
              </Link>
              {m.myLineup && <span className="lineup-me">{m.myLineup === "STARTING" ? "⚡ You're starting" : "You're on the bench"}</span>}
              {m.status === "SCHEDULED" && <Rsvp session={m} onChange={replace} path={`/matches/${m.id}/availability`} />}
            </div>
          ))
        )}

        {past.length > 0 && (
          <>
            <span className="label" style={{ marginTop: 8 }}>Results</span>
            <div className="list">
              {past.map((m) => (
                <Link key={m.id} href={`/matches/${m.id}`} className="list-row">
                  <span className={`outcome outcome-${m.outcome}`}>{m.outcome}</span>
                  <span className="grow">
                    vs {m.opponent}
                    <br />
                    <span className="muted small mono">{sessionDay(m.date)}</span>
                  </span>
                  {m.potmOpen && m.inSquad && !m.votedPotm && <span className="pill" style={{ background: "var(--orange)", color: "var(--white)" }}>Vote</span>}
                  <span className="mono" style={{ fontWeight: 700, fontSize: 18 }}>{m.ourScore}–{m.theirScore}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
