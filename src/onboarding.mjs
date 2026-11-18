/**
 * First-visit apprenticeship cues, separate from the equation engine.
 * Hints explain the physical controls and never disclose hidden algebra.
 */
export const GUIDE_ENABLED_KEY = "mathssprites.guided-intro.v1";
export const GUIDE_SEEN_KEY = "mathssprites.intro-finished.v1";

export function readGuideEnabled(storage) {
  try { return (storage ?? globalThis.localStorage)?.getItem(GUIDE_ENABLED_KEY) !== "off"; }
  catch { return true; } // Browsers can block localStorage access altogether.
}
export function writeGuideEnabled(enabled, storage) {
  try { (storage ?? globalThis.localStorage)?.setItem(GUIDE_ENABLED_KEY, enabled ? "on" : "off"); }
  catch {}
  return !!enabled;
}
export function readGuideSeen(storage) {
  try { return (storage ?? globalThis.localStorage)?.getItem(GUIDE_SEEN_KEY) === "yes"; }
  catch { return false; }
}
export function writeGuideSeen(seen, storage) {
  try { (storage ?? globalThis.localStorage)?.setItem(GUIDE_SEEN_KEY, seen ? "yes" : "no"); }
  catch {}
  return !!seen;
}

/**
 * The coach never intercepts a move: the game works even when the player
 * ignores every cue, and the controls remain entirely functional.
 */
export function introductionCue(step, { mode = "auto", pending = false, busy = false } = {}) {
  if (step === 0) return {
    title: "Meet the balance",
    text: "Two rooms are balanced. Dark sprites are mysteries; each brass weight counts as one. The goal is to leave one sprite by itself.",
    target: "scene", action: "Show me the tools", progress: "1 of 4"
  };
  if (step === 1) return {
    title: "1 · Choose an action",
    text: "Removing objects from BOTH rooms keeps the scale balanced. The Remove tool is already selected for your first puzzle.",
    target: "remove", action: "Choose the objects", progress: "2 of 4"
  };
  if (step === 2) return {
    title: "2 · Choose two weights",
    text: "Choose the Weight object and make the number TWO. We want to remove two brass weights from each room.",
    target: "amount", action: "Ready to try", progress: "3 of 4"
  };
  if (pending && mode === "manual") return {
    title: "3 · Now match the other room",
    text: "You've made the first change. Use the matching action in the other room to restore the balance.",
    target: "right-action", action: null, progress: "4 of 4"
  };
  if (busy) return {
    title: "3 · Watch the hand",
    text: "The hand is moving the objects. Both chambers will settle before the algebra comic begins.",
    target: "scene", action: null, progress: "4 of 4"
  };
  return mode === "manual" ? {
    title: "3 · Make the matching moves",
    text: "In Your Turn mode, use the hand on the west room, then repeat the same action in the east room.",
    target: "left-action", action: null, progress: "4 of 4"
  } : {
    title: "3 · Keep both rooms balanced",
    text: "Press Do it to both rooms. Guided Mirror will perform your chosen action in each room, one after the other.",
    target: "do-both", action: null, progress: "4 of 4"
  };
}
