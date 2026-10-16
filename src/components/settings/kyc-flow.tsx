"use client";
import { useCallback, useEffect, useState } from "react";
import { SettingsLayout } from "./settings-layout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { states } from "@/lib/onboarding";
import { LivenessCapture } from "./liveness-capture";
import {
  ApiError,
  fileToDataUri,
  getKycStatus,
  getToken,
  refreshKycAddress,
  submitKycAddress,
  submitKycDocument,
  submitKycLiveness,
  submitKycNin,
  type KycStatus,
  type KycStepName,
  type KycStepState,
} from "@/lib/api";

const TITLES: Record<KycStepName, string> = {
  LIVENESS: "Take a live selfie",
  NIN: "Verify your NIN",
  DOCUMENT: "Verify your ID",
  ADDRESS: "Verify your address",
};
const HELP: Record<KycStepName, string> = {
  LIVENESS: "Use your camera in good light. This photo is compared with your NIN and your ID.",
  NIN: "Your 11-digit National Identification Number. It must belong to the name on your account.",
  DOCUMENT: "A clear photo of the whole ID, flat and fully in view. The face on it is compared with your selfie.",
  ADDRESS: "Where you live. We check it, which can take a few days.",
};
const DOCUMENT_TYPES = {
  "Government ID card": "ID",
  "Driver's licence": "DL",
  "International passport": "PP",
} as const;

const STEP_ICONS: Record<KycStepName, React.ReactNode> = {
  LIVENESS: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.6A1 1 0 0 1 9.5 4h5a1 1 0 0 1 .8.4L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>
  ),
  NIN: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  DOCUMENT: (
    <>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M9 12h6M9 15.5h6" />
    </>
  ),
  ADDRESS: (
    <>
      <path d="M12 21s6.5-5.6 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.4 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
};

// The steps in a row: a ringed icon with the step name under it. The current step is deep purple, a finished one is
// filled with a tick, a step that failed is red, and one that cannot be started yet is grey.
function Stepper({ steps, active }: { steps: KycStepState[]; active: KycStepName | null }) {
  return (
    <ol className="grid grid-cols-4 gap-2 rounded-2xl border border-line bg-panel px-2 py-5 sm:px-5">
      {steps.map((s) => {
        const done = s.status === "VERIFIED";
        const current = s.step === active;
        const bad = !done && (s.status === "FAILED" || s.status === "ERROR");
        const ring = done || current ? "border-[#7C2EBF]" : bad ? "border-red-400" : "border-outline";
        const tone = done ? "bg-[#7C2EBF] text-white" : current ? "text-[#a66be0]" : bad ? "text-red-300" : "text-muted";
        const label = done || current ? "text-[#a66be0]" : bad ? "text-red-300" : "text-muted";
        return (
          <li key={s.step} className="flex min-w-0 flex-col items-center gap-2 text-center" aria-current={current ? "step" : undefined}>
            <span className={`flex size-11 items-center justify-center rounded-full border-2 sm:size-14 ${ring} ${tone}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5 sm:size-6" aria-hidden="true">
                {done ? <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="2.2" /> : STEP_ICONS[s.step]}
              </svg>
            </span>
            <span className={`text-[11px] leading-4 font-medium sm:text-xs ${label}`}>
              {TITLES[s.step]}
              <span className="sr-only"> - {done ? "done" : current ? "current step" : s.status === "NOT_STARTED" ? (s.canStart ? "to do" : "locked") : "needs another try"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function NinStep({ onSubmit, busy }: { onSubmit: (nin: string) => void; busy: boolean }) {
  const [nin, setNin] = useState("");
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(nin); }}>
      <Input
        label="National Identification Number (NIN)"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Enter your 11-digit NIN"
        pattern="[0-9]{11}"
        title="A NIN is 11 digits"
        maxLength={11}
        required
        variant="filled"
        value={nin}
        onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
      />
      <Button type="submit" fullWidth disabled={busy || nin.length !== 11}>{busy ? "Checking..." : "Verify NIN"}</Button>
    </form>
  );
}

function DocumentStep({ onSubmit, busy }: { onSubmit: (type: "ID" | "DL" | "PP", dataUri: string) => void; busy: boolean }) {
  const [type, setType] = useState<keyof typeof DOCUMENT_TYPES | "">("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function pick(file?: File) {
    setError("");
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      setError("Please choose a JPG or PNG photo.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("That photo is larger than 6 MB. Please choose a smaller one.");
      return;
    }
    setImage(await fileToDataUri(file));
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (type && image) onSubmit(DOCUMENT_TYPES[type], image);
      }}
    >
      <Select
        label="Document"
        placeholder="Choose a document"
        options={Object.keys(DOCUMENT_TYPES)}
        required
        variant="filled"
        value={type}
        onChange={(e) => setType(e.target.value as keyof typeof DOCUMENT_TYPES)}
      />
      <div className="space-y-2.5">
        <label htmlFor="kyc-document" className="block text-sm font-semibold text-[#eaeaea]">Photo of the document</label>
        <input
          id="kyc-document"
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          onChange={(e) => void pick(e.target.files?.[0])}
          className="block w-full text-sm text-muted file:mr-4 file:rounded-xl file:border-0 file:bg-surface file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-lavender"
        />
        {error && <Notice tone="error">{error}</Notice>}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Your document" className="max-h-56 rounded-xl border border-line object-contain" />
        )}
      </div>
      <Button type="submit" fullWidth disabled={busy || !type || !image}>{busy ? "Checking..." : "Verify document"}</Button>
    </form>
  );
}

function AddressStep({ onSubmit, busy }: { onSubmit: (a: { houseNumber: string; street: string; city: string; state: string; lga: string; landmark: string }) => void; busy: boolean }) {
  const [a, setA] = useState({ houseNumber: "", street: "", city: "", state: "", lga: "", landmark: "" });
  const set = (key: keyof typeof a) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setA((prev) => ({ ...prev, [key]: e.target.value }));
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...a, houseNumber: a.houseNumber.trim(), street: a.street.trim(), city: a.city.trim(), lga: a.lga.trim(), landmark: a.landmark.trim() });
      }}
    >
      <Input label="House number" required variant="filled" autoComplete="off" value={a.houseNumber} onChange={set("houseNumber")} />
      <Input label="Street" required variant="filled" autoComplete="address-line1" value={a.street} onChange={set("street")} />
      <Input label="City" required variant="filled" autoComplete="address-level2" value={a.city} onChange={set("city")} />
      <Select label="State" placeholder="Select state" options={states} required variant="filled" value={a.state} onChange={set("state")} />
      <Input label="Local government" required variant="filled" value={a.lga} onChange={set("lga")} />
      <Input label="Nearest landmark" required variant="filled" value={a.landmark} onChange={set("landmark")} />
      <div className="sm:col-span-2">
        <Button type="submit" fullWidth disabled={busy}>{busy ? "Submitting..." : "Verify address"}</Button>
      </div>
    </form>
  );
}

export function VerifyIdentity() {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // The selfie can be taken again until the NIN has been checked against it.
  const [retakeSelfie, setRetakeSelfie] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setStatus((await getKycStatus(token)).data);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not load your verification status.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function run(action: (token: string) => Promise<{ message: string }>) {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const result = await action(token);
      setInfo(result.message);
      setRetakeSelfie(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
      await load();
    }
  }

  const active = status?.nextStep ?? null;
  const activeState = status?.steps.find((s) => s.step === active);

  return (
    <SettingsLayout
      title="Verify your identity"
      description="Verify yourself to lift your account limits. Each step is saved as you go, so you can stop and come back."
    >
      {loadError && <Notice tone="error">{loadError}</Notice>}
      {!status && !loadError && <p role="status" className="text-sm text-muted">Loading...</p>}
      {status && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-panel p-5">
            <div>
              <p className="text-xs text-muted">Your account level</p>
              <p className="font-display text-lg font-semibold">Tier {status.tier}</p>
            </div>
            {status.ninMasked && <p className="text-xs text-muted">NIN {status.ninMasked}</p>}
          </div>

          <Stepper steps={status.steps} active={active} />
          {activeState?.message && activeState.status !== "NOT_STARTED" && activeState.status !== "VERIFIED" && activeState.status !== "PENDING" && !error && (
            <Notice tone="error">{activeState.message}</Notice>
          )}

          {error && <Notice tone="error">{error}</Notice>}
          {info && !error && active !== null && activeState?.status !== "PENDING" && <Notice>{info}</Notice>}

          {active === null && (
            <Notice>
              All steps are done.{" "}
              {status.bankOne.tier3 === "VERIFIED"
                ? "Your account is at the highest level."
                : "Your account upgrade is being completed and will show here shortly."}
            </Notice>
          )}

          {active && activeState && (
            <section className="space-y-4 rounded-2xl border border-line bg-panel p-5" aria-labelledby="kyc-step">
              <div>
                <h2 id="kyc-step" className="font-display text-base font-semibold">{active === "NIN" && retakeSelfie ? TITLES.LIVENESS : TITLES[active]}</h2>
                <p className="mt-1 text-xs text-subtle">{active === "NIN" && retakeSelfie ? HELP.LIVENESS : HELP[active]}</p>
              </div>
              {activeState.status === "PENDING" ? (
                <div className="space-y-4">
                  <Notice>Your address is being checked. This can take a few days, and you can leave this page.</Notice>
                  <Button variant="secondary" disabled={busy} onClick={() => void run((t) => refreshKycAddress(t).then((r) => ({ message: r.message })))}>
                    {busy ? "Checking..." : "Check now"}
                  </Button>
                </div>
              ) : activeState.attemptsLeft <= 0 ? (
                <Notice tone="error">You have used all your attempts for this step. Please contact support.</Notice>
              ) : active === "LIVENESS" || (active === "NIN" && retakeSelfie) ? (
                <LivenessCapture busy={busy} onSubmit={(img, meta) => void run((t) => submitKycLiveness(img, t, meta).then((r) => ({ message: r.message })))} />
              ) : active === "NIN" ? (
                <div className="space-y-4">
                  <NinStep busy={busy} onSubmit={(nin) => void run((t) => submitKycNin(nin, t).then((r) => ({ message: r.message })))} />
                  <Button variant="ghost" size="sm" onClick={() => setRetakeSelfie(true)} disabled={busy}>Retake my selfie</Button>
                </div>
              ) : active === "DOCUMENT" ? (
                <DocumentStep busy={busy} onSubmit={(type, img) => void run((t) => submitKycDocument(type, img, t).then((r) => ({ message: r.message })))} />
              ) : (
                <AddressStep busy={busy} onSubmit={(a) => void run((t) => submitKycAddress(a, t).then((r) => ({ message: r.message })))} />
              )}
              {activeState.attemptsLeft > 0 && activeState.attemptsLeft < 5 && activeState.status !== "PENDING" && (
                <p className="text-xs text-muted">{activeState.attemptsLeft} attempt{activeState.attemptsLeft === 1 ? "" : "s"} left for this step.</p>
              )}
            </section>
          )}
        </div>
      )}
    </SettingsLayout>
  );
}
