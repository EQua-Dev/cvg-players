"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type MyRating } from "@/lib/api";
import { TopBar } from "@/components/ui";

function daysLeft(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return d <= 1 ? "Closes today" : `${d} days left`;
}

export default function RatePage() {
  const [data, setData] = useState<MyRating | null | undefined>(undefined);

  useEffect(() => {
    api<MyRating | undefined>("/ratings/me").then((d) => setData(d ?? null)).catch(() => setData(null));
  }, []);

  if (data === undefined) return <><TopBar back="/" /><div className="empty"><span className="spinner" /></div></>;
  if (data === null) {
    return (
      <>
        <TopBar back="/" />
        <main className="page"><div className="empty">Ratings are closed. The coach opens a round from time to time.</div></main>
      </>
    );
  }
  const next = data.players.find((p) => !p.done);

  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h1">Rate the squad</h1>
          <span className="muted small">{data.window.title} · {daysLeft(data.window.closesAt)} · secret</span>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="mono small">{data.done} of {data.total} rated</span>
          <div className="progress-bar"><span style={{ display: "block", height: "100%", width: `${(data.done / data.total) * 100}%`, background: "var(--orange)" }} /></div>
        </div>
        {next ? (
          <Link href={`/rate/${next.memberId}`} className="btn btn-primary btn-block">{data.done === 0 ? "Start" : "Carry on"} · {next.isMe ? "you" : next.name}</Link>
        ) : (
          <div className="card" style={{ textAlign: "center" }}>All done ✓ Cards come out when the round closes.</div>
        )}
        <div className="list">
          {data.players.map((p) => (
            <Link key={p.memberId} href={`/rate/${p.memberId}`} className="list-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="face-pic" style={{ width: 40, height: 40, fontSize: 14 }}>{p.photoUrl ? <img src={p.photoUrl} alt="" /> : p.jerseyNumber ?? ""}</span>
              <span className="grow">{p.isMe ? "You" : p.name}<span className="muted small"> · {p.position ?? ""}</span></span>
              <span className="mono small" style={{ color: p.done ? "#46c08a" : "var(--muted)" }}>{p.done ? "✓" : `${p.answered}/${p.total}`}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
