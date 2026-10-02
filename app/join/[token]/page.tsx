"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { jersey } from "@/lib/format";

interface JoinView {
  firstName: string;
  code: string;
  jerseyNumber?: number;
  phoneHint: string;
  alreadySetUp: boolean;
}

type Step = "welcome" | "pick" | "again";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [view, setView] = useState<JoinView | null>(null);
  const [gone, setGone] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [pick, setPick] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<JoinView>(`/onboarding/${token}`)
      .then(setView)
      .catch((e) => setGone(e instanceof ApiError ? e.message : "Something went wrong."));
  }, [token]);

  if (gone) {
    return (
      <main className="center-screen">
        <span className="brand" style={{ fontSize: 22 }}><span className="brand-mark">◆</span> CVG</span>
        <p className="h2">Link not working</p>
        <p className="muted">{gone}</p>
        <Link href="/sign-in" className="btn btn-ghost">Sign in instead</Link>
      </main>
    );
  }
  if (!view) return <div className="center-screen"><span className="spinner" /></div>;

  if (view.alreadySetUp) {
    return (
      <main className="center-screen">
        <p className="h2">You&apos;re already set up ✓</p>
        <p className="muted">Sign in with your phone and passcode.</p>
        <Link href="/sign-in" className="btn btn-primary">Sign in</Link>
      </main>
    );
  }

  async function next(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === "pick") return setStep("again");
    if (again !== pick) {
      setError("They don't match. Try again.");
      setPick("");
      setAgain("");
      return setStep("pick");
    }
    setBusy(true);
    try {
      await api(`/onboarding/${token}/claim`, { method: "POST", body: { passcode: pick } });
      router.replace("/setup?welcome=1");
    } catch (err) {
      setError(errorMessage(err));
      setPick("");
      setAgain("");
      setStep("pick");
    } finally {
      setBusy(false);
    }
  }

  if (step === "welcome") {
    return (
      <main className="page" style={{ justifyContent: "center", gap: 24 }}>
        <span className="brand" style={{ fontSize: 20 }}><span className="brand-mark">◆</span> CVG</span>
        <div className="stack" style={{ gap: 8 }}>
          <h1 className="h1" style={{ fontSize: 36 }}>Hi {view.firstName} 👋</h1>
          <p className="h2" style={{ fontWeight: 600 }}>Welcome to CVG FC.</p>
        </div>
        <div className="card spread">
          <span className="stack" style={{ gap: 4 }}>
            <span className="label">Your member ID</span>
            <span className="mono" style={{ fontSize: 20 }}>{view.code}</span>
          </span>
          <span className="stat" style={{ fontSize: 40, color: "var(--orange)" }}>{jersey(view.jerseyNumber)}</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>3 quick steps: passcode, photo, how you play.</p>
        <button className="btn btn-primary btn-block" onClick={() => setStep("pick")}>Let&apos;s go</button>
      </main>
    );
  }

  const value = step === "pick" ? pick : again;
  return (
    <main className="page" style={{ justifyContent: "center" }}>
      <form className="stack" style={{ gap: 18 }} onSubmit={next}>
        <span className="label">Step 1 of 3</span>
        <h1 className="h1">{step === "pick" ? "Pick a passcode" : "Type it again"}</h1>
        <p className="muted" style={{ margin: 0 }}>You&apos;ll sign in with {view.phoneHint} and this passcode.</p>
        <input
          key={step}
          className="input input-pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="••••"
          value={value}
          onChange={(e) => (step === "pick" ? setPick : setAgain)(e.target.value.replace(/\D/g, ""))}
          autoFocus
          aria-label={step === "pick" ? "Pick a passcode" : "Type it again"}
        />
        <span className="muted small">4 to 6 numbers. No 1234 or 0000.</span>
        {error && <div className="notice notice-caution" role="alert">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={value.length < 4 || busy}>
          {step === "pick" ? "Next" : busy ? "Saving…" : "Save"}
        </button>
      </form>
    </main>
  );
}
