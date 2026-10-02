"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Me } from "@/lib/api";

interface SessionValue {
  me: Me;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  const refresh = useCallback(async () => {
    setMe(await api<Me>("/auth/me"));
  }, []);

  useEffect(() => {
    refresh().catch(() => {
      // api() already redirects to sign-in on 401.
    });
  }, [refresh]);

  if (!me) {
    return (
      <div className="center-screen">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return <SessionContext.Provider value={{ me, refresh }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession outside SessionProvider");
  return value;
}

export function SignOutButton() {
  return (
    <button
      className="btn btn-ghost btn-block"
      onClick={async () => {
        await api("/auth/sign-out", { method: "POST" }).catch(() => {});
        window.location.href = "/sign-in";
      }}
    >
      Sign out
    </button>
  );
}
