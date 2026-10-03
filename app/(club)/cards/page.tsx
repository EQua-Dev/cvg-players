"use client";

import { useEffect, useRef, useState } from "react";
import { api, GROUP_LABEL, GROUP_POSITION, TIER_LABEL, type MyCards, type PositionGroup } from "@/lib/api";
import { FutCard, saveFutImage, toDataUrl } from "@/components/FutCard";
import { useToast } from "@/components/Toast";
import { TopBar } from "@/components/ui";

export default function MyCardPage() {
  const toast = useToast();
  const [data, setData] = useState<MyCards | null>(null);
  const [photo, setPhoto] = useState<string | undefined>();
  const [group, setGroup] = useState<PositionGroup | undefined>();
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    api<MyCards>("/cards/me").then(async (d) => {
      setData(d);
      setGroup(d.latest?.group);
      setPhoto(await toDataUrl(d.latest?.photoUrl));
    });
  }, []);

  if (!data) return <><TopBar back="/me" /><div className="empty"><span className="spinner" /></div></>;
  const c = data.latest;
  if (!c) {
    return (
      <>
        <TopBar back="/me" />
        <main className="page"><h1 className="h1">My FUT card</h1><div className="empty">Your card appears after the first rating round closes.</div></main>
      </>
    );
  }

  // Favoured group first, then any other group the player plays, when it has a published card.
  const choices = [c.group, ...c.otherGroups, c.bestGroup].filter((g, i, a): g is PositionGroup => !!g && a.indexOf(g) === i)
    .filter((g) => g === c.group || c.groups.find((x) => x.group === g)?.published);
  const shown = c.groups.find((g) => g.group === group) ?? c.groups.find((g) => g.group === c.group);
  const isMain = !group || group === c.group;
  const position = isMain ? c.position : group ? GROUP_POSITION[group] : c.position;

  async function save() {
    if (!svg.current) return;
    await saveFutImage(svg.current, `CVG-${c!.name.replace(/\W+/g, "-")}-${shown?.ovr ?? ""}.png`);
    toast.show("Saved to your phone ✓");
  }

  return (
    <>
      <TopBar back="/me" />
      <main className="page">
        <h1 className="h1">My FUT card</h1>
        <div className="card-wrap">
          <FutCard ref={svg} card={{
            name: c.name, position, ovr: shown?.ovr, tier: shown?.tier, published: !!shown?.published,
            stats: shown?.stats.map((s) => ({ label: s.label, value: s.value })) ?? [], photo, jerseyNumber: c.jerseyNumber, round: c.round,
          }} />
        </div>
        {choices.length > 1 && (
          <div className="chips" style={{ justifyContent: "center" }}>
            {choices.map((g) => (
              <button key={g} className={`chip ${(group ?? c.group) === g ? "chip-on" : ""}`} onClick={() => setGroup(g)}>
                {GROUP_LABEL[g]} {c.groups.find((x) => x.group === g)?.ovr ?? ""}
              </button>
            ))}
          </div>
        )}
        {c.bestGroup && <div className="card small" style={{ textAlign: "center" }}>Plays {c.group ? GROUP_LABEL[c.group].toLowerCase() : ""} · rated best in <strong>{GROUP_LABEL[c.bestGroup].toLowerCase()}</strong></div>}
        {shown?.published && <button className="btn btn-primary btn-block" onClick={save}>Save to phone</button>}

        {shown && shown.stats.some((s) => s.self) && (
          <div className="card stack" style={{ gap: 10 }}>
            <div className="vs-row muted small"><span>You vs the squad</span><span style={{ textAlign: "center" }}>You</span><span style={{ textAlign: "center" }}>Squad</span></div>
            {shown.stats.map((s) => {
              const diff = s.self != null && s.value != null ? s.self - s.value : 0;
              return (
                <div key={s.code} className="vs-row">
                  <span>{s.title}</span>
                  <span className="mono" style={{ textAlign: "center", color: diff > 8 ? "var(--caution)" : diff < -8 ? "#46c08a" : undefined }}>{s.self ?? "–"}</span>
                  <strong className="mono" style={{ textAlign: "center" }}>{s.value ?? "–"}</strong>
                </div>
              );
            })}
            <span className="muted small">Only you see this.</span>
          </div>
        )}

        {data.history.length > 1 && (
          <>
            <span className="label">Your rounds</span>
            <div className="list">
              {data.history.map((h) => (
                <div key={h.windowId} className="list-row">
                  <span className="grow">{h.round}</span>
                  <span className="muted small">{h.tier ? TIER_LABEL[h.tier] : ""}</span>
                  <strong className="mono">{h.ovr ?? "–"}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
