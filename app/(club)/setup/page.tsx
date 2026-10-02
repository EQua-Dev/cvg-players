"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, ApiError, errorMessage, upload, type Foot, type Profile, type ProfileOptions } from "@/lib/api";
import { squarePhoto } from "@/lib/image";
import { jersey } from "@/lib/format";
import { useSession } from "@/components/Session";
import { useToast } from "@/components/Toast";

const STEPS = ["photo", "position", "others", "foot", "weakFoot", "strengths", "weaknesses", "about", "emergency", "consent"] as const;
type Step = (typeof STEPS)[number] | "done";

/** Which step fixes each item the API reports as missing. */
const STEP_FOR_MISSING: Record<string, Step> = {
  photo: "photo",
  favouredPosition: "position",
  dominantFoot: "foot",
  emergencyContact: "emergency",
  consent: "consent",
};

interface Draft {
  favouredPosition?: string;
  otherPositions: string[];
  dominantFoot?: Foot;
  weakFoot?: number;
  strengths: string[];
  weaknesses: string[];
  heightCm?: number;
  dateOfBirth?: string;
  stateOfOrigin?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  consentPublic?: boolean;
}

const GROUPS: { key: string; label: string }[] = [
  { key: "GK", label: "Goal" },
  { key: "DEF", label: "Defence" },
  { key: "MID", label: "Midfield" },
  { key: "ATT", label: "Attack" },
];

function toDraft(p: Profile): Draft {
  return {
    favouredPosition: p.favouredPosition,
    otherPositions: p.otherPositions,
    dominantFoot: p.dominantFoot,
    weakFoot: p.weakFoot,
    strengths: p.strengths,
    weaknesses: p.weaknesses,
    heightCm: p.heightCm,
    dateOfBirth: p.dateOfBirth,
    stateOfOrigin: p.stateOfOrigin,
    emergencyName: p.emergencyContact?.name,
    emergencyPhone: p.emergencyContact?.phone,
    consentPublic: p.consentPublic,
  };
}

export default function SetupPage() {
  const { me } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [options, setOptions] = useState<ProfileOptions | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<Step>("photo");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([api<ProfileOptions>("/profile/options"), api<Profile>("/me/profile")]).then(([o, p]) => {
      setOptions(o);
      setProfile(p);
      setDraft(toDraft(p));
      // Resume where they left off; a complete profile opens at the start for editing.
      setStep(p.complete ? "photo" : (STEP_FOR_MISSING[p.missing[0]] ?? "photo"));
    });
  }, []);

  if (!options || !profile || !draft) return <div className="center-screen"><span className="spinner" /></div>;

  const index = STEPS.indexOf(step as (typeof STEPS)[number]);
  const go = (s: Step) => {
    setFieldError(null);
    setStep(s);
    window.scrollTo(0, 0);
  };
  const nextStep = () => go(index >= 0 && index < STEPS.length - 1 ? STEPS[index + 1] : "done");

  /** Saves the whole draft, then moves on. */
  async function save(patch: Partial<Draft>, advance = true) {
    const next = { ...draft!, ...patch };
    setDraft(next);
    setBusy(true);
    try {
      setProfile(await api<Profile>("/me/profile", { method: "PUT", body: next }));
      if (advance) nextStep();
    } catch (e) {
      const fields = e instanceof ApiError ? e.fields : undefined;
      setFieldError(fields ? Object.values(fields)[0] : errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  /** Tap an option: show it selected for a beat, then save and move on. */
  function tap(patch: Partial<Draft>) {
    setDraft({ ...draft!, ...patch });
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => save(patch), 180);
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const blob = await squarePhoto(file);
      setProfile(await upload<Profile>("/me/photo", blob));
      toast.show("Looking good ✓");
    } catch (err) {
      toast.show(errorMessage(err), "alert");
    } finally {
      setBusy(false);
    }
  }

  function toggle(list: string[], value: string, max: number): string[] {
    if (list.includes(value)) return list.filter((v) => v !== value);
    return list.length >= max ? list : [...list, value];
  }

  if (step === "done") {
    return (
      <main className="page" style={{ justifyContent: "center", textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 56 }}>✓</div>
        <h1 className="q-title">Profile {profile.complete ? "done" : "saved"}</h1>
        {!profile.complete && (
          <p className="muted" style={{ margin: 0 }}>Still to do: {profile.missing.map(missingLabel).join(", ")}.</p>
        )}
        <button className="btn btn-primary btn-block" onClick={() => router.push("/profiling")}>
          How do you play? · 14 taps
        </button>
        <button className="btn btn-quiet" onClick={() => router.push("/")}>Later</button>
      </main>
    );
  }

  const byGroup = (g: string) => options.positions.filter((p) => p.group === g);

  return (
    <>
      <div className="wizard-top">
        <button
          className="btn btn-quiet back"
          onClick={() => (index > 0 ? go(STEPS[index - 1]) : router.push("/"))}
          aria-label="Back"
        >
          ←
        </button>
        <div className="progress grow" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => <span key={s} className={i <= index ? "on" : ""} />)}
        </div>
      </div>

      <main className="page" style={{ paddingTop: 20 }}>
        {step === "photo" && (
          <>
            <h1 className="q-title">Your photo</h1>
            <p className="muted" style={{ margin: 0 }}>For your ID card and player card. Face the camera.</p>
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="avatar" src={profile.photoUrl} alt="Your photo" />
              ) : (
                <div className="avatar">{jersey(me.member.jerseyNumber)}</div>
              )}
            </div>
            <input ref={cameraInput} type="file" accept="image/*" capture="user" hidden onChange={onPhoto} />
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={onPhoto} />
            <button className="btn btn-primary btn-block" disabled={busy} onClick={() => cameraInput.current?.click()}>
              {busy ? "Uploading…" : profile.photoUrl ? "Retake photo" : "📷 Take a photo"}
            </button>
            <button className="btn btn-ghost btn-block" disabled={busy} onClick={() => fileInput.current?.click()}>
              Choose from gallery
            </button>
            <button className="btn btn-quiet" onClick={nextStep}>{profile.photoUrl ? "Next →" : "Later"}</button>
          </>
        )}

        {step === "position" && (
          <>
            <h1 className="q-title">Your main position?</h1>
            {GROUPS.map((g) => (
              <div key={g.key} className="stack" style={{ gap: 8 }}>
                <span className="group-label">{g.label}</span>
                <div className="grid-2">
                  {byGroup(g.key).map((p) => (
                    <button
                      key={p.code}
                      className={`option ${draft.favouredPosition === p.code ? "option-on" : ""}`}
                      disabled={busy}
                      onClick={() => tap({ favouredPosition: p.code, otherPositions: draft.otherPositions.filter((o) => o !== p.code) })}
                    >
                      <span className="option-code">{p.code}</span>
                      <span style={{ fontSize: 14 }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {step === "others" && (
          <>
            <h1 className="q-title">Can also play…</h1>
            <p className="muted" style={{ margin: 0 }}>Pick up to {options.maxOtherPositions}.</p>
            <div className="grid-2">
              {options.positions
                .filter((p) => p.code !== draft.favouredPosition)
                .map((p) => {
                  const on = draft.otherPositions.includes(p.code);
                  const full = !on && draft.otherPositions.length >= options.maxOtherPositions;
                  return (
                    <button
                      key={p.code}
                      className={`option ${on ? "option-on" : ""}`}
                      disabled={full}
                      onClick={() => setDraft({ ...draft, otherPositions: toggle(draft.otherPositions, p.code, options.maxOtherPositions) })}
                    >
                      <span className="option-code">{p.code}</span>
                      <span style={{ fontSize: 14 }}>{p.label}</span>
                    </button>
                  );
                })}
            </div>
            <StepButton busy={busy} onClick={() => save({})} label={draft.otherPositions.length ? "Next" : "None, next"} />
          </>
        )}

        {step === "foot" && (
          <>
            <h1 className="q-title">Stronger foot?</h1>
            <div className="options">
              {(["RIGHT", "LEFT", "BOTH"] as Foot[]).map((f) => (
                <button key={f} className={`option ${draft.dominantFoot === f ? "option-on" : ""}`} disabled={busy} onClick={() => tap({ dominantFoot: f })}>
                  {{ RIGHT: "Right", LEFT: "Left", BOTH: "Both" }[f]}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "weakFoot" && (
          <>
            <h1 className="q-title">Your weaker foot?</h1>
            <p className="muted" style={{ margin: 0 }}>1 = only for standing. 5 = as good as the other.</p>
            <div className="stars" style={{ padding: "16px 0" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={`star ${(draft.weakFoot ?? 0) >= n ? "star-on" : ""}`} disabled={busy} onClick={() => tap({ weakFoot: n })} aria-label={`${n} stars`}>
                  ★
                </button>
              ))}
            </div>
            <button className="btn btn-quiet" onClick={nextStep}>Skip</button>
          </>
        )}

        {(step === "strengths" || step === "weaknesses") && (
          <>
            <h1 className="q-title">{step === "strengths" ? "Your strengths?" : "What to improve?"}</h1>
            <p className="muted" style={{ margin: 0 }}>Pick up to {options.maxTraits}.</p>
            <div className="chips">
              {options.traits.map((t) => {
                const list = step === "strengths" ? draft.strengths : draft.weaknesses;
                const other = step === "strengths" ? draft.weaknesses : draft.strengths;
                const on = list.includes(t);
                const off = other.includes(t) || (!on && list.length >= options.maxTraits);
                return (
                  <button
                    key={t}
                    className={`chip ${on ? "chip-on" : ""}`}
                    disabled={off}
                    style={off ? { opacity: 0.35 } : undefined}
                    onClick={() =>
                      setDraft({ ...draft, [step]: toggle(list, t, options.maxTraits) } as Draft)
                    }
                  >
                    {on && "✓ "}{t}
                  </button>
                );
              })}
            </div>
            {fieldError && <div className="notice notice-caution">{fieldError}</div>}
            <StepButton busy={busy} onClick={() => save({})} label="Next" />
          </>
        )}

        {step === "about" && (
          <>
            <h1 className="q-title">A bit about you</h1>
            <p className="muted" style={{ margin: 0 }}>All optional.</p>
            <div className="field">
              <span className="label">Height · {draft.heightCm ?? 175} cm</span>
              <input
                className="range"
                type="range"
                min={150}
                max={210}
                value={draft.heightCm ?? 175}
                onChange={(e) => setDraft({ ...draft, heightCm: Number(e.target.value) })}
              />
            </div>
            <label className="field">
              <span className="label">Birthday</span>
              <input className="input" type="date" value={draft.dateOfBirth ?? ""} onChange={(e) => setDraft({ ...draft, dateOfBirth: e.target.value || undefined })} />
            </label>
            <label className="field">
              <span className="label">State of origin</span>
              <select className="input" value={draft.stateOfOrigin ?? ""} onChange={(e) => setDraft({ ...draft, stateOfOrigin: e.target.value || undefined })}>
                <option value="">—</option>
                {options.states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            {fieldError && <div className="notice notice-caution">{fieldError}</div>}
            <StepButton busy={busy} onClick={() => save({})} label="Next" />
            <button className="btn btn-quiet" onClick={nextStep}>Skip</button>
          </>
        )}

        {step === "emergency" && (
          <>
            <h1 className="q-title">Who do we call in an emergency?</h1>
            <label className="field">
              <span className="label">Name</span>
              <input className="input" value={draft.emergencyName ?? ""} onChange={(e) => setDraft({ ...draft, emergencyName: e.target.value })} placeholder="e.g. Ngozi Adeyemi" />
            </label>
            <label className="field">
              <span className="label">Phone</span>
              <input className="input input-mono" type="tel" inputMode="tel" value={draft.emergencyPhone ?? ""} onChange={(e) => setDraft({ ...draft, emergencyPhone: e.target.value })} placeholder="0803 555 0000" />
            </label>
            {fieldError && <div className="notice notice-caution">{fieldError}</div>}
            <StepButton
              busy={busy}
              disabled={!draft.emergencyName?.trim() || !draft.emergencyPhone?.trim()}
              onClick={() => save({})}
              label="Next"
            />
            <button className="btn btn-quiet" onClick={nextStep}>Later</button>
          </>
        )}

        {step === "consent" && (
          <>
            <h1 className="q-title">Show your photo on club pages?</h1>
            <p className="muted" style={{ margin: 0 }}>Your photo, name and position on the public squad page and when someone scans your ID card.</p>
            <div className="options">
              <button className={`option ${draft.consentPublic === true ? "option-on" : ""}`} disabled={busy} onClick={() => tap({ consentPublic: true })}>
                Yes, show it
              </button>
              <button className={`option ${draft.consentPublic === false ? "option-on" : ""}`} disabled={busy} onClick={() => tap({ consentPublic: false })}>
                No, keep it private
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function StepButton({ busy, onClick, label, disabled }: { busy: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <div className="sticky-action">
      <button className="btn btn-primary btn-block" disabled={busy || disabled} onClick={onClick}>
        {busy ? "Saving…" : label}
      </button>
    </div>
  );
}

function missingLabel(key: string): string {
  return { photo: "photo", favouredPosition: "position", dominantFoot: "foot", emergencyContact: "emergency contact", consent: "photo permission" }[key] ?? key;
}
