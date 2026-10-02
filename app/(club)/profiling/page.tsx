"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, errorMessage, PLAN_NAMES, type ProfilingResult, type Questionnaire } from "@/lib/api";
import { useToast } from "@/components/Toast";

type Phase = "loading" | "needsPosition" | "intro" | "asking" | "sending" | "result";

const STORE = "cvg-profiling-draft";

export default function ProfilingPage() {
  const router = useRouter();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("loading");
  const [q, setQ] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<ProfilingResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [questionnaire, latest] = await Promise.all([
          api<Questionnaire>("/me/profiling/questionnaire"),
          api<{ result: ProfilingResult } | undefined>("/me/profiling"),
        ]);
        setQ(questionnaire);
        // Resume an unfinished run on this phone.
        const saved = readDraft(questionnaire.version, questionnaire.group);
        if (saved && Object.keys(saved).length) {
          setAnswers(saved);
          setIndex(Math.min(questionnaire.questions.findIndex((x) => !saved[x.id]), questionnaire.questions.length - 1));
          setPhase("asking");
        } else if (latest?.result) {
          setResult(latest.result);
          setPhase("result");
        } else {
          setPhase("intro");
        }
      } catch (e) {
        if (e instanceof ApiError && e.code === "no_position") setPhase("needsPosition");
        else toast.show(errorMessage(e), "alert");
      }
    })();
  }, [toast]);

  if (phase === "loading") return <div className="center-screen"><span className="spinner" /></div>;

  if (phase === "needsPosition") {
    return (
      <main className="center-screen">
        <p className="h2">First, your position</p>
        <p className="muted">The questions depend on where you play.</p>
        <Link href="/setup" className="btn btn-primary">Pick my position</Link>
      </main>
    );
  }

  if (!q) return null;

  async function submit(all: Record<string, string>) {
    setPhase("sending");
    try {
      const r = await api<ProfilingResult>("/me/profiling", { method: "POST", body: { version: q!.version, answers: all } });
      localStorage.removeItem(STORE);
      setResult(r);
      setPhase("result");
    } catch (e) {
      toast.show(errorMessage(e), "alert");
      setPhase("asking");
    }
  }

  function choose(questionId: string, optionId: string | null) {
    const next = { ...answers };
    if (optionId) next[questionId] = optionId;
    else delete next[questionId];
    setAnswers(next);
    localStorage.setItem(STORE, JSON.stringify({ version: q!.version, group: q!.group, answers: next }));
    setPicked(optionId);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => {
      setPicked(null);
      if (index < q!.questions.length - 1) setIndex(index + 1);
      else submit(next);
    }, 220);
  }

  if (phase === "intro") {
    return (
      <main className="page" style={{ justifyContent: "center", gap: 20 }}>
        <span style={{ fontSize: 48 }}>⚽</span>
        <h1 className="q-title" style={{ fontSize: 34 }}>{q.title}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 18 }}>{q.subtitle}</p>
        <button className="btn btn-primary btn-block" onClick={() => setPhase("asking")}>Start</button>
        <button className="btn btn-quiet" onClick={() => router.push("/")}>Later</button>
      </main>
    );
  }

  if (phase === "result" && result) return <Result result={result} onRetake={() => { setAnswers({}); setIndex(0); setPhase("intro"); }} />;

  const question = q.questions[index];
  const current = picked ?? answers[question.id];

  return (
    <>
      <div className="wizard-top">
        <button className="btn btn-quiet back" onClick={() => (index > 0 ? setIndex(index - 1) : setPhase("intro"))} aria-label="Back">
          ←
        </button>
        <div className="progress grow" aria-label={`Question ${index + 1} of ${q.questions.length}`}>
          {q.questions.map((x, i) => <span key={x.id} className={i <= index ? "on" : ""} />)}
        </div>
      </div>
      <main className="page" style={{ paddingTop: 28 }}>
        <span className="label">{index + 1} / {q.questions.length}{!question.scored && " · for the coach"}</span>
        <h1 className="q-title">{question.text}</h1>
        <div className="options" style={{ marginTop: 8 }}>
          {question.options.map((o) => (
            <button
              key={o.id}
              className={`option ${current === o.id ? "option-on" : ""}`}
              disabled={phase === "sending"}
              onClick={() => choose(question.id, o.id)}
            >
              {o.text}
            </button>
          ))}
        </div>
        {!question.scored && (
          <button className="btn btn-quiet" onClick={() => choose(question.id, null)}>Skip</button>
        )}
        {phase === "sending" && <div className="empty"><span className="spinner" /></div>}
      </main>
    </>
  );
}

function Result({ result, onRetake }: { result: ProfilingResult; onRetake: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 50);
    return () => clearTimeout(t);
  }, []);
  const plans = Object.entries(result.planFits).sort((a, b) => b[1] - a[1]);
  const [adjective, ...rest] = result.label.split(" ");
  const shareText = `I'm a ${result.label} ⚽ — CVG FC`;

  return (
    <main className="page" style={{ gap: 20 }}>
      <span className="label" style={{ marginTop: 16 }}>Your style</span>
      <h1 className="result-label">
        <em>{adjective}</em> {rest.join(" ")}
      </h1>
      {result.secondaryRole && (
        <p className="muted" style={{ margin: 0 }}>Also: {result.secondaryRole.name}</p>
      )}
      <div className="card stack" style={{ gap: 14 }}>
        <span className="label">Best game plans for you</span>
        {plans.map(([code, fit], i) => (
          <div key={code} className="stack" style={{ gap: 6 }}>
            <div className="spread">
              <span style={{ fontWeight: i === 0 ? 700 : 500 }}>{PLAN_NAMES[code] ?? code}</span>
              <span className="mono">{fit}</span>
            </div>
            <div className={`bar ${i === 0 ? "top" : ""}`}><span style={{ width: shown ? `${fit}%` : 0 }} /></div>
          </div>
        ))}
      </div>
      <a className="btn btn-primary btn-block" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
        Share on WhatsApp
      </a>
      <Link href="/" className="btn btn-ghost btn-block">Done</Link>
      <button className="btn btn-quiet" onClick={onRetake}>Retake</button>
    </main>
  );
}

function readDraft(version: number, group: string): Record<string, string> | null {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) ?? "null");
    return raw && raw.version === version && raw.group === group ? raw.answers : null;
  } catch {
    return null;
  }
}
