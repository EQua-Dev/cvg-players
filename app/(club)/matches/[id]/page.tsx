"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, errorMessage, PLAN_NAMES, type MatchDetail, type MatchView, type OpinionsView, type PotmView } from "@/lib/api";
import { clock, sessionDay } from "@/lib/format";
import { Pitch } from "@/components/Pitch";
import { Rsvp } from "@/components/Rsvp";
import { useSession } from "@/components/Session";
import { useToast } from "@/components/Toast";
import { TopBar } from "@/components/ui";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useSession();
  const [data, setData] = useState<MatchDetail | null>(null);

  const load = useCallback(() => api<MatchDetail>(`/matches/${id}`).then(setData), [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <><TopBar back="/matches" /><div className="empty"><span className="spinner" /></div></>;
  const m = data.match;
  const l = data.lineup;
  const r = data.result;
  const nameOf = (memberId?: string) => [...(l?.slots ?? []), ...(l?.bench ?? [])].find((s) => s.memberId === memberId)?.name;

  return (
    <>
      <TopBar back="/matches" />
      <main className="page" style={{ gap: 14 }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h1" style={{ fontSize: 26 }}>vs {m.opponent}</h1>
          <span className="mono small" style={{ color: "var(--orange)", fontWeight: 600 }}>
            {sessionDay(m.date)} · {clock(m.time)}{m.meetTime ? ` · meet ${clock(m.meetTime)}` : ""}
          </span>
          <span className="muted small">{[m.venue, m.kit && `Kit: ${m.kit}`, m.gamePlan && `Plan: ${PLAN_NAMES[m.gamePlan]}`].filter(Boolean).join(" · ")}</span>
          {m.notes && <span className="small">{m.notes}</span>}
        </div>

        {m.status === "CANCELLED" && <div className="card muted">Cancelled.</div>}
        {m.status === "SCHEDULED" && (
          <Rsvp session={m} onChange={(x: MatchView) => setData({ ...data, match: x })} big path={`/matches/${m.id}/availability`} />
        )}

        {r && (
          <div className="card stack" style={{ alignItems: "center", textAlign: "center", gap: 8 }}>
            <span className="label">Full time</span>
            <span className="score-big">{r.ourScore} – {r.theirScore}</span>
            {r.goals.length > 0 && (
              <span className="small">⚽ {r.goals.map((g) => (g.ownGoal ? "OG" : g.scorer?.name) + (g.assist ? ` (🅰 ${g.assist.name})` : "")).join(", ")}</span>
            )}
          </div>
        )}

        {data.potm && <PotmCard matchId={m.id} potm={data.potm} onChange={(p) => setData({ ...data, potm: p, match: { ...m, votedPotm: !!p.myVote } })} />}
        {data.opinions && m.inSquad && <OpinionCard matchId={m.id} ops={data.opinions} onChange={(o) => setData({ ...data, opinions: o, match: { ...m, gaveOpinion: true } })} />}
        {data.opinions && data.opinions.count > 0 && <Summary ops={data.opinions} />}

        {l && (
          <>
            <div className="spread">
              <span className="label">Lineup · {l.formation}</span>
              {m.myLineup && <span className="small" style={{ color: "var(--orange)", fontWeight: 700 }}>{m.myLineup === "STARTING" ? "You're starting" : "You're on the bench"}</span>}
            </div>
            <Pitch slots={l.slots} captainId={l.captainId} highlight={me.member.id} />
            {l.bench.some((b) => b.name) && (
              <span className="small"><span className="muted">Bench:</span> {l.bench.filter((b) => b.name).map((b) => b.name).join(", ")}</span>
            )}
            {(l.penaltyTakerId || l.freeKickTakerId || l.cornerTakerId) && (
              <span className="muted small">
                {[l.penaltyTakerId && `Pens: ${nameOf(l.penaltyTakerId)}`, l.freeKickTakerId && `Free kicks: ${nameOf(l.freeKickTakerId)}`, l.cornerTakerId && `Corners: ${nameOf(l.cornerTakerId)}`]
                  .filter(Boolean).join(" · ")}
              </span>
            )}
          </>
        )}
        {!l && m.status === "SCHEDULED" && <div className="card muted small">The lineup shows here when the coach publishes it.</div>}
      </main>
    </>
  );
}

/** Tap a teammate's face to vote. You can change your mind until it closes. */
function PotmCard({ matchId, potm, onChange }: { matchId: string; potm: PotmView; onChange: (p: PotmView) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function vote(nomineeId: string) {
    if (busy || nomineeId === potm.myVote) return;
    setBusy(true);
    try {
      onChange(await api<PotmView>(`/matches/${matchId}/potm/vote`, { method: "POST", body: { nomineeId } }));
      if (navigator.vibrate) navigator.vibrate(15);
      toast.show("Vote in ✓");
    } catch (e) {
      toast.show(errorMessage(e), "alert");
    } finally {
      setBusy(false);
    }
  }

  if (!potm.open) {
    if (potm.winners.length === 0) return null;
    return (
      <div className="card stack" style={{ gap: 6, borderLeft: "3px solid var(--orange)" }}>
        <span className="label">Player of the Match</span>
        <strong style={{ fontSize: 20 }}>🏆 {potm.winners.map((w) => w.name).join(" & ")}</strong>
        <span className="muted small">{potm.winners[0].votes} vote{potm.winners[0].votes > 1 ? "s" : ""}{potm.winners.length > 1 ? " each · joint" : ""}</span>
      </div>
    );
  }
  if (!potm.canVote) {
    return <div className="card muted small">🗳️ POTM vote open · {potm.votesCast} of {potm.voters} voted</div>;
  }
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="spread">
        <strong>{potm.myVote ? "Your POTM ✓" : "Who was Player of the Match?"}</strong>
        <span className="muted small mono">{potm.votesCast}/{potm.voters}</span>
      </div>
      <div className="face-grid">
        {potm.nominees.map((n) => (
          <button key={n.memberId} className={`face ${potm.myVote === n.memberId ? "face-on" : ""}`} onClick={() => vote(n.memberId)} disabled={busy}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="face-pic">{n.photoUrl ? <img src={n.photoUrl} alt="" /> : n.jerseyNumber ?? "?"}</span>
            <span className="ellipsis" style={{ maxWidth: 80 }}>{n.name}</span>
          </button>
        ))}
      </div>
      <span className="muted small">Secret vote. Totals show when it closes.</span>
    </div>
  );
}

/** What went well, what to fix: up to 3 taps each. Words and self-rating are optional. */
function OpinionCard({ matchId, ops, onChange }: { matchId: string; ops: OpinionsView; onChange: (o: OpinionsView) => void }) {
  const toast = useToast();
  const mine = ops.mine;
  const [editing, setEditing] = useState(!mine);
  const [good, setGood] = useState<string[]>(mine?.commendTags ?? []);
  const [bad, setBad] = useState<string[]>(mine?.critiqueTags ?? []);
  const [goodText, setGoodText] = useState(mine?.commendText ?? "");
  const [badText, setBadText] = useState(mine?.critiqueText ?? "");
  const [rating, setRating] = useState<number | undefined>(mine?.selfRating);
  const [words, setWords] = useState(!!(mine?.commendText || mine?.critiqueText));
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], set: (l: string[]) => void, t: string) =>
    set(list.includes(t) ? list.filter((x) => x !== t) : list.length >= 3 ? list : [...list, t]);

  async function save() {
    setBusy(true);
    try {
      onChange(await api<OpinionsView>(`/matches/${matchId}/opinion`, {
        method: "PUT",
        body: { commendTags: good, critiqueTags: bad, commendText: goodText || null, critiqueText: badText || null, selfRating: rating ?? null },
      }));
      toast.show("Thanks ✓");
      setEditing(false);
    } catch (e) {
      toast.show(errorMessage(e), "alert");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button className="card card-link" style={{ width: "100%", textAlign: "left", color: "inherit" }} onClick={() => setEditing(true)}>
        <span className="small">Your view ✓ <span className="muted">· tap to change</span></span>
        <span aria-hidden>✎</span>
      </button>
    );
  }

  return (
    <div className="card stack" style={{ gap: 12 }}>
      <strong>👍 What went well?</strong>
      <div className="chips">
        {ops.allTags.map((t) => (
          <button key={t} className={`chip chip-good ${good.includes(t) ? "chip-on" : ""}`} onClick={() => toggle(good, setGood, t)}>{t}</button>
        ))}
      </div>
      <strong>👎 What to fix?</strong>
      <div className="chips">
        {ops.allTags.map((t) => (
          <button key={t} className={`chip chip-bad ${bad.includes(t) ? "chip-on" : ""}`} onClick={() => toggle(bad, setBad, t)}>{t}</button>
        ))}
      </div>
      {words ? (
        <>
          <input className="input" maxLength={280} value={goodText} onChange={(e) => setGoodText(e.target.value)} placeholder="Went well… (optional)" />
          <input className="input" maxLength={280} value={badText} onChange={(e) => setBadText(e.target.value)} placeholder="To fix… (optional)" />
        </>
      ) : (
        <button className="btn btn-quiet" style={{ alignSelf: "flex-start" }} onClick={() => setWords(true)}>+ Add a few words</button>
      )}
      <span className="label">Rate yourself · optional</span>
      <div className="rating">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} className={rating === n ? "on" : ""} onClick={() => setRating(rating === n ? undefined : n)}>{n}</button>
        ))}
      </div>
      <button className="btn btn-primary btn-block" disabled={busy || (good.length === 0 && bad.length === 0)} onClick={save}>Send</button>
      <span className="muted small">Teammates see it without your name.</span>
    </div>
  );
}

function Summary({ ops }: { ops: OpinionsView }) {
  const max = Math.max(1, ...ops.tags.flatMap((t) => [t.praised, t.criticised]));
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <span className="label">The squad says · {ops.count}</span>
      {ops.tags.slice(0, 6).map((t) => (
        <div key={t.tag} className="tag-bar">
          <span className="pos" style={{ width: `${(t.praised / max) * 100}%` }} />
          <span style={{ fontWeight: 600, textAlign: "center", minWidth: 96 }}>{t.tag}</span>
          <span className="neg" style={{ width: `${(t.criticised / max) * 100}%` }} />
        </div>
      ))}
      {ops.items.filter((o) => o.commendText || o.critiqueText).slice(0, 5).map((o, i) => (
        <span key={i} className="small muted">“{[o.commendText, o.critiqueText].filter(Boolean).join(" · ")}”</span>
      ))}
    </div>
  );
}
