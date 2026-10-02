"use client";

import { useEffect, useState } from "react";
import { api, type Member } from "@/lib/api";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/format";
import { useSession } from "@/components/Session";
import { JerseyBadge, TopBar } from "@/components/ui";

export default function SquadPage() {
  const { me } = useSession();
  const [members, setMembers] = useState<Member[] | null>(null);

  useEffect(() => {
    api<Member[]>("/members").then((all) =>
      setMembers(
        all
          .filter((m) => m.status === "ACTIVE" || m.status === "TRIALIST")
          .sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)),
      ),
    );
  }, []);

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="spread">
          <h1 className="h1">Squad</h1>
          {members && <span className="mono muted">{members.length}</span>}
        </div>
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
