"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage, type RateSheet, type RoleVoteSheet } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { TopBar } from "@/components/ui";

const STEPS = [
  { v: 2, label: "Weak" },
  { v: 4, label: "Fair" },
  { v: 6, label: "Good" },
  { v: 8, label: "Strong" },
  { v: 10, label: "Elite" },
];

/** One player, 20 rows, one tap each. Every tap saves. */
export default function RatePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [sheet, setSheet] = useState<RateSheet | null>(null);
  const [scores, setScores] = useState<Record<string, number | undefined>>({});
  const [prefilled, setPrefilled] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [roleSheet, setRoleSheet] = useState<RoleVoteSheet | null>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSheet(null);
    api<RateSheet>(`/ratings/me/${id}`).then((s) => {
      setSheet(s);
      const all = s.blocks.flatMap((b) => b.attrs);
      setScores(Object.fromEntries(all.map((a) => [a.code, a.score])));
      setPrefilled(new Set(all.filter((a) => a.prefilled).map((a) => a.code)));
      window.scrollTo(0, 0);
      if (!s.isMe) api<RoleVoteSheet>(`/ratings/me/${id}/role`).then(setRoleSheet).catch(() => setRoleSheet(null));
      else setRoleSheet(null);
    }).catch((e) => toast.show(errorMessage(e), "alert"));
  }, [id, toast]);

  async function tap(code: string, v: number) {
    setScores((s) => ({ ...s, [code]: v }));
    setPrefilled((p) => { const n = new Set(p); n.delete(code); return n; });
    if (navigator.vibrate) navigator.vibrate(8);
    try {
      await api(`/ratings/me/${id}`, { method: "PUT", body: { scores: { [code]: v } } });
    } catch (e) {
      toast.show(errorMessage(e), "alert");
    }
  }

  async function voteRole(code: string) {
    try {
      setRoleSheet(await api<RoleVoteSheet>(`/ratings/me/${id}/role`, { method: "PUT", body: { role: code } }));
      if (navigator.vibrate) navigator.vibrate(8);
    } catch (e) {
      toast.show(errorMessage(e), "alert");
    }
  }

  async function next() {
    if (!sheet) return;
    setBusy(true);
    try {
      // Last round's answers count once you move on.
      const carry = Object.fromEntries([...prefilled].map((c) => [c, scores[c]!]));
      if (Object.keys(carry).length) await api(`/ratings/me/${id}`, { method: "PUT", body: { scores: carry } });
      router.push(sheet.nextMemberId ? `/rate/${sheet.nextMemberId}` : "/rate");
    } catch (e) {
      toast.show(errorMessage(e), "alert");
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  if (!sheet) return <><TopBar back="/rate" /><div className="empty"><span className="spinner" /></div></>;
  const answered = Object.values(scores).filter((v) => v !== undefined && v !== null).length;
  const total = Object.keys(scores).length;

  return (
    <>
      <TopBar back="/rate" />
      <main className="page" style={{ gap: 14 }} ref={top}>
        <div className="row" style={{ gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="face-pic" style={{ width: 64, height: 64 }}>{sheet.photoUrl ? <img src={sheet.photoUrl} alt="" /> : sheet.jerseyNumber ?? ""}</span>
          <div className="stack grow" style={{ gap: 2 }}>
            <strong style={{ fontSize: 22 }}>{sheet.isMe ? "You" : sheet.name}</strong>
            <span className="muted small">{sheet.position ?? ""} · player {sheet.index} of {sheet.total}</span>
          </div>
          <span className="mono small" style={{ color: answered === total ? "#46c08a" : "var(--muted)" }}>{answered}/{total}</span>
        </div>
        {roleSheet && roleSheet.roles.length > 0 && (
          <section className="stack" style={{ gap: 8 }}>
            <span className="label">What role suits {roleSheet.name} best?</span>
            <div className="chips">
              {roleSheet.roles.map((r) => (
                <button key={r.code} className={`chip ${roleSheet.mine === r.code ? "chip-on" : ""}`} onClick={() => voteRole(r.code)}>{r.name}</button>
              ))}
            </div>
          </section>
        )}
        {prefilled.size > 0 && <span className="muted small">Last round&apos;s answers are filled in. Change what&apos;s different.</span>}

        {sheet.blocks.map((b) => (
          <section key={b.block} className="stack" style={{ gap: 10 }}>
            <span className="label">{b.label}</span>
            {b.attrs.map((a) => (
              <div key={a.code} className="rate-row">
                <span className="rate-title">{a.title}</span>
                <div className="rate-steps">
                  {STEPS.map((s) => (
                    <button key={s.v} className={`${scores[a.code] === s.v ? "on" : ""} ${prefilled.has(a.code) ? "pre" : ""}`} onClick={() => tap(a.code, s.v)}>{s.label}</button>
                  ))}
                  <button className={`dk ${scores[a.code] === 0 ? "on" : ""}`} onClick={() => tap(a.code, 0)} aria-label="Don't know">?</button>
                </div>
              </div>
            ))}
          </section>
        ))}

        <div className="sticky-action">
          <button className="btn btn-primary btn-block" disabled={busy} onClick={next}>{sheet.nextMemberId ? "Next player →" : "Done"}</button>
        </div>
      </main>
    </>
  );
}
