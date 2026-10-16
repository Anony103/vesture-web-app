"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  CHALLENGE_PROMPTS,
  ChallengeTracker,
  analyseFaces,
  facingCamera,
  frameFeedback,
  pickChallenges,
  type Blendshapes,
  type Challenge,
} from "@/lib/liveness";

// MediaPipe runs the face model in the browser: only the model files are downloaded, no picture leaves the device.
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const ASPECT = 3 / 4; // the camera area is a portrait oval frame
const PURPLE = "#a66be0";
const GREEN = "#34d399";

export type LivenessMeta = { challenges: Challenge[]; durationMs: number };

type Phase = "idle" | "loading" | "position" | "challenge" | "straight" | "countdown" | "done";
type Ui = { phase: Phase; prompt: string; hint: string; countdown: number | null; step: number; total: number; good: boolean };

const START: Ui = { phase: "idle", prompt: "", hint: "", countdown: null, step: 0, total: 0, good: false };

type Landmarker = {
  detectForVideo: (v: HTMLVideoElement, t: number) => {
    faceLandmarks: { x: number; y: number }[][];
    faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[];
  };
  close: () => void;
};

async function loadLandmarker(): Promise<Landmarker> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const files = await FilesetResolver.forVisionTasks(WASM_URL);
  const make = (delegate: "GPU" | "CPU") =>
    FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "VIDEO",
      numFaces: 2, // two, so a second person in the frame can be noticed
      outputFaceBlendshapes: true,
    });
  try {
    return (await make("GPU")) as unknown as Landmarker;
  } catch {
    return (await make("CPU")) as unknown as Landmarker;
  }
}

// The oval the face goes in: everything outside it is dimmed, and its outline shows how the check is going.
function OvalGuide({ colour, children }: { colour: string; children?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <path fillRule="evenodd" fill="rgba(4,4,10,0.74)" d="M0 0H300V400H0Z M42 195a108 146 0 1 0 216 0a108 146 0 1 0 -216 0Z" />
      <ellipse cx="150" cy="195" rx="108" ry="146" fill="none" stroke={colour} strokeWidth="4" style={{ transition: "stroke 200ms" }} />
      {children}
    </svg>
  );
}

// The fallback when the guided check cannot run (no WebGL, the model files cannot be downloaded): a plain live
// capture. Still camera-only, so a photo of a photo cannot be dropped in from the gallery.
function ManualSelfie({ onSubmit, busy, reason }: { onSubmit: (dataUri: string, meta?: LivenessMeta) => void; busy: boolean; reason: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [live, setLive] = useState(false);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setLive(false);
  }, []);
  useEffect(() => stop, [stop]);

  async function start() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser cannot open the camera here. Use a recent browser on a secure (https) connection.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 960 } },
        audio: false,
      });
      setLive(true);
      requestAnimationFrame(() => {
        if (video.current && stream.current) {
          video.current.srcObject = stream.current;
          void video.current.play();
        }
      });
    } catch {
      setCameraError("We could not open your camera. Allow camera access for this site and try again.");
    }
  }

  function capture() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const side = Math.min(v.videoWidth, v.videoHeight);
    const canvas = document.createElement("canvas");
    const size = Math.min(side, 900);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, size, size);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
    stop();
  }

  return (
    <div className="space-y-4">
      <Notice>{reason}</Notice>
      {cameraError && <Notice tone="error">{cameraError}</Notice>}
      <div className="mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Your selfie" className="size-full -scale-x-100 object-cover" />
        ) : live ? (
          <video ref={video} muted playsInline className="size-full -scale-x-100 object-cover" />
        ) : (
          <p className="px-6 text-center text-xs text-muted">Your camera is off</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {!live && !shot && <Button onClick={start}>Open camera</Button>}
        {live && <Button onClick={capture}>Take photo</Button>}
        {shot && (
          <>
            <Button variant="secondary" onClick={() => { setShot(null); void start(); }} disabled={busy}>Retake</Button>
            <Button onClick={() => onSubmit(shot)} disabled={busy}>{busy ? "Saving..." : "Use this photo"}</Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The guided liveness check: put your face in the oval, do two random actions (blink, turn your head, smile), look
 * straight, and the photo is taken after a 3-2-1. If the face model cannot run, a plain camera capture is offered.
 */
export function LivenessCapture({ onSubmit, busy }: { onSubmit: (dataUri: string, meta?: LivenessMeta) => void; busy: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const landmarker = useRef<Landmarker | null>(null);
  const raf = useRef(0);
  const timers = useRef<number[]>([]);
  const probe = useRef<HTMLCanvasElement | null>(null);
  const [ui, setUi] = useState<Ui>(START);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState("");
  const submit = useRef(onSubmit);
  submit.current = onSubmit;

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    landmarker.current?.close();
    landmarker.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const show = useCallback((next: Partial<Ui>) => setUi((prev) => ({ ...prev, ...next })), []);

  // Average brightness of the frame, 0-255, from a tiny copy of it.
  const brightnessOf = useCallback((v: HTMLVideoElement) => {
    const canvas = (probe.current ??= document.createElement("canvas"));
    canvas.width = 32;
    canvas.height = 24;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, 32, 24);
    const data = ctx.getImageData(0, 0, 32, 24).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    return sum / (data.length / 4);
  }, []);

  const takePhoto = useCallback((v: HTMLVideoElement) => {
    // the portrait area the customer saw, cut from the full frame and left un-mirrored
    let sw = v.videoWidth;
    let sh = v.videoHeight;
    if (sw / sh > ASPECT) sw = sh * ASPECT;
    else sh = sw / ASPECT;
    const out = document.createElement("canvas");
    out.width = Math.min(Math.round(sw), 720);
    out.height = Math.round(out.width / ASPECT);
    out.getContext("2d")?.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, out.width, out.height);
    return out.toDataURL("image/jpeg", 0.9);
  }, []);

  async function start() {
    setError("");
    setFallback("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot open the camera here. Use a recent browser on a secure (https) connection.");
      return;
    }
    show({ ...START, phase: "loading", prompt: "Opening your camera..." });
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch {
      setError("We could not open your camera. Allow camera access for this site and try again.");
      setUi(START);
      return;
    }
    const v = video.current;
    if (!v) return;
    v.srcObject = stream.current;
    try {
      await v.play();
      show({ prompt: "Getting the face check ready..." });
      landmarker.current = await loadLandmarker();
    } catch {
      stop();
      setUi(START);
      setFallback("The guided check could not start on this device, so we will take a clear photo instead.");
      return;
    }
    run(v);
  }

  function run(v: HTMLVideoElement) {
    const checks = pickChallenges(Math.random, 2);
    const trackers = checks.map((c) => new ChallengeTracker(c));
    const began = performance.now();
    const eng = { phase: "position" as Phase, good: 0, challenge: 0, challengeSince: 0, countdownAt: 0, lastRun: 0, lastTime: -1, frames: 0, brightness: null as number | null };
    show({ phase: "position", prompt: "Put your face in the oval", hint: "", step: 0, total: checks.length + 1, good: false });

    const loop = () => {
      raf.current = requestAnimationFrame(loop);
      const now = performance.now();
      if (!landmarker.current || v.readyState < 2 || v.currentTime === eng.lastTime || now - eng.lastRun < 45) return;
      eng.lastTime = v.currentTime;
      eng.lastRun = now;
      if (eng.frames++ % 6 === 0) eng.brightness = brightnessOf(v);

      const result = landmarker.current.detectForVideo(v, now);
      const shapes: Blendshapes = {};
      result.faceBlendshapes?.[0]?.categories.forEach((c) => (shapes[c.categoryName] = c.score));
      const visibleWidth = Math.min(1, ASPECT / (v.videoWidth / v.videoHeight));
      const m = analyseFaces(result.faceLandmarks, shapes, visibleWidth, eng.brightness);
      const problem = frameFeedback(m);
      const ready = problem === null && facingCamera(m);

      if (eng.phase === "position") {
        eng.good = ready ? eng.good + 1 : 0;
        show({ hint: problem ?? "", good: problem === null });
        if (eng.good >= 12) {
          eng.phase = "challenge";
          eng.challenge = 0;
          eng.challengeSince = now;
          show({ phase: "challenge", prompt: CHALLENGE_PROMPTS[checks[0]], hint: "", step: 1, good: true });
        }
      } else if (eng.phase === "challenge") {
        const tracker = trackers[eng.challenge];
        // a hint only while the face itself is the trouble (no face, two faces); turning away is the point of the turn
        show({ hint: m.faces !== 1 ? (problem ?? "") : "" });
        if (tracker.update(m)) {
          eng.challenge++;
          eng.challengeSince = now;
          if (eng.challenge >= checks.length) {
            eng.phase = "straight";
            eng.good = 0;
            show({ phase: "straight", prompt: "Great! Now look straight at the camera", hint: "", step: checks.length + 1 });
          } else {
            show({ prompt: CHALLENGE_PROMPTS[checks[eng.challenge]], step: eng.challenge + 1 });
          }
        } else if (now - eng.challengeSince > 12000) {
          tracker.reset();
          eng.challengeSince = now;
          show({ hint: "Let's try that again" });
        }
      } else if (eng.phase === "straight") {
        eng.good = ready ? eng.good + 1 : 0;
        show({ hint: problem ?? "" });
        if (eng.good >= 10) {
          eng.phase = "countdown";
          eng.countdownAt = now;
          show({ phase: "countdown", prompt: "Hold still", hint: "", countdown: 3 });
        }
      } else if (eng.phase === "countdown") {
        if (!ready) {
          eng.phase = "straight";
          eng.good = 0;
          show({ phase: "straight", prompt: "Look straight at the camera", hint: problem ?? "", countdown: null });
          return;
        }
        const left = 3 - Math.floor((now - eng.countdownAt) / 700);
        if (left > 0) {
          show({ countdown: left });
        } else {
          cancelAnimationFrame(raf.current);
          const photo = takePhoto(v);
          show({ phase: "done", prompt: "Verified - it's you", hint: "", countdown: null, good: true });
          const meta: LivenessMeta = { challenges: checks, durationMs: Math.round(now - began) };
          timers.current.push(
            window.setTimeout(() => {
              stop();
              submit.current(photo, meta);
            }, 900),
          );
        }
      }
    };
    raf.current = requestAnimationFrame(loop);
  }

  if (fallback) return <ManualSelfie onSubmit={onSubmit} busy={busy} reason={fallback} />;

  const active = ui.phase !== "idle";
  const colour = ui.phase === "done" ? GREEN : ui.good ? PURPLE : "#6b6f8a";
  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div
        className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-3xl border border-line bg-surface"
        style={{ aspectRatio: "3 / 4" }}
      >
        <video ref={video} muted playsInline className={`size-full -scale-x-100 object-cover ${active ? "" : "invisible"}`} />
        {active && (
          <OvalGuide colour={colour}>
            {ui.phase === "done" && (
              <path d="m112 198 28 28 52-58" fill="none" stroke={GREEN} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="liveness-tick" />
            )}
          </OvalGuide>
        )}
        {ui.countdown !== null && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-semibold text-white drop-shadow-lg" aria-hidden="true">
            {ui.countdown}
          </span>
        )}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#a66be0" strokeWidth="1.5" className="size-14" aria-hidden="true">
              <ellipse cx="12" cy="12" rx="6.5" ry="8.5" />
              <path d="M9.5 10.5h.01M14.5 10.5h.01M9.5 15c1.5 1.2 3.5 1.2 5 0" strokeLinecap="round" />
            </svg>
            <p className="text-xs text-muted">We will ask you to do two quick actions, like blinking or turning your head, to show it is really you.</p>
          </div>
        )}
      </div>

      <div className="min-h-[72px] text-center" aria-live="polite">
        {active ? (
          <>
            <p className="font-display text-base font-semibold">{ui.prompt}</p>
            <p className="mt-1 min-h-4 text-xs text-subtle">{ui.hint}</p>
            {ui.total > 0 && (
              <div className="mt-3 flex justify-center gap-2" aria-hidden="true">
                {Array.from({ length: ui.total }, (_, i) => (
                  <span key={i} className={`h-1.5 w-8 rounded-full ${i < ui.step || ui.phase === "done" ? "bg-[#7C2EBF]" : "bg-line"}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <Button onClick={() => void start()} disabled={busy}>{busy ? "Saving..." : "Start face check"}</Button>
        )}
      </div>
      {active && ui.phase !== "done" && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => { stop(); setUi(START); }}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
