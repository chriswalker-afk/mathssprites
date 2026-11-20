/**
 * Chapter handovers explain the NEW idea without instructing a specific
 * mathematical operation or showing an equation in the game scene.
 */
export const CHAPTER_BRIEFINGS = Object.freeze({
  5: "NEW SKILL · Equal baskets. Each basket needs the same whole objects. Keep one complete group from each room.",
  9: "NEW SKILL · Two-step experiments. You may need more than one kind of action, and their order matters.",
  13: "NEW SKILL · Across the hall. Dark sprites may appear in both rooms. Equal removals still keep the balance.",
  17: "NEW CHALLENGE · Master of the balance. Choose an efficient strategy; adding or grouping first can sometimes help."
});

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
    text: "Choose a tool to change both rooms equally. Nothing is selected for you: you decide what should happen.",
    target: "actions", action: "Choose the objects", progress: "2 of 4"
  };
  if (step === 2) return {
    title: "2 · Choose the objects and amount",
    text: "After choosing a tool, choose the object and set a quantity with the plus button. Look at the rooms to decide what to change.",
    target: "tools", action: "Ready to try", progress: "3 of 4"
  };
  if (pending && mode === "manual") return {
    title: "3 · Now match the other room",
    text: "You've made the first change. Use the matching action in the other room to restore the balance.",
    target: pending === "left" ? "right-action" : "left-action",
    action: null, progress: "4 of 4"
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


/** Stage 2 has its OWN onboarding state, independent of the Stage 1 coach. */
export const INDEPENDENT_GUIDE_SEEN_KEY="mathssprites.independent-guide-finished.v1";
export const INDEPENDENT_BRIEFINGS=Object.freeze({
  5:"NEW SKILL · Your hand must now create the same number of whole baskets in EACH chamber. Watch the scale until you have made both moves.",
  9:"NEW SKILL · Some puzzles need more than one type of action. Always complete a matching pair before choosing the next kind.",
  13:"NEW CHALLENGE · Dark sprites appear in both rooms. Choose which room will keep the final sprite, and match every removal."
});
export function readIndependentGuideSeen(storage){
  try{return (storage??globalThis.localStorage)?.getItem(INDEPENDENT_GUIDE_SEEN_KEY)==="yes";}
  catch{return false;}
}
export function writeIndependentGuideSeen(seen,storage){
  try{(storage??globalThis.localStorage)?.setItem(INDEPENDENT_GUIDE_SEEN_KEY,seen?"yes":"no");}catch{}
  return !!seen;
}
/**
 * First Stage 2 lesson: not a modal, never blocks actual hand operations.
 * After the first-room action, point at the OTHER chamber to match the move.
 */
export function independentIntroductionCue(step,{pending=null,busy=false}={}){
  if(pending)return{
    title:"3 · The other room is still waiting!",
    text:"Look at the tilted scale. Now make the SAME action in the other chamber. The balance will settle after your second hand visit.",
    target:pending==="left"?"right-action":"left-action",
    action:null,progress:"4 of 4"
  };
  if(busy)return{
    title:"3 · Watch the scale",
    text:"The hand is moving objects in one chamber. Notice how the rooms tip until you make the matching move.",
    target:"scene",action:null,progress:"4 of 4"
  };
  if(step===0)return{
    title:"You're controlling the hand now",
    text:"The rooms start in perfect balance. In Stage 2, you will make the same change in each room yourself. The hand will not automatically visit the other side.",
    target:"scene",action:"Choose an action",progress:"1 of 4"
  };
  if(step===1)return{
    title:"1 · Choose an action",
    text:"Choose the operation yourself. The same change is needed in both chambers, but you will move each hand separately.",
    target:"actions",action:"Choose the amount",progress:"2 of 4"
  };
  if(step===2)return{
    title:"2 · Choose what and how many",
    text:"Use the object buttons and the plus control to select a quantity. Work out what needs to change from the balance.",
    target:"tools",action:"Try your first hand move",progress:"3 of 4"
  };
  return{
    title:"3 · Make the west move",
    text:"Use either hand first, then perform the same action in the other chamber to level the balance.",
    target:"left-action",action:null,progress:"4 of 4"
  };
}
