"use client";

import Link from "next/link";
import { firstName, greeting, jersey, STATUS_LABEL } from "@/lib/format";
import { useSession } from "@/components/Session";
import { TopBar } from "@/components/ui";

export default function HomePage() {
  const { me } = useSession();
  const m = me.member;

  return (
    <>
      <TopBar />
      <main className="page">
        <h1 className="h2" style={{ fontSize: 28, marginTop: 8 }}>
          {greeting()}, {firstName(m)}.
        </h1>

        {/* Member pass: who you are at a glance */}
        <div className="card" style={{ borderLeft: "3px solid var(--orange)" }}>
          <div className="spread">
            <div className="stack" style={{ gap: 4 }}>
              <span className="label">CVG FC · Member</span>
              <span className="h2">{m.fullName}</span>
              <span className="mono muted">{m.code}</span>
            </div>
            <span className="stat" style={{ fontSize: 40, color: "var(--orange)" }}>{jersey(m.jerseyNumber)}</span>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className={`status status-${m.status}`}>● {STATUS_LABEL[m.status]}</span>
          </div>
        </div>

        <span className="label" style={{ marginTop: 8 }}>For you</span>
        {me.usesDefaultPasscode ? (
          <Link href="/passcode" className="card card-link">
            <span>
              <strong>Set your passcode</strong>
              <br />
              <span className="muted small">Takes 10 seconds.</span>
            </span>
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <div className="card muted">You&apos;re all caught up ✓</div>
        )}

        <div className="card stack" style={{ gap: 6, borderStyle: "dashed" }}>
          <span className="label">Coming soon</span>
          <span className="muted small">Training · Matches · Dues · Votes · Your ID &amp; FUT cards</span>
        </div>
      </main>
    </>
  );
}
