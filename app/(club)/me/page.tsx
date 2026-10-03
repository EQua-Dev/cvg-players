"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Profile } from "@/lib/api";
import { ROLE_LABEL, jersey, shortDate } from "@/lib/format";
import { SignOutButton, useSession } from "@/components/Session";
import { TopBar } from "@/components/ui";

const FOOT: Record<string, string> = { RIGHT: "Right", LEFT: "Left", BOTH: "Both" };

export default function MePage() {
  const { me } = useSession();
  const m = me.member;
  const [p, setP] = useState<Profile | null>(null);

  useEffect(() => {
    api<Profile>("/me/profile").then(setP).catch(() => {});
  }, []);

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="row" style={{ gap: 16 }}>
          {p?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar" style={{ width: 72, height: 72 }} src={p.photoUrl} alt="" />
          ) : (
            <span className="jersey jersey-lg">{jersey(m.jerseyNumber)}</span>
          )}
          <div>
            <h1 className="h2" style={{ fontSize: 24 }}>{m.fullName}</h1>
            <span className="muted">{m.roles.length ? m.roles.map((r) => ROLE_LABEL[r]).join(" · ") : "Player"}</span>
          </div>
        </div>

        <div className="card">
          <div className="kv"><span className="muted">Member ID</span><span className="mono">{m.code}</span></div>
          {p?.favouredPosition && (
            <div className="kv">
              <span className="muted">Position</span>
              <span>{[p.favouredPosition, ...p.otherPositions].join(" · ")}</span>
            </div>
          )}
          {p?.dominantFoot && <div className="kv"><span className="muted">Foot</span><span>{FOOT[p.dominantFoot]}{p.weakFoot ? ` · weak ${"★".repeat(p.weakFoot)}` : ""}</span></div>}
          {p && p.strengths.length > 0 && <div className="kv"><span className="muted">Strengths</span><span style={{ textAlign: "right" }}>{p.strengths.join(", ")}</span></div>}
          <div className="kv"><span className="muted">Phone</span><span className="mono">{m.phone}</span></div>
          <div className="kv"><span className="muted">Joined</span><span>{shortDate(m.joinedOn)}</span></div>
        </div>

        <div className="list">
          <Link href="/setup" className="list-row"><span className="grow">Edit profile</span><span aria-hidden>→</span></Link>
          <Link href="/cards" className="list-row"><span className="grow">My FUT card</span><span aria-hidden>→</span></Link>
          <Link href="/card" className="list-row"><span className="grow">My ID card</span><span aria-hidden>→</span></Link>
          <Link href="/profiling" className="list-row"><span className="grow">How I play</span><span aria-hidden>→</span></Link>
          <Link href="/passcode" className="list-row">
            <span className="grow">{me.usesDefaultPasscode ? "Set your passcode" : "Change passcode"}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
        <SignOutButton />
      </main>
    </>
  );
}
