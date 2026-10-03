"use client";

import { useEffect, useState } from "react";
import { api, type CardView, type Member } from "@/lib/api";
import { FutCard } from "@/components/FutCard";
import { Sheet } from "@/components/Sheet";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/format";
import { useSession } from "@/components/Session";
import { JerseyBadge, TopBar } from "@/components/ui";

export default function SquadPage() {
  const { me } = useSession();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [cards, setCards] = useState<CardView[]>([]);
  const [open, setOpen] = useState<CardView | null>(null);

  useEffect(() => {
    api<Member[]>("/members").then((all) =>
      setMembers(
        all
          .filter((m) => m.status === "ACTIVE" || m.status === "TRIALIST")
          .sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)),
      ),
    );
    api<CardView[]>("/cards").then((l) => setCards(l.filter((c) => c.published))).catch(() => {});
  }, []);

  const asCard = (c: CardView) => ({
    name: c.name, position: c.position, ovr: c.ovr, tier: c.tier, published: c.published,
    stats: c.stats.map((s) => ({ label: s.label, value: s.value })), jerseyNumber: c.jerseyNumber, round: c.round, photo: c.photoUrl,
  });

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="spread">
          <h1 className="h1">Squad</h1>
          {members && <span className="mono muted">{members.length}</span>}
        </div>
        {cards.length > 0 && (
          <>
            <span className="label">Cards · {cards[0].round}</span>
            <div className="mini-cards">
              {cards.map((c) => (
                <button key={c.memberId} onClick={() => setOpen(c)} aria-label={`${c.name} card`}>
                  <FutCard card={asCard(c)} />
                </button>
              ))}
            </div>
          </>
        )}
        {open && (
          <Sheet onClose={() => setOpen(null)}>
            <div className="card-wrap"><FutCard card={asCard(open)} /></div>
            {open.bestGroup && <span className="muted small" style={{ textAlign: "center" }}>Rated best in {open.bestGroup}</span>}
          </Sheet>
        )}
        {!members ? (
          <div className="empty"><span className="spinner" /></div>
        ) : (
          <div className="list">
            {members.map((m) => (
              <div key={m.id} className={`list-row ${m.id === me.member.id ? "me-row" : ""}`}>
                <JerseyBadge n={m.jerseyNumber} />
                <span className="grow">
                  <span className="ellipsis" style={{ display: "block", fontWeight: 600 }}>
                    {m.fullName}
                    {m.id === me.member.id && <span className="muted" style={{ fontWeight: 400 }}> · you</span>}
                  </span>
                  {m.roles.length > 0 && (
                    <span className="muted small">{m.roles.map((r) => ROLE_LABEL[r]).join(" · ")}</span>
                  )}
                </span>
                {m.status === "TRIALIST" && <span className="status status-TRIALIST">{STATUS_LABEL[m.status]}</span>}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
