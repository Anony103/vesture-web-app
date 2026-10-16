import test from "node:test";
import assert from "node:assert/strict";
import {
  CHALLENGES,
  ChallengeTracker,
  analyseFaces,
  facingCamera,
  frameFeedback,
  pickChallenges,
} from "../src/lib/liveness.ts";

// A face with 478 points around the centre of the frame; only the ones the rules read are placed by hand.
function face({ cx = 0.5, cy = 0.5, height = 0.5, yaw = 0.5 } = {}) {
  const width = height * 0.75;
  const points = Array.from({ length: 478 }, () => ({ x: cx, y: cy }));
  points[10] = { x: cx, y: cy - height / 2 };
  points[152] = { x: cx, y: cy + height / 2 };
  points[234] = { x: cx - width / 2, y: cy };
  points[454] = { x: cx + width / 2, y: cy };
  points[1] = { x: cx - width / 2 + yaw * width, y: cy };
  return points;
}
const metrics = (f, shapes = {}, brightness = 120) => analyseFaces([f], shapes, 0.75, brightness);

test("random actions are different, and vary with the dice", () => {
  const picked = pickChallenges(() => 0.99, 2);
  assert.equal(new Set(picked).size, 2);
  assert.ok(picked.every((c) => CHALLENGES.includes(c)));
  assert.notDeepEqual(pickChallenges(() => 0, 2), pickChallenges(() => 0.99, 2));
  assert.equal(pickChallenges(Math.random, 9).length, CHALLENGES.length);
});

test("a centred face of the right size is good", () => {
  const m = metrics(face());
  assert.equal(frameFeedback(m), null);
  assert.ok(facingCamera(m));
});

test("feedback tells the customer what to fix", () => {
  assert.match(frameFeedback(analyseFaces([], null, 0.75, 120)), /Look at the camera/);
  assert.match(frameFeedback(analyseFaces([face(), face()], null, 0.75, 120)), /Only one person/);
  assert.match(frameFeedback(metrics(face({ height: 0.2 }))), /closer/);
  assert.match(frameFeedback(metrics(face({ height: 0.9 }))), /back/);
  assert.match(frameFeedback(metrics(face({ cx: 0.5 + 0.2 * 0.75 }))), /Centre/);
  assert.match(frameFeedback(metrics(face({ cy: 0.75 }))), /Centre/);
  assert.match(frameFeedback(metrics(face(), {}, 20)), /better light/);
  assert.match(frameFeedback(metrics(face(), {}, 250)), /Too bright/);
  assert.equal(frameFeedback(metrics(face(), {}, null)), null); // brightness unknown: not a reason to hold the customer
});

test("turning the head is read from where the nose sits between the cheeks", () => {
  assert.ok(metrics(face({ yaw: 0.75 })).yaw > 0.62);
  assert.ok(metrics(face({ yaw: 0.25 })).yaw < 0.38);
  assert.ok(!facingCamera(metrics(face({ yaw: 0.7 }))));
});

test("a turn must be held for a few frames, and stops counting when the head comes back", () => {
  const t = new ChallengeTracker("TURN_LEFT");
  const turned = metrics(face({ yaw: 0.75 }));
  assert.equal(t.update(turned), false);
  assert.equal(t.update(turned), false);
  assert.equal(t.update(metrics(face())), false); // came back: starts again
  for (let i = 0; i < 3; i++) assert.equal(t.update(turned), false);
  assert.equal(t.update(turned), true);
  const r = new ChallengeTracker("TURN_RIGHT");
  const right = metrics(face({ yaw: 0.25 }));
  for (let i = 0; i < 3; i++) assert.equal(r.update(right), false);
  assert.equal(r.update(right), true);
  const wrongWay = new ChallengeTracker("TURN_RIGHT");
  for (let i = 0; i < 10; i++) assert.equal(wrongWay.update(turned), false);
});

test("a blink needs open eyes first, then closed, then open again", () => {
  const open = metrics(face(), { eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 });
  const shut = metrics(face(), { eyeBlinkLeft: 0.9, eyeBlinkRight: 0.8 });
  const t = new ChallengeTracker("BLINK");
  assert.equal(t.update(shut), false); // eyes were never seen open: a still photo of closed eyes does not count
  assert.equal(t.update(shut), false);
  const u = new ChallengeTracker("BLINK");
  for (let i = 0; i < 4; i++) assert.equal(u.update(open), false);
  assert.equal(u.update(shut), false);
  assert.equal(u.update(open), true);
});

test("a smile must be held, and a second face resets everything", () => {
  const smile = metrics(face(), { mouthSmileLeft: 0.8, mouthSmileRight: 0.7 });
  const t = new ChallengeTracker("SMILE");
  assert.equal(t.update(smile), false);
  assert.equal(t.update(smile), false);
  assert.equal(t.update(analyseFaces([face(), face()], {}, 0.75, 120)), false); // someone else steps in
  assert.equal(t.update(smile), false);
  assert.equal(t.update(smile), false);
  assert.equal(t.update(smile), true);
});
