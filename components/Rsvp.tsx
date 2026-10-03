"use client";

import { useState } from "react";
import { api, errorMessage, REASON_LABEL, type OutReason, type Session } from "@/lib/api";
import { clock, weekdayLong } from "@/lib/format";
import { useToast } from "@/components/Toast";

/** "I'm in / I'm out" for one session. Out asks why with one tap. */
export function Rsvp({ session, onChange, big = false }: { session: Session; onChange: (s: Session) => void; big?: boolean }) {
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const me = session.me;
  const locked = !me || me.locked;
  const day = weekdayLong(session.date).slice(0, 3).toLowerCase();

  async function set(status: "IN" | "OUT", reason?: OutReason) {
    setBusy(true);
    try {
      const s = await api<Session>(`/training/sessions/${session.id}/availability`, { method: "PUT", body: { status, reason } });
      onChange(s);
      if (navigator.vibrate) navigator.vibrate(12);
      toast.show(status === "IN" ? `You're in for ${weekdayLong(session.date).toLowerCase().replace(/^./, (c) => c.toUpperCase())} ✓` : "Marked out");
    } catch (e) {
      toast.show(errorMessage(e), "alert");
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  return (
    <>
      <div className="rsvp" style={big ? undefined : { maxWidth: 260 }}>
        <button className={me?.status === "IN" ? "in-on" : ""} disabled={busy || locked} onClick={() => me?.status !== "IN" && set("IN")} aria-pressed={me?.status === "IN"}>
          I&apos;m in
        </button>
        <button className={me?.status === "OUT" ? "out-on" : ""} disabled={busy || locked} onClick={() => setAsking(true)} aria-pressed={me?.status === "OUT"}>
          {me?.status === "OUT" && me.reason ? `Out · ${REASON_LABEL[me.reason]}` : "I'm out"}
        </button>
      </div>
      {locked && session.status === "SCHEDULED" && <span className="muted small">Locked. Tell the coach if things change.</span>}
      {!locked && big && <span className="muted small">You can change until {clock(new Date(me!.lockAt).toTimeString().slice(0, 5))} on {day}.</span>}

      {asking && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setAsking(false)}>
          <div className="sheet" role="dialog" aria-modal="true">
            <strong>Why are you out?</strong>
            <div className="chips">
              {(Object.keys(REASON_LABEL) as OutReason[]).map((r) => (
                <button key={r} className="chip" disabled={busy} onClick={() => set("OUT", r)}>{REASON_LABEL[r]}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
