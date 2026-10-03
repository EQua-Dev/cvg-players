"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type MyDues, type Profile, type ProfilingResult, type Session } from "@/lib/api";
import { clock, firstName, greeting, jersey, naira, STATUS_LABEL, weekdayLong } from "@/lib/format";
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

  useEffect(() => {
    api<Profile>("/me/profile").then(setProfile).catch(() => {});
    api<{ result: ProfilingResult } | undefined>("/me/profiling")
      .then((r) => setStyle(r?.result ?? null))
      .catch(() => setStyle(null));
    api<MyDues>("/me/dues").then(setDues).catch(() => {});
    api<Session[]>("/training/sessions")
      .then((l) => setNext(l.find((s) => s.status === "SCHEDULED") ?? null))
      .catch(() => {});
  }, []);

  // The home screen is a to-do list: only what needs this member now.
  const todos: Todo[] = [];
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

        {style && (
          <Link href="/profiling" className="card card-link">
            <span className="stack" style={{ gap: 4 }}>
              <span className="label">Your style</span>
              <strong>{style.label}</strong>
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

        <div className="card stack" style={{ gap: 6, borderStyle: "dashed" }}>
          <span className="label">Coming soon</span>
          <span className="muted small">Matches · Votes · FUT cards</span>
        </div>
      </main>
    </>
  );
}
