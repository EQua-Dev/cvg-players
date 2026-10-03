"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type MatchView, type MyCards, type MyDues, type MyRating, type MyStyle, type Profile, type ProfilingResult, type Session } from "@/lib/api";
import { clock, firstName, greeting, jersey, naira, sessionDay, STATUS_LABEL, weekdayLong } from "@/lib/format";
import { Rsvp } from "@/components/Rsvp";
import { useSession } from "@/components/Session";
import { TopBar } from "@/components/ui";

interface Todo {
  href: string;
  title: string;
  hint: string;
}

export default function HomePage() {
  const { me } = useSession();
  const m = me.member;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [style, setStyle] = useState<ProfilingResult | null | undefined>(undefined);
  const [dues, setDues] = useState<MyDues | null>(null);
  const [next, setNext] = useState<Session | null>(null);
  const [match, setMatch] = useState<MatchView | null>(null);
  const [played, setPlayed] = useState<MatchView[]>([]);
  const [rating, setRating] = useState<MyRating | null>(null);
  const [myCard, setMyCard] = useState<MyCards | null>(null);
  const [myStyle, setMyStyle] = useState<MyStyle | null>(null);

  useEffect(() => {
    api<Profile>("/me/profile").then(setProfile).catch(() => {});
    api<{ result: ProfilingResult } | undefined>("/me/profiling")
      .then((r) => setStyle(r?.result ?? null))
      .catch(() => setStyle(null));
    api<MyDues>("/me/dues").then(setDues).catch(() => {});
    api<Session[]>("/training/sessions")
      .then((l) => setNext(l.find((s) => s.status === "SCHEDULED") ?? null))
      .catch(() => {});
    api<MatchView[]>("/matches?when=upcoming")
      .then((l) => setMatch(l.find((x) => x.status === "SCHEDULED") ?? null))
      .catch(() => {});
    api<MyRating | undefined>("/ratings/me").then((r) => setRating(r ?? null)).catch(() => {});
    api<MyCards>("/cards/me").then(setMyCard).catch(() => {});
    api<MyStyle>("/styles/me").then(setMyStyle).catch(() => {});
    api<MatchView[]>("/matches?when=past")
      .then((l) => setPlayed(l.filter((x) => x.inSquad && ((x.potmOpen && !x.votedPotm) || !x.gaveOpinion)).slice(0, 3)))
      .catch(() => {});
  }, []);

  // The home screen is a to-do list: only what needs this member now.
  const todos: Todo[] = [];
  for (const p of played) {
    if (p.potmOpen && !p.votedPotm) todos.push({ href: `/matches/${p.id}`, title: "Vote Player of the Match", hint: `vs ${p.opponent} · ${p.ourScore}–${p.theirScore}` });
    else if (!p.gaveOpinion) todos.push({ href: `/matches/${p.id}`, title: "Your view on the match", hint: `vs ${p.opponent} · 3 taps` });
  }
  if (rating && rating.done < rating.total) {
    todos.push({ href: "/rate", title: "Rate your squad", hint: `${rating.total - rating.done} of ${rating.total} left · secret` });
  }
  if (dues && dues.owedKobo > 0) {
    const overdue = dues.open.some((d) => d.overdue);
    todos.push({ href: "/dues", title: `Pay ${naira(dues.owedKobo)}`, hint: overdue ? "Overdue" : dues.open.filter((d) => d.state !== "PAID").map((d) => d.title).join(" · ") });
  }
  if (profile && !profile.complete) {
    todos.push({ href: "/setup", title: profile.photoUrl ? "Finish your profile" : "Add your photo", hint: `${profile.missing.length} thing${profile.missing.length > 1 ? "s" : ""} left` });
  }
  if (profile && style === null) {
    todos.push({ href: "/profiling", title: "How do you play?", hint: "14 quick taps" });
  }
  if (style && myStyle?.questionnaireDue) {
    todos.push({ href: "/profiling", title: "New season: how do you play?", hint: "14 quick taps" });
  }
  if (me.usesDefaultPasscode) {
    todos.push({ href: "/passcode", title: "Set your passcode", hint: "Takes 10 seconds" });
  }

  return (
    <>
      <TopBar />
      <main className="page">
        <h1 className="h2" style={{ fontSize: 28, marginTop: 8 }}>
          {greeting()}, {firstName(m)}.
        </h1>

        {next && (
          <div className="card stack" style={{ gap: 12 }}>
            <div>
              <div className="mono" style={{ fontWeight: 600, color: "var(--orange)" }}>
                {weekdayLong(next.date)} · {new Date(next.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase()} · {clock(next.time)}
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>{[next.focus, next.venue].filter(Boolean).join(" · ")} · {next.inCount} in</div>
            </div>
            <Rsvp session={next} onChange={setNext} big />
          </div>
        )}

        {match && (
          <div className="card stack" style={{ gap: 12, borderLeft: "3px solid var(--orange)" }}>
            <Link href={`/matches/${match.id}`} className="stack" style={{ gap: 4 }}>
              <span className="label">Next match</span>
              <strong style={{ fontSize: 20 }}>vs {match.opponent}</strong>
              <span className="mono small" style={{ color: "var(--orange)", fontWeight: 600 }}>{sessionDay(match.date)} · {clock(match.time)} · <span className="muted">{match.venue}</span></span>
            </Link>
            {match.myLineup && <span className="lineup-me">{match.myLineup === "STARTING" ? "⚡ You're starting" : "You're on the bench"}</span>}
            <Rsvp session={match} onChange={setMatch} path={`/matches/${match.id}/availability`} />
          </div>
        )}

        {/* Member pass: who you are at a glance. Tap for the full ID card. */}
        <Link href="/card" className="card" style={{ borderLeft: "3px solid var(--orange)", display: "block" }}>
          <div className="spread">
            <div className="row" style={{ gap: 14 }}>
              {profile?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="avatar avatar-sm" src={profile.photoUrl} alt="" />
              ) : null}
              <div className="stack" style={{ gap: 4 }}>
                <span className="label">CVG FC · Member</span>
                <span className="h2">{m.fullName}</span>
                <span className="mono muted">{m.code}</span>
              </div>
            </div>
            <span className="stat" style={{ fontSize: 40, color: "var(--orange)" }}>{jersey(m.jerseyNumber)}</span>
          </div>
          <div className="spread" style={{ marginTop: 12 }}>
            <span className={`status status-${m.status}`}>● {STATUS_LABEL[m.status]}</span>
            <span className="muted small">ID card →</span>
          </div>
        </Link>

        {myCard?.latest && (
          <Link href="/cards" className="card card-link">
            <span className="stack" style={{ gap: 4 }}>
              <span className="label">Your FUT card</span>
              <strong>{myCard.latest.published ? `${myCard.latest.ovr} ${myCard.latest.position ?? ""}` : "Not enough ratings yet"}</strong>
            </span>
            <span aria-hidden>→</span>
          </Link>
        )}

        {style && (
          <Link href="/style" className="card card-link">
            <span className="stack" style={{ gap: 4 }}>
              <span className="label">Your style</span>
              <strong>{myStyle?.style.label ?? style.label}</strong>
            </span>
            <span aria-hidden>→</span>
          </Link>
        )}

        <span className="label" style={{ marginTop: 8 }}>For you</span>
        {!profile ? (
          <div className="empty"><span className="spinner" /></div>
        ) : todos.length === 0 ? (
          <div className="card muted">You&apos;re all caught up ✓</div>
        ) : (
          todos.map((t) => (
            <Link key={t.href} href={t.href} className="card card-link card-accent">
              <span>
                <strong>{t.title}</strong>
                <br />
                <span className="muted small">{t.hint}</span>
              </span>
              <span aria-hidden>→</span>
            </Link>
          ))
        )}

      </main>
    </>
  );
}
