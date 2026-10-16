// The rules of the guided liveness check, kept apart from the camera so they can be tested. The camera
// component feeds each video frame in as face points (MediaPipe's 478 landmarks) and blendshape scores.
// Everything here runs on the customer's device: it makes a casual shortcut (a held-up photo, a bad
// picture) hard, and it is not a substitute for the face match the server does against the NIN and the ID.

export type Challenge = "BLINK" | "TURN_LEFT" | "TURN_RIGHT" | "SMILE";

export const CHALLENGES: Challenge[] = ["BLINK", "TURN_LEFT", "TURN_RIGHT", "SMILE"];

export const CHALLENGE_PROMPTS: Record<Challenge, string> = {
  BLINK: "Blink your eyes",
  TURN_LEFT: "Turn your head to the left",
  TURN_RIGHT: "Turn your head to the right",
  SMILE: "Give us a smile",
};

/** Picks `count` different actions in a random order, so a recording cannot be prepared in advance. */
export function pickChallenges(random: () => number = Math.random, count = 2): Challenge[] {
  const pool = [...CHALLENGES];
  const picked: Challenge[] = [];
  while (picked.length < count && pool.length) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return picked;
}

export type Point = { x: number; y: number };

// Landmark indices of MediaPipe's face mesh.
const NOSE_TIP = 1;
const CHEEK_A = 234; // left edge of the face in the (unmirrored) image
const CHEEK_B = 454; // right edge of the face in the (unmirrored) image

export type FrameMetrics = {
  faces: number;
  /** Face centre, relative to the visible oval area: 0 is dead centre, 0.5 is its edge. */
  offsetX: number;
  offsetY: number;
  /** Face height as a share of the frame height. */
  heightShare: number;
  /** Where the nose sits between the two cheeks: about 0.5 facing the camera, above 0.62 turned to the person's left. */
  yaw: number;
  blink: number;
  smile: number;
  brightness: number | null;
};

export type Blendshapes = Record<string, number>;

/**
 * `visibleWidthShare` is how much of the frame's width the preview shows (the preview is a portrait crop of a
 * landscape video), so "centred" means centred in what the customer sees.
 */
export function analyseFaces(
  faces: Point[][],
  blendshapes: Blendshapes | null,
  visibleWidthShare: number,
  brightness: number | null,
): FrameMetrics {
  const empty: FrameMetrics = { faces: faces.length, offsetX: 0, offsetY: 0, heightShare: 0, yaw: 0.5, blink: 0, smile: 0, brightness };
  const face = faces[0];
  if (!face || face.length < 455) return empty;
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const p of face) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const width = face[CHEEK_B].x - face[CHEEK_A].x;
  const share = Math.max(0.05, Math.min(1, visibleWidthShare));
  const b = blendshapes ?? {};
  return {
    faces: faces.length,
    offsetX: ((minX + maxX) / 2 - 0.5) / share,
    offsetY: (minY + maxY) / 2 - 0.5,
    heightShare: maxY - minY,
    yaw: width > 0.0001 ? (face[NOSE_TIP].x - face[CHEEK_A].x) / width : 0.5,
    blink: ((b.eyeBlinkLeft ?? 0) + (b.eyeBlinkRight ?? 0)) / 2,
    smile: ((b.mouthSmileLeft ?? 0) + (b.mouthSmileRight ?? 0)) / 2,
    brightness,
  };
}

/** What to tell the customer when the frame is not good enough yet, or null when it is. */
export function frameFeedback(m: FrameMetrics): string | null {
  if (m.faces === 0) return "Look at the camera so we can see your face";
  if (m.faces > 1) return "Only one person in the frame, please";
  if (m.heightShare < 0.36) return "Move a little closer";
  if (m.heightShare > 0.78) return "Move back a little";
  if (Math.abs(m.offsetX) > 0.16 || Math.abs(m.offsetY) > 0.16) return "Centre your face in the oval";
  if (m.brightness !== null && m.brightness < 55) return "Find better light";
  if (m.brightness !== null && m.brightness > 225) return "Too bright - avoid a light shining straight at you";
  return null;
}

export const facingCamera = (m: FrameMetrics) => m.yaw > 0.42 && m.yaw < 0.58 && m.blink < 0.3;

/**
 * Watches the frames for one action. `update` returns true on the frame the action is done. A frame that is not
 * good (no face, two faces) restarts it, so the action has to be done by one face in view.
 */
export class ChallengeTracker {
  private held = 0;
  private openSeen = 0;
  private closed = false;

  readonly challenge: Challenge;

  constructor(challenge: Challenge) {
    this.challenge = challenge;
  }

  reset() {
    this.held = 0;
    this.openSeen = 0;
    this.closed = false;
  }

  update(m: FrameMetrics): boolean {
    if (m.faces !== 1) {
      this.reset();
      return false;
    }
    switch (this.challenge) {
      case "BLINK": {
        // eyes seen open, then closed, then open again
        if (!this.closed) {
          if (m.blink < 0.25) this.openSeen++;
          if (this.openSeen >= 3 && m.blink > 0.55) this.closed = true;
          return false;
        }
        return m.blink < 0.3;
      }
      case "TURN_LEFT":
        this.held = m.yaw > 0.62 ? this.held + 1 : 0;
        return this.held >= 4;
      case "TURN_RIGHT":
        this.held = m.yaw < 0.38 ? this.held + 1 : 0;
        return this.held >= 4;
      case "SMILE":
        this.held = m.smile > 0.55 ? this.held + 1 : 0;
        return this.held >= 3;
    }
  }
}
